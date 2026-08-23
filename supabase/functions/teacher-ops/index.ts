// ============================================================
// 教師後台操作代理（Edge Function）
// 用途：教師後台的寫入操作（發布/隱藏詩人作品、違禁詞 CRUD）
//
// 請求 body：
//   { action: "toggle_publish", table: "poets"|"posts", id: uuid }
//   { action: "add_word", word: string, is_regex?: boolean }
//   { action: "toggle_word", id: uuid }
//   { action: "delete_word", id: uuid }
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map(s => s.trim()).filter(Boolean);

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

let lastCorsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...lastCorsHeaders },
  });
}

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

Deno.serve(async (req: Request) => {
  lastCorsHeaders = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => null);
    const action = body?.action;

    switch (action) {
      case "toggle_publish": {
        const table = body?.table;
        const id = body?.id;
        if (!["poets", "posts"].includes(table) || !id) {
          return jsonResponse({ error: "缺少 table 或 id" }, 400);
        }
        const getRes = await supabaseRest(`${table}?id=eq.${id}&select=is_published`, { method: "GET" });
        if (!getRes.ok) return jsonResponse({ error: "讀取失敗" }, 500);
        const rows = await getRes.json();
        if (!rows?.length) return jsonResponse({ error: "記錄不存在" }, 404);
        const current = rows[0].is_published;
        const updRes = await supabaseRest(`${table}?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_published: !current }),
        });
        if (!updRes.ok) return jsonResponse({ error: "更新失敗" }, 500);
        return jsonResponse({ success: true, is_published: !current });
      }

      case "add_word": {
        const word = body?.word;
        const isRegex = body?.is_regex || false;
        if (!word || !word.trim()) return jsonResponse({ error: "缺少 word" }, 400);
        const res = await supabaseRest("profanity_words", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify([{ word: word.trim(), is_regex: isRegex, is_active: true }]),
        });
        if (!res.ok) {
          const errText = await res.text();
          return jsonResponse({ error: "新增失敗: " + errText }, 409);
        }
        return jsonResponse({ success: true });
      }

      case "toggle_word": {
        const id = body?.id;
        if (!id) return jsonResponse({ error: "缺少 id" }, 400);
        const getRes = await supabaseRest(`profanity_words?id=eq.${id}&select=is_active`, { method: "GET" });
        if (!getRes.ok) return jsonResponse({ error: "讀取失敗" }, 500);
        const rows = await getRes.json();
        if (!rows?.length) return jsonResponse({ error: "記錄不存在" }, 404);
        const res = await supabaseRest(`profanity_words?id=eq.${id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_active: !rows[0].is_active }),
        });
        if (!res.ok) return jsonResponse({ error: "更新失敗" }, 500);
        return jsonResponse({ success: true });
      }

      case "delete_word": {
        const id = body?.id;
        if (!id) return jsonResponse({ error: "缺少 id" }, 400);
        const res = await supabaseRest(`profanity_words?id=eq.${id}`, { method: "DELETE" });
        if (!res.ok) return jsonResponse({ error: "刪除失敗" }, 500);
        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "未知操作: " + action }, 400);
    }
  } catch (error) {
    console.error("[teacher-ops] 💥", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "未知錯誤" }, 500);
  }
});
