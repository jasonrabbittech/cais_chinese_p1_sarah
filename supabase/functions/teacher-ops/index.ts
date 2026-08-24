// ============================================================
// 教師後台操作代理（Edge Function）— Feature 003
// 用途：教師後台的寫入操作（發布開關、違禁詞 CRUD、留言刪除、
//       AI 回覆編輯、回覆模板 CRUD）
//
// 鑑權（憲法 IV / FR-004）：每個業務 action 前驗證 Authorization
//   中的教師 JWT（轉發至 /auth/v1/user），無效一律 401。
//   教師帳號僅 Dashboard 手動建立（註冊已關閉），凡能登入者即教師。
// 限流（憲法 VI / FR-006）：12 次/分鐘/IP（記憶體令牌桶）。
//
// 完整契約：specs/003-teacher-admin-portal/contracts/teacher-ops-api.md
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const RATE_LIMIT = 12; // 次/窗口
const RATE_WINDOW_MS = 60_000;

// ============================================================
// 工具函數
// ============================================================

/** 生成 CORS 回應標頭（憲法 IV：僅允許明確設定的來源） */
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

/** 統一 JSON 回應（附本次請求的 CORS 標頭） */
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

/** 驗證是否為合法 UUID */
function isValidUUID(v: unknown): v is string {
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** 取得客戶端 IP（限流用） */
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";
}

/** 記憶體令牌桶限流（best-effort，實例重啟即重置） */
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

/**
 * 教師身份驗證（FR-004）：將 Authorization token 轉發至 GoTrue /auth/v1/user。
 * 200 且角色為 authenticated → 有效教師；否則拒絕。
 * 過期/吊銷/偽造/anon key 均由 Supabase Auth 權威判定（research.md D1）。
 */
async function requireTeacher(
  req: Request,
): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === SUPABASE_ANON_KEY) {
    return { ok: false, reason: "缺少教師身份憑證" };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) {
      return { ok: false, reason: "身份憑證無效或已過期" };
    }
    const user = await res.json();
    if (user?.role && user.role !== "authenticated") {
      return { ok: false, reason: "非教師身份" };
    }
    return { ok: true, email: user?.email ?? "unknown" };
  } catch (e) {
    console.error("[teacher-ops] 驗證異常:", e);
    return { ok: false, reason: "身份驗證服務不可用" };
  }
}

/** 經 service_role 呼叫 Supabase REST（忽略 RLS） */
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

// ============================================================
// 主入口
// ============================================================
Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, cors);
    }

    // 限流（FR-006）
    const ip = getClientIp(req);
    if (!rateLimit(ip)) {
      return jsonResponse({ error: "請求過於頻繁，請稍後再試" }, 429, cors);
    }

    // 教師鑑權（FR-004）— 所有業務操作前置
    const auth = await requireTeacher(req);
    if (!auth.ok) {
      return jsonResponse({ error: auth.reason }, 401, cors);
    }

    const body = await req.json().catch(() => null);
    const action = body?.action;

    switch (action) {
      // ---------- 詩人/作品發布開關（002 既有） ----------
      case "toggle_publish": {
        const table = body?.table;
        const id = body?.id;
        if (!["poets", "posts"].includes(table) || !isValidUUID(id)) {
          return jsonResponse({ error: "缺少或無效的 table/id" }, 400, cors);
        }
        const getRes = await supabaseRest(
          `${table}?id=eq.${id}&select=is_published`,
          { method: "GET" },
        );
        if (!getRes.ok) return jsonResponse({ error: "讀取失敗" }, 500, cors);
        const rows = await getRes.json();
        if (!rows?.length) {
          return jsonResponse({ error: "記錄不存在" }, 404, cors);
        }
        const current = rows[0].is_published;
        const updRes = await supabaseRest(`${table}?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_published: !current }),
        });
        if (!updRes.ok) return jsonResponse({ error: "更新失敗" }, 500, cors);
        return jsonResponse(
          { success: true, is_published: !current },
          200,
          cors,
        );
      }

      // ---------- 違禁詞 CRUD（002 既有 + 長度校驗） ----------
      case "add_word": {
        const word = typeof body?.word === "string" ? body.word.trim() : "";
        const isRegex = body?.is_regex === true;
        if (!word || word.length > 100) {
          return jsonResponse(
            { error: "word 必填且長度 ≤100" },
            400,
            cors,
          );
        }
        const res = await supabaseRest("profanity_words", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify([
            { word, is_regex: isRegex, is_active: true },
          ]),
        });
        if (!res.ok) {
          const errText = await res.text();
          return jsonResponse(
            { error: "新增失敗: " + errText.slice(0, 200) },
            409,
            cors,
          );
        }
        return jsonResponse({ success: true }, 200, cors);
      }

      case "toggle_word": {
        const id = body?.id;
        if (!isValidUUID(id)) {
          return jsonResponse({ error: "無效的 id" }, 400, cors);
        }
        const getRes = await supabaseRest(
          `profanity_words?id=eq.${id}&select=is_active`,
          { method: "GET" },
        );
        if (!getRes.ok) return jsonResponse({ error: "讀取失敗" }, 500, cors);
        const rows = await getRes.json();
        if (!rows?.length) {
          return jsonResponse({ error: "記錄不存在" }, 404, cors);
        }
        const res = await supabaseRest(`profanity_words?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: !rows[0].is_active }),
        });
        if (!res.ok) return jsonResponse({ error: "更新失敗" }, 500, cors);
        return jsonResponse({ success: true }, 200, cors);
      }

      case "delete_word": {
        const id = body?.id;
        if (!isValidUUID(id)) {
          return jsonResponse({ error: "無效的 id" }, 400, cors);
        }
        const res = await supabaseRest(
          `profanity_words?id=eq.${id}`,
          { method: "DELETE" },
        );
        if (!res.ok) return jsonResponse({ error: "刪除失敗" }, 500, cors);
        return jsonResponse({ success: true }, 200, cors);
      }

      // ---------- 留言刪除（003 新增 / FR-005） ----------
      case "delete_comment": {
        const id = body?.id;
        if (!isValidUUID(id)) {
          return jsonResponse({ error: "無效的 id" }, 400, cors);
        }
        // 先查存在性（404 語義）；ai_replies 由 DB ON DELETE CASCADE 級聯刪除
        const getRes = await supabaseRest(
          `comments?id=eq.${id}&select=id`,
          { method: "GET" },
        );
        const rows = getRes.ok ? await getRes.json() : [];
        if (!rows?.length) {
          return jsonResponse({ error: "留言不存在" }, 404, cors);
        }
        const res = await supabaseRest(`comments?id=eq.${id}`, {
          method: "DELETE",
        });
        if (!res.ok) return jsonResponse({ error: "刪除失敗" }, 500, cors);
        return jsonResponse({ success: true }, 200, cors);
      }

      case "delete_all_comments": {
        // 強制顯式確認欄位（防誤觸；UI 另有 confirm 彈窗雙重防護）
        if (body?.confirm !== true) {
          return jsonResponse(
            { error: "缺少 confirm:true 確認欄位" },
            400,
            cors,
          );
        }
        const res = await supabaseRest(
          `comments?select=id`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          return jsonResponse({ error: "刪除失敗" }, 500, cors);
        }
        const deleted = await res.json();
        return jsonResponse(
          { success: true, deleted: Array.isArray(deleted) ? deleted.length : 0 },
          200,
          cors,
        );
      }

      // ---------- AI 回覆編輯（003 新增 / FR-005，Clarification Q1） ----------
      case "edit_reply": {
        const id = body?.id;
        const replyText = typeof body?.reply_text === "string"
          ? body.reply_text.trim()
          : "";
        if (!isValidUUID(id)) {
          return jsonResponse({ error: "無效的 id" }, 400, cors);
        }
        if (!replyText || replyText.length > 2000) {
          return jsonResponse(
            { error: "reply_text 必填且長度 ≤2000" },
            400,
            cors,
          );
        }
        // 任意輪次均可編輯；保存即無條件標記 teacher-edited（審計透明）
        const res = await supabaseRest(`ai_replies?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            reply_text: replyText,
            source: "teacher-edited",
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return jsonResponse(
            { error: "更新失敗: " + errText.slice(0, 200) },
            500,
            cors,
          );
        }
        const rows = await res.json();
        if (!rows?.length) {
          return jsonResponse({ error: "回覆不存在" }, 404, cors);
        }
        return jsonResponse(
          {
            success: true,
            reply_text: replyText,
            source: "teacher-edited",
          },
          200,
          cors,
        );
      }

      // ---------- 回覆模板 CRUD（003 新增 / FR-005） ----------
      case "add_template": {
        const type = body?.type;
        const reply = typeof body?.reply === "string" ? body.reply.trim() : "";
        const keyword = typeof body?.keyword === "string"
          ? body.keyword.trim()
          : null;
        if (!["generic", "smart"].includes(type)) {
          return jsonResponse({ error: "type 須為 generic 或 smart" }, 400, cors);
        }
        if (!reply || reply.length > 1000) {
          return jsonResponse(
            { error: "reply 必填且長度 ≤1000" },
            400,
            cors,
          );
        }
        if (type === "smart" && !keyword) {
          return jsonResponse(
            { error: "smart 模板必須提供 keyword" },
            400,
            cors,
          );
        }
        const res = await supabaseRest("reply_templates", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify([{ type, keyword, reply }]),
        });
        if (!res.ok) {
          const errText = await res.text();
          return jsonResponse(
            { error: "新增失敗: " + errText.slice(0, 200) },
            500,
            cors,
          );
        }
        return jsonResponse({ success: true }, 200, cors);
      }

      case "edit_template": {
        const id = body?.id;
        const reply = typeof body?.reply === "string" ? body.reply.trim() : "";
        const keyword = typeof body?.keyword === "string"
          ? body.keyword.trim()
          : null;
        if (!isValidUUID(id)) {
          return jsonResponse({ error: "無效的 id" }, 400, cors);
        }
        if (!reply || reply.length > 1000) {
          return jsonResponse(
            { error: "reply 必填且長度 ≤1000" },
            400,
            cors,
          );
        }
        const res = await supabaseRest(`reply_templates?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            reply,
            keyword,
            updated_at: new Date().toISOString(),
          }),
        });
        if (!res.ok) return jsonResponse({ error: "更新失敗" }, 500, cors);
        const rows = await res.json();
        if (!rows?.length) {
          return jsonResponse({ error: "模板不存在" }, 404, cors);
        }
        return jsonResponse({ success: true }, 200, cors);
      }

      case "delete_template": {
        const id = body?.id;
        if (!isValidUUID(id)) {
          return jsonResponse({ error: "無效的 id" }, 400, cors);
        }
        const res = await supabaseRest(
          `reply_templates?id=eq.${id}`,
          { method: "DELETE" },
        );
        if (!res.ok) return jsonResponse({ error: "刪除失敗" }, 500, cors);
        return jsonResponse({ success: true }, 200, cors);
      }

      default:
        return jsonResponse(
          { error: "未知操作: " + String(action) },
          400,
          cors,
        );
    }
  } catch (error) {
    console.error("[teacher-ops] 💥", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "未知錯誤" },
      500,
      cors,
    );
  }
});
