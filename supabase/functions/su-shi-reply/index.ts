// ============================================================
// 蘇軾朋友圈 — AI 回覆代理（Supabase Edge Function）
// 部署：supabase/functions/su-shi-reply/index.ts
// ============================================================

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? "";
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

// ============================================================
// 從 DB 讀取回覆模板（取代硬編碼陣列）
// ============================================================
async function loadDBTemplates(): Promise<{generic: string[], smart: {keyword: string, reply: string}[]}> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reply_templates?select=*`, {
      headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
    });
    if (!res.ok) return { generic: [], smart: [] };
    const data = await res.json();
    return {
      generic: (data || []).filter((t: any) => t.type === "generic").map((t: any) => t.reply),
      smart: (data || []).filter((t: any) => t.type === "smart").map((t: any) => ({ keyword: t.keyword || "", reply: t.reply })),
    };
  } catch { return { generic: [], smart: [] }; }
}

// 內建最終 fallback（DB 和 API 都失敗時）
const BUILTIN_FALLBACK = [
  "諸位安好！月色甚美，諸位可願與吾共賞這輪明月？",
  "哈哈，甚好甚好！諸位以為此月如何？",
  "月圓之夜，頗念子由。諸位可有思念之人？",
];

// ============================================================
// 不當內容過濾器（伺服器端驗證 — 與前端同步）
// ============================================================
const PROFANITY_WORDS: string[] = [
  // 中文髒話
  "他媽的","他妈的","tmd","TMD","Tmd",
  "去你媽的","去你妈的","去你的",
  "滾","滾蛋","滾開","給我滾",
  "白癡","白痴","笨蛋","蠢貨","弱智",
  "傻逼","傻比","煞筆","沙雕","傻叉",
  "靠北","幹","幹你娘","操你","草你","操",
  "媽逼","妈逼","馬甲線","媽的","妈的",
  "你媽","你妈","你爹","你爺","尼瑪","尼玛",
  "死人","去死","殺你","殺了","人渣",
  "賤人","贱人","婊子","荡妇","贱货",
  "廢物","废物","垃圾","混蛋","王八蛋",
  "狗東西","狗日的","畜生","禽獸","禽兽",
  "豬頭","猪头","豬腦","猪脑",
  "神經病","精神病","腦殘","脑残","智障",
  "下流","變態","变态","色狼","流氓",
  // 粵語髒話（香港學生常用）
  "屌","屌你","屌嘢","仆街","扑街","pukai","pk",
  "鳩","鳩你","閪","閪样","粉腸","粉肠",
  "冚家鏟","冚家铲","含家鏟","含家铲","冚家富",
  "丟","丟你老母","丟雷樓","丢雷楼",
  "撚","撚你","撚嘢","7你","7野","7up",
  "冚","冚你","冚家","冚場",
  "龍女","龍女服務員","西裝友","鹹濕哥","咸湿",
  "臭西","臭菲","臭飛","死飛","死閪","死閪",
  "靠","靠你","靠你老","頂","頂你","頂你個肺",
  "撚樣","撚七","撚啊","撚啦","撚死",
  "废青","废柴","廢柴",
  // 英文髒話
  "fuck","fucking","fucked","fucker","motherfucker",
  "shit","shitty","bullshit","dumbass",
  "bitch","bitches","sonofabitch","son of a bitch",
  "asshole","ass","bastard","damn","dammit",
  "idiot","stupid","moron","imbecile","dumb",
  "hate","kill","die","death","suicide",
  "retard","retarded","cripple","spaz",
  "nigger","nigga","chink","gook","jap",
  "faggot","gay","lesbian","dyke","tranny",
  "slut","whore","prostitute","hooker","hoe",
  "cock","dick","penis","pussy","cunt",
  "rape","rapist","molest","molester",
  "wank","wanker","tosser","jerk","douche",
  // 其他不當內容
  "色情","賭博","賭錢","毒品","毒藥","毒药",
  "自殺","自杀","上吊","跳樓","跳楼","割腕",
];

// 模糊匹配正則：處理符號變形、字母替換、侮辱性描述
const PROFANITY_REGEX: RegExp[] = [
  /f[\*@#$%!~^x\s]?u[\*@#$%!~^ck\s]*k/gi,
  /sh[\*@#$%!1iIt\s]+t/gi,
  /b[\*@#$%1iI\s]?[\*@#$%1iIt\s]*t[\*@#$%1iIt\s]*c[\*@#$%hH\s]/gi,
  /a[\*@#$%5sS\s]{2}/gi,
  /(很|超|太|好|真|非常|特別|極|绝|最)\s*(醜|丑|胖|肥|矮|搓|窮|穷|笨|蠢|傻|呆|怪|噁|恶心|討厭|讨厌|可惡|可恶|煩|烦|烂|爛)/giu,
  /(蘇軾|蘇東坡|蘇|东坡|子由|苏轼|老师|teacher)\s*(是|真|好|超|很|太|最|極|超級|超级)\s*(醜|丑|胖|肥|矮|搓|窮|穷|笨|蠢|傻|呆|怪|噁|恶心|討厭|讨厌|可惡|可恶|煩|烦|烂|爛|垃圾|廢物|废物|白癡|白痴|傻逼|煞筆|沙雕|無聊|无聊|無趣|无趣|差勁|差劲|爛|爛人|爛鬼|廢|廢柴|废柴|死|死佬|死人|死鬼)/giu,
  /(靠{2,}|屌{2,}|幹{2,}|操{2,}|滾{2,}|笨{2,}|蠢{2,}|傻{2,})/gi,
];

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

    let aiReply: string;

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

    // 從 DB 讀取回覆模板（快取 5 分鐘）
    let dbTemplates = (globalThis as any)._dbTemplatesCache;
    let dbTemplatesTime = (globalThis as any)._dbTemplatesTime || 0;
    if (!dbTemplates || Date.now() - dbTemplatesTime > 5 * 60 * 1000) {
      dbTemplates = await loadDBTemplates();
      (globalThis as any)._dbTemplatesCache = dbTemplates;
      (globalThis as any)._dbTemplatesTime = Date.now();
    }

    // 嘗試 DeepSeek API
    if (DEEPSEEK_API_KEY) {
      try {
        aiReply = await callDeepSeekAPI(student_name, content);
        console.log(`[su-shi-reply] ✅ DeepSeek 回覆成功`);
      } catch (apiError) {
        console.error(`[su-shi-reply] ⚠️ DeepSeek 失敗:`, apiError);
        // 使用 DB 模板
        const generic = dbTemplates?.generic || BUILTIN_FALLBACK;
        aiReply = generic[Math.floor(Math.random() * generic.length)];
        console.log(`[su-shi-reply] 使用 DB 模板回覆:`, aiReply);
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

    // 重要：把 reply 放在回應裡，前端需要它！
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
  return BUILTIN_FALLBACK[Math.floor(Math.random() * BUILTIN_FALLBACK.length)];
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
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
