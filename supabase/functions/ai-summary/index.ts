// ============================================================
// 班級互動 AI 總結（Edge Function）— Feature 004
// 用途：教師後台「統計」Tab 的一鍵總結與 Top 問題評估
//
// 鑑權：同 teacher-ops（教師 JWT 轉發驗證，無效 401）
// 限流：6 次/分鐘/IP（總結調用重，比 teacher-ops 更嚴）
// 超時：AI 調用 30s（憲法 VI）；輸入截斷 200 條防 token 超限
//
// 契約：specs/004-poet-cms-engagement/contracts/ai-summary-api.md
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const RATE_LIMIT = 6;
const RATE_WINDOW_MS = 60_000;
const AI_TIMEOUT_MS = 30_000;
const MAX_INTERACTIONS = 200;

// ============================================================
// 工具（同 teacher-ops 模式，單文件自包含）
// ============================================================

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allow = ALLOWED_ORIGINS.length
    ? (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0])
    : "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";
}

const rateMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (rec.count >= RATE_LIMIT) return false;
  rec.count++;
  return true;
}

/** 教師身份驗證（同 teacher-ops：GoTrue 轉發） */
async function requireTeacher(
  req: Request,
): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === SUPABASE_ANON_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    });
    if (!res.ok) return false;
    const user = await res.json();
    return !user?.role || user.role === "authenticated";
  } catch {
    return false;
  }
}

async function supabaseRest(
  path: string,
  init: RequestInit,
): Promise<Response> {
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

/** 基本敏感詞檢查（輸出過濾，輕量版 — 憲法 VI） */
const OUTPUT_BLOCKLIST = [
  "他媽的", "他妈的", "幹你娘", "操你", "傻逼", "智障", "自殺", "自杀",
  "fuck", "shit", "bitch", "nigger",
];
function outputClean(text: string): boolean {
  const lower = text.toLowerCase();
  return !OUTPUT_BLOCKLIST.some((w) => lower.includes(w.toLowerCase()));
}

/** DeepSeek 呼叫（30s 超時，憲法 VI） */
async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<string> {
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 150)}`);
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content ?? "").trim();
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// 數據聚合
// ============================================================

interface Interaction {
  student: string;
  poet: string;
  post: string;
  text: string;
  round: number; // 1=首輪留言, >1=追問
  created_at: string;
}

/** 拉取近 N 條互動（留言 + 追問，含詩人/作品上下文） */
async function loadInteractions(): Promise<Interaction[]> {
  const list: Interaction[] = [];
  // 首輪留言
  const cRes = await supabaseRest(
    `comments?select=student_name,content,created_at,posts(title,poets(name))&order=created_at.desc&limit=${MAX_INTERACTIONS}`,
    { method: "GET" },
  );
  if (cRes.ok) {
    const rows = await cRes.json();
    (rows || []).forEach((r: Record<string, unknown>) => {
      const post = r.posts as Record<string, unknown> | null;
      const poet = post?.poets as Record<string, unknown> | null;
      list.push({
        student: String(r.student_name ?? ""),
        poet: String(poet?.name ?? "未知"),
        post: String(post?.title ?? ""),
        text: String(r.content ?? "").slice(0, 200),
        round: 1,
        created_at: String(r.created_at ?? ""),
      });
    });
  }
  // 追問（round>1 的 ai_replies.user_message）
  const fRes = await supabaseRest(
    `ai_replies?round=gt.1&user_message=not.is.null&select=user_message,round,created_at,comments(student_name,posts(title,poets(name)))&order=created_at.desc&limit=${MAX_INTERACTIONS}`,
    { method: "GET" },
  );
  if (fRes.ok) {
    const rows = await fRes.json();
    (rows || []).forEach((r: Record<string, unknown>) => {
      const c = r.comments as Record<string, unknown> | null;
      const post = c?.posts as Record<string, unknown> | null;
      const poet = post?.poets as Record<string, unknown> | null;
      list.push({
        student: String(c?.student_name ?? ""),
        poet: String(poet?.name ?? "未知"),
        post: String(post?.title ?? ""),
        text: String(r.user_message ?? "").slice(0, 200),
        round: Number(r.round ?? 2),
        created_at: String(r.created_at ?? ""),
      });
    });
  }
  // 按時間倒序 + 截斷
  list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return list.slice(0, MAX_INTERACTIONS);
}

// ============================================================
// 主入口
// ============================================================
Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, cors);
    }
    if (!rateLimit(getClientIp(req))) {
      return jsonResponse({ error: "請求過於頻繁，請稍後再試" }, 429, cors);
    }
    if (!(await requireTeacher(req))) {
      return jsonResponse({ error: "未授權" }, 401, cors);
    }
    if (!DEEPSEEK_API_KEY) {
      return jsonResponse({ error: "AI 總結未配置（DEEPSEEK_API_KEY 缺失）" }, 503, cors);
    }

    const body = await req.json().catch(() => null);
    const action = body?.action;
    const interactions = await loadInteractions();

    if (interactions.length === 0) {
      return jsonResponse(
        { error: "暫無互動數據，無法總結" },
        400,
        cors,
      );
    }

    if (action === "class_summary") {
      // 確定性統計（非 AI 生成）
      const students = new Set(interactions.map((i) => i.student));
      const poets = new Set(interactions.map((i) => i.poet));
      const stats = {
        students: students.size,
        comments: interactions.filter((i) => i.round === 1).length,
        followups: interactions.filter((i) => i.round > 1).length,
        poets: poets.size,
      };
      const lines = interactions.map((i) =>
        `[${i.poet}《${i.post}》] ${i.student}${i.round > 1 ? "追問" : "留言"}：${i.text}`
      ).join("\n");
      const summary = await callDeepSeek(
        "你是一位語文課堂的助教。請根據學生與古代詩人「朋友圈」的互動記錄，生成 200–400 字的班級互動總結（繁體中文）。內容包括：哪些學生最活躍、討論的主要話題與亮點、學生對詩人的理解程度觀察。語氣專業且鼓勵。只輸出總結正文。",
        `互動記錄（共 ${interactions.length} 條）：\n${lines}`,
        600,
      );
      if (!summary) {
        return jsonResponse({ error: "總結生成失敗，請稍後重試" }, 502, cors);
      }
      if (!outputClean(summary)) {
        return jsonResponse({ error: "總結內容未通過安全檢查，請重試" }, 502, cors);
      }
      return jsonResponse({ success: true, summary, stats }, 200, cors);
    }

    if (action === "top_questions") {
      // 僅學生提問（首輪+追問都是學生的問題），排除命中敏感詞的
      const questions = interactions.filter((i) => outputClean(i.text));
      if (questions.length === 0) {
        return jsonResponse(
          { success: true, questions: [], warning: "暫無可評估的問題" },
          200,
          cors,
        );
      }
      const raw = await callDeepSeek(
        '你是語文課堂助教。從學生向古代詩人提問的清單中，選出質量最高的前 3 條（按相關性、思考深度、啟發性評估）。嚴格只輸出 JSON 數組，格式：[{"student":"姓名","text":"問題原文","poet":"詩人名","reason":"一句話評語"}]，不輸出其他任何文字。不足 3 條時返回實際數量。',
        `問題清單：\n${questions.map((q, i) => `${i + 1}. [${q.student}→${q.poet}] ${q.text}`).join("\n")}`,
        500,
      );
      let parsed: unknown[] = [];
      try {
        const m = raw.match(/\[[\s\S]*\]/);
        parsed = m ? JSON.parse(m[0]) : [];
      } catch {
        parsed = [];
      }
      if (!Array.isArray(parsed) || !parsed.length) {
        return jsonResponse(
          { success: true, questions: [], warning: "評估暫時不可用，請稍後重試" },
          200,
          cors,
        );
      }
      const out = parsed.slice(0, 3).map((q) => {
        const o = q as Record<string, unknown>;
        return {
          student: String(o.student ?? "").slice(0, 50),
          text: String(o.text ?? "").slice(0, 300),
          poet: String(o.poet ?? "").slice(0, 30),
          reason: String(o.reason ?? "").slice(0, 100),
        };
      }).filter((q) => q.text);
      return jsonResponse({ success: true, questions: out }, 200, cors);
    }

    return jsonResponse({ error: "未知操作: " + String(action) }, 400, cors);
  } catch (error) {
    console.error("[ai-summary] 💥", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      500,
      cors,
    );
  }
});
