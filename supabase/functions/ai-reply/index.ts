// ============================================================
// 多詩人 AI 回覆代理（Supabase Edge Function）
// 部署：supabase/functions/ai-reply/index.ts
// 取代 Phase 1 的 su-shi-reply（詩人無關 / 多輪對話）
//
// 請求 body：
//   { comment_id: string, parent_reply_id?: string, user_message?: string }
//   - 第 1 輪：僅 comment_id（原始留言即為 user_message）
//   - 第 N 輪：comment_id + parent_reply_id（前一轮回覆）+ user_message（追問）
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
// 憲法 IV：CORS 僅允許明確設定的來源；未設定時退回 "*"（本地開發用，部署時應於 Supabase Secrets 設定 ALLOWED_ORIGINS）
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_ROUNDS = 5;
const AI_TIMEOUT_MS = 30_000; // 憲法 VI：AI 呼叫最多 30 秒

// ============================================================
// 不當內容過濾器（伺服器端驗證 — 憲法 VI）
// ============================================================
const PROFANITY_WORDS: string[] = [
  "他媽的","他妈的","tmd","去你媽的","去你妈的","去你的","滾","滾蛋","滾開",
  "白癡","白痴","笨蛋","蠢貨","傻逼","煞筆","沙雕","靠北","幹","幹你娘","操你","草你","操",
  "媽逼","妈逼","媽的","妈的","你媽","你妈","死人","去死","殺你","人渣","賤人","贱人",
  "廢物","废物","垃圾","混蛋","王八蛋","狗日的","畜生","豬頭","腦殘","脑残","智障","變態","变态",
  "冚家鏟","冚家铲","丟你老母","撚","靠","頂你個肺",
  "fuck","shit","bitch","asshole","bastard","damn","idiot","stupid","hate","kill","die","retard",
  "nigger","faggot","slut","whore","rape","色情","賭博","毒品","自殺","自杀",
];
const PROFANITY_REGEX: RegExp[] = [
  /f[\*@#$%!~^x\s]?u[\*@#$%!~^ck\s]*k/gi,
  /sh[\*@#$%!1iIt\s]+t/gi,
  /b[\*@#$%1iI\s]?[\*@#$%1iIt\s]*t[\*@#$%1iIt\s]*c[\*@#$%hH\s]/gi,
  /(靠{2,}|屌{2,}|幹{2,}|操{2,}|滾{2,}|笨{2,}|蠢{2,}|傻{2,})/gi,
];

/** 檢測文字是否含不當內容（憲法 VI：防止提示注入 / 不當輸出） */
function containsProfanity(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const word of PROFANITY_WORDS) {
    if (lower.includes(word.toLowerCase())) return true;
  }
  for (const re of PROFANITY_REGEX) {
    if (re.test(text)) { re.lastIndex = 0; return true; }
  }
  return false;
}

// ============================================================
// 內建最終 fallback（DB 與 API 都失敗時，依詩人個性）
// ============================================================
const BUILTIN_FALLBACK: Record<string, string[]> = {
  "苏轼": ["諸位安好！月色甚美，可願與吾共賞此夜？🌙", "哈哈，甚好甚好！諸位以為如何？", "月圓之夜，頗念子由。諸位可有思念之人？"],
  "李白": ["哈哈，月色正好，與吾共飲一杯否？🍶", "長風破浪會有時，諸位且放懷！", "人生得意須盡歡，諸位以為然否？"],
  "杜甫": ["諸位安好。天下寒士，吾常繫於心。", "務實為要，諸位且勉之。", "風雨如晦，諸位保重。"],
  "李清照": ["知否知否，應是綠肥紅瘦。諸位可曾惜花？🌸", "且慢飲茶，細說來由。", "此情此景，正宜填詞一首。"],
};
function fallbackReply(poetName: string): string {
  const list = BUILTIN_FALLBACK[poetName] || BUILTIN_FALLBACK["苏轼"];
  return list[Math.floor(Math.random() * list.length)];
}

// ============================================================
// 工具函數
// ============================================================
/** 驗證是否為合法 UUID */
function isValidUUID(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** 取得客戶端 IP（用於限流，憲法 VI） */
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

/** 簡易記憶體令牌桶限流（best-effort，憲法 VI）。實例重啟即重置。 */
const rateMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const LIMIT = 12; // 每窗口最多 12 次
  const WINDOW_MS = 60_000;
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= LIMIT) return false;
  rec.count++;
  return true;
}

/** 生成 CORS 回應標頭（憲法 IV：僅允許明確設定的來源） */
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWED_ORIGINS.length
    ? (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
    : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };
}

/** 統一 JSON 回應 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeadersFromLastReq },
  });
}
// 由於 corsHeaders 依賴 req，jsonResponse 使用最近一次請求的標頭
let corsHeadersFromLastReq: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

/** 經 service_role 呼叫 Supabase REST（忽略 RLS） */
async function supabaseRest(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init.headers || {}),
    },
  });
}

// ============================================================
// 資料存取
// ============================================================
interface ConversationContext {
  comment: { id: string; student_name: string; content: string };
  post: { id: string; title: string };
  poet: { id: string; name: string; system_prompt: string };
}

/** 載入留言 → 作品 → 詩人（含 system_prompt） */
async function loadContext(commentId: string): Promise<ConversationContext | null> {
  const res = await supabaseRest(
    `comments?id=eq.${commentId}&select=id,student_name,content,post_id,posts(id,title,poet_id,poets(id,name,system_prompt))`,
    { method: "GET" }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  const row = rows?.[0];
  if (!row || !row.posts || !row.posts.poets) return null;
  return {
    comment: { id: row.id, student_name: row.student_name, content: row.content },
    post: { id: row.posts.id, title: row.posts.title },
    poet: {
      id: row.posts.poets.id,
      name: row.posts.poets.name,
      system_prompt: row.posts.poets.system_prompt,
    },
  };
}

interface ReplyRow {
  id: string;
  round: number;
  user_message: string | null;
  reply_text: string;
  parent_reply_id: string | null;
}

/** 載入歷史對話（依 round 升冪） */
async function loadHistory(commentId: string): Promise<ReplyRow[]> {
  const res = await supabaseRest(
    `ai_replies?comment_id=eq.${commentId}&select=id,round,user_message,reply_text,parent_reply_id&order=round.asc`,
    { method: "GET" }
  );
  if (!res.ok) return [];
  return (await res.json()) || [];
}

/** 寫入一筆 ai_replies */
async function insertReply(r: {
  comment_id: string;
  user_message: string;
  reply_text: string;
  round: number;
  parent_reply_id: string | null;
}): Promise<{ id: string } | null> {
  const res = await supabaseRest(`ai_replies`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([
      {
        comment_id: r.comment_id,
        user_message: r.user_message,
        reply_text: r.reply_text,
        round: r.round,
        parent_reply_id: r.parent_reply_id,
      },
    ]),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[ai-reply] ❌ 寫入 ai_replies 失敗:", res.status, errText);
    return null;
  }
  const rows = await res.json();
  return rows?.[0] || null;
}

/** 更新 comment 的 is_replying 狀態 */
async function setReplying(commentId: string, value: boolean): Promise<void> {
  const res = await supabaseRest(`comments?id=eq.${commentId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_replying: value }),
  });
  if (!res.ok) console.error("[ai-reply] ⚠️ 更新 is_replying 失敗:", res.status);
}

/** 寫入 AI 互動日誌（憲法 VI：審計用，不含敏感資料） */
async function logInteraction(p: {
  comment_id: string;
  poet_id: string;
  round: number;
  source: string;
  flagged: boolean;
  status: string;
  error_message?: string;
}): Promise<void> {
  try {
    await supabaseRest(`ai_interaction_logs`, {
      method: "POST",
      body: JSON.stringify([
        {
          comment_id: p.comment_id,
          poet_id: p.poet_id,
          round: p.round,
          source: p.source,
          flagged: p.flagged,
          status: p.status,
          error_message: p.error_message ?? null,
        },
      ]),
    });
  } catch (e) {
    console.warn("[ai-reply] ⚠️ 寫入互動日誌失敗（不影響回覆）:", e);
  }
}

// ============================================================
// DeepSeek 呼叫（含 30s 超時，憲法 VI）
// ============================================================
/**
 * 呼叫 DeepSeek 產生多輪對話回覆
 * @param systemPrompt 詩人系統提示詞
 * @param history 歷史對話（依 round 升冪）
 * @param newMessage 本輪學生留言
 * @param studentName 學生姓名
 * @param poetName 詩人名稱
 */
async function callDeepSeek(
  systemPrompt: string,
  history: ReplyRow[],
  newMessage: string,
  studentName: string,
  poetName: string
): Promise<string> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];
  for (const h of history) {
    if (h.user_message) messages.push({ role: "user", content: h.user_message });
    messages.push({ role: "assistant", content: h.reply_text });
  }
  messages.push({
    role: "user",
    content: `學生 ${studentName} 留言：${newMessage}\n\n請以${poetName}的身份回覆這條留言（多輪對話的第 ${history.length + 1} 輪）。`,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.8,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// 主入口
// ============================================================
Deno.serve(async (req: Request) => {
  corsHeadersFromLastReq = corsHeaders(req);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => null);
    const comment_id: unknown = body?.comment_id;
    const parent_reply_id: unknown = body?.parent_reply_id;
    const user_message: unknown = body?.user_message;

    // 輸入驗證（憲法 II/IV/VI）
    if (!isValidUUID(comment_id)) {
      return jsonResponse({ error: "缺少或無效的 comment_id" }, 400);
    }
    if (parent_reply_id !== undefined && parent_reply_id !== null && !isValidUUID(parent_reply_id)) {
      return jsonResponse({ error: "無效的 parent_reply_id" }, 400);
    }

    // 限流（憲法 VI）
    const ip = getClientIp(req);
    if (!rateLimit(ip)) {
      return jsonResponse({ error: "請求過於頻繁，請稍後再試" }, 429);
    }

    // 載入上下文
    const ctx = await loadContext(comment_id as string);
    if (!ctx) {
      return jsonResponse({ error: "找不到該留言或尚未綁定作品" }, 404);
    }

    // 載入歷史並計算下一輪
    const history = await loadHistory(comment_id as string);
    const nextRound = history.length ? Math.max(...history.map((h) => h.round)) + 1 : 1;
    if (nextRound > MAX_ROUNDS) {
      return jsonResponse({ error: `已達最多 ${MAX_ROUNDS} 輪對話` }, 429);
    }

    // 驗證 parent_reply_id 歸屬與輪次
    let parentId: string | null = null;
    if (parent_reply_id) {
      const parent = history.find((h) => h.id === parent_reply_id);
      if (!parent || parent.comment_id !== comment_id) {
        return jsonResponse({ error: "parent_reply_id 不屬於此留言" }, 400);
      }
      if (parent.round !== nextRound - 1) {
        return jsonResponse({ error: "必須針對最新一輪回覆" }, 400);
      }
      parentId = parent.id;
    }

    // 本輪學生訊息：第 1 輪用原始留言，否則用追問
    const studentMessage: string =
      nextRound === 1 ? ctx.comment.content : String(user_message ?? "").trim();
    if (!studentMessage) {
      return jsonResponse({ error: "追問內容不能為空" }, 400);
    }

    console.log(`[ai-reply] 📨 ${ctx.poet.name} | 第 ${nextRound} 輪 | ${ctx.comment.student_name}: ${studentMessage}`);

    let reply: string;
    let source: string;
    let flagged = false;

    // 不當內容檢查（憲法 VI）
    if (containsProfanity(studentMessage)) {
      flagged = true;
      reply = "同學，請使用文明用語。吾雖豪放，亦講禮儀。🙏";
      source = "content-filter";
    } else if (DEEPSEEK_API_KEY) {
      try {
        reply = await callDeepSeek(ctx.poet.system_prompt, history, studentMessage, ctx.comment.student_name, ctx.poet.name);
        source = "deepseek";
        // 輸出過濾（憲法 VI）
        if (containsProfanity(reply)) {
          reply = fallbackReply(ctx.poet.name);
          source = "fallback-filtered";
        }
      } catch (apiError) {
        console.error("[ai-reply] ⚠️ DeepSeek 失敗:", apiError);
        reply = fallbackReply(ctx.poet.name);
        source = "fallback";
      }
    } else {
      console.warn("[ai-reply] ⚠️ DEEPSEEK_API_KEY 未設定");
      reply = fallbackReply(ctx.poet.name);
      source = "fallback-nokey";
    }

    // 寫入 ai_replies
    const inserted = await insertReply({
      comment_id: comment_id as string,
      user_message: studentMessage,
      reply_text: reply,
      round: nextRound,
      parent_reply_id: parentId,
    });

    // 解除「回覆中」狀態
    await setReplying(comment_id as string, false);

    // 互動日誌（憲法 VI）
    await logInteraction({
      comment_id: comment_id as string,
      poet_id: ctx.poet.id,
      round: nextRound,
      source,
      flagged,
      status: inserted ? "ok" : "db_write_failed",
    });

    return jsonResponse({
      success: true,
      reply,
      round: nextRound,
      reply_id: inserted?.id ?? null,
      poet_name: ctx.poet.name,
    });
  } catch (error) {
    console.error("[ai-reply] 💥 未捕獲異常:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "未知錯誤" }, 500);
  }
});
