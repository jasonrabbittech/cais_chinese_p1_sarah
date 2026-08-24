# Contract: ai-summary Edge Function

**Feature**: 004-poet-cms-engagement  
**Endpoint**: `POST {SUPABASE_URL}/functions/v1/ai-summary`  
**鉴权**: 同 teacher-ops（教师 JWT，GoTrue 转发验证，无效 401）  
**限流**: 6 次/分钟/IP（总结调用重，比 teacher-ops 更严）  
**CORS**: 同 teacher-ops（ALLOWED_ORIGINS）  
**超时**: AI 调用 30s（宪法 VI）

---

## 通用

| 项 | 规则 |
|----|------|
| 方法 | POST（OPTIONS preflight 204） |
| 错误格式 | `{ "error": "<原因>" }`（同 teacher-ops） |
| 成功格式 | `{ "success": true, ... }` |

---

## Actions

### class_summary —— 班级互动一键总结

```json
// 请求
{ "action": "class_summary" }
// 成功 200
{
  "success": true,
  "summary": "本次課堂共有 18 位學生參與…（AI 生成的叙述性中文总结）",
  "stats": { "students": 18, "comments": 42, "followups": 27, "poets": 3 }
}
// 失败 502（DeepSeek 不可用等）
{ "error": "總結生成失敗，請稍後重試" }
```

行为：聚合近 200 条留言+追问（含诗人/作品上下文与学生名）→ DeepSeek 生成 200–400 字叙述总结（谁活跃、讨论主题、亮点）；stats 为确定性计数（非 AI 生成）。

### top_questions —— Top 3 优质问题评估

```json
// 请求
{ "action": "top_questions" }
// 成功 200
{
  "success": true,
  "questions": [
    { "student": "張小明", "text": "蘇軾你被貶官後為什麼還能這麼豁達？", "poet": "蘇軾", "reason": "觸及人物精神世界，有思考深度" },
    …  // 最多 3 条
  ]
}
// 评估失败但请求成功（降级）
{ "success": true, "questions": [], "warning": "暫無法評估，請稍後重試" }
```

行为：取学生提问（首轮留言 + 追问）→ DeepSeek 按相关性/思考深度评估选出 Top 3 并给出一句话理由；参与评估的问题需已通过敏感词过滤；不足 3 条时返回实际条数。

---

## 输入组装上限（宪法 VI token 保护）

- 最多近 **200 条**互动（时间倒序截断）
- 单条文本截断 200 字符
- DeepSeek `max_tokens`: 总结 600 / 评估 500
