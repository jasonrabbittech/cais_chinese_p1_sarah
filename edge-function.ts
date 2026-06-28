// ============================================================
// 蘇軾朋友圈 — AI 回覆代理（Supabase Edge Function）
// 格式：Deno.serve（Deno 2 原生，無需外部 serve 套件）
// 部署：
//   1. Supabase Dashboard → Edge Functions → su-shi-reply
//   2. 貼上此程式碼
//   3. Settings → Secrets 加入 DEEPSEEK_API_KEY
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";

// ── 蘇軾系統提示詞 ──
const SU_SHI_SYSTEM_PROMPT = `你是蘇軾（苏东坡，1037-1101），北宋著名文學家、書法家、美食家。
你正在使用一個名為「朋友圈」的現代社交平台，剛剛發了一條狀態。

【你的性格特點】
- 豁達樂觀，雖仕途坎坷但總能苦中作樂
- 文采斐然，擅長用詩詞表達情感
- 幽默風趣，喜歡開玩笑，平易近人
- 熱愛美食，懂生活情趣
- 思念親人（尤其弟弟蘇轍），但不沉溺於悲傷
- 有哲學思辨，常從自然中獲得人生感悟

【創作背景：《水調歌頭·明月幾時有》】
- 時間：宋神宗熙寧九年（1076年）中秋夜
- 地點：密州（今山東諸城）
- 情境：你因與王安石變法派政見不合，自請外放已五年
- 心情：與弟弟蘇轍七年未見，中秋夜獨飲至天明，既有政治失意的苦悶，
  又有對親人的思念，最終昇華為「但願人長久，千里共嬋娟」的豁達

【你的這條朋友圈內容】
「丙辰中秋，歡飲達旦，大醉... 月亮真圓啊。子由（蘇轍）你在齊州還好嗎？
人有悲歡離合，月有陰晴圓缺，此事古難全。但願人長久，千里共嬋娟。」

【回覆要求】
1. 用文言文與現代漢語結合的語言風格（偏白話，讓學生能看懂）
2. 回覆要簡短（50-150字），符合朋友圈留言風格
3. 根據學生的留言內容，靈活結合《水調歌頭》的情感
4. 適當引用你的詩詞名句，但不生硬
5. 偶爾用「哈哈」、「呵呵」等語氣詞
6. 絕對不要說「我是AI」或「我是語言模型」
只輸出回覆內容，不要加前綴。`;

// ── 固定回覆模板（API 不可用時）──
const FALLBACK_REPLIES = [
  "諸位安好！月色甚美，諸位可願與吾共賞這輪明月？",
  "哈哈，甚好甚好！諸位以為此月如何？",
  "月圓之夜，頗念子由。諸位可有思念之人？",
  "人生如月，有圓有缺。諸位且珍惜當下，莫負良宵。",
  "美酒配明月，人生一大樂事也！諸位以為然否？",
  "子由若在，定當共飲此夜。諸位家中可有兄弟姊妹？",
  "但願人長久，千里共嬋娟——這句話，諸位讀來有何感觸？",
  "密州雖好，終非故里。諸位可有思鄉之時？",
];

// ============================================================
// 主入口 — 使用 Deno 2 原生 Deno.serve()
// ============================================================

// ============================================================
// 不當內容過濾器（伺服器端驗證）
// ============================================================
const PROFANITY_WORDS = [
  "髒話","他媽的","tmd","TMD",
  "去你媽的","去你的","滾","滾蛋",
  "笨蛋","傻逼","煞筆","沙雕",
  "靠北","幹","幹你","操你",
  "死人","去死","殺你","人渣",
  "廢物","垃圾","混蛋","王八蛋",
  "媽的","你媽",
  "冚家鏟","冚家鏟","含家鏟","含家鏟",
  "丟","丟你","撚","撚你",
  "fuck","shit","bitch","asshole","bastard","damn",
  "idiot","stupid","hate","kill","die","retard",
  "nigger","faggot",
  "色情","賭博","毒品","自殺","自殺",
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  for (const word of PROFANITY_WORDS) {
    if (lower.includes(word.toLowerCase())) return true;
  }
  const patterns = [/f\s*u\s*c\s*k/gi, /s\s*h\s*i\s*t/gi, /b\s*i\s*t\s*c\s*h/gi];
  for (const re of patterns) {
    if (re.test(text)) return true;
  }
  return false;
}


Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  try {
    // 只接受 POST
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const record = body?.record;

    if (!record || !record.id) {
      console.error("[su-shi-reply] 缺少 record 或 record.id");
      return jsonResponse({ error: "缺少 comment 記錄", fallback: false }, 400);
    }

    const { id, student_name, content } = record;
    console.log(`[su-shi-reply] 📨 收到留言: ${student_name} — ${content}`);

    // 不當內容檢查
    if (containsProfanity(content)) {
      console.warn(`[su-shi-reply] ⚠️ 檢測到不當內容: ${student_name}`);
      aiReply = "同學，請使用文明用語。蘇某雖豪放，亦講禮儀。🙏";
      // 寫入資料庫並返回
      if (SERVICE_ROLE_KEY) {
        try { await updateCommentDB(id, aiReply); } catch(e) { console.error(e); }
      }
      return jsonResponse({ success: true, reply: aiReply, flagged: true });
    }

    let aiReply: string;

    // 嘗試 DeepSeek API
    if (DEEPSEEK_API_KEY) {
      try {
        aiReply = await callDeepSeekAPI(student_name, content);
        console.log(`[su-shi-reply] ✅ DeepSeek 回覆成功`);
      } catch (apiError) {
        console.error(`[su-shi-reply] ⚠️ DeepSeek 失敗:`, apiError);
        aiReply = randomFallback();
      }
    } else {
      console.warn(`[su-shi-reply] ⚠️ DEEPSEEK_API_KEY 未設定`);
      aiReply = randomFallback();
    }

    // 寫入資料庫
    if (SERVICE_ROLE_KEY) {
      try {
        await updateCommentDB(id, aiReply);
        console.log(`[su-shi-reply] ✅ 已寫入資料庫`);
      } catch (dbError) {
        console.error(`[su-shi-reply] ❌ 寫入 DB 失敗:`, dbError);
        // 仍然返回 reply，前端會嘗試自己寫入
      }
    }

    // 🔑 重要：把 reply 放在回應裡，前端需要它！
    return jsonResponse({ success: true, reply: aiReply });

  } catch (error) {
    console.error("[su-shi-reply] 💥 未捕獲異常:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});

// ============================================================
// DeepSeek API 呼叫
// ============================================================
async function callDeepSeekAPI(studentName: string, content: string): Promise<string> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SU_SHI_SYSTEM_PROMPT },
        { role: "user", content: `學生 ${studentName} 留言：${content}\n\n請以蘇軾的身份回覆這條留言。` },
      ],
      temperature: 0.8,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ============================================================
// 更新 comments 表（service_role 無視 RLS）
// ============================================================
async function updateCommentDB(id: string, aiReply: string): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/comments?id=eq.${id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      ai_reply: aiReply,
      replied_at: new Date().toISOString(),
      is_replying: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DB update ${res.status}: ${errText}`);
  }
}

// ── 工具函數 ──
function randomFallback(): string {
  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
