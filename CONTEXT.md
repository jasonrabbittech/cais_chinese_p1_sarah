# Sarah AI Sushi — Domain Model

Glossary for the Chinese-teaching mini-program where AI personas of classical poets reply to students' comments on shared poems, framed as a "Moments" (朋友圈) feed. This is the canonical terminology. The relational schema lives in `specs/*/data-model.md` — that file describes tables; this file defines what the words mean.

## People

**诗人 (Poet)**
An AI persona embodying a historical classical poet (苏轼 / 李白 / 杜甫 / 李清照). Its "voice" is fixed entirely by a `system_prompt`. Not a real person.
_Avoid_: 角色, 虚拟人物, NPC, 词人

**学生 (Student)**
The learner using the app — reads poems and writes comments. Identified only by a free-text `student_name`; there is no account or auth for students.
_Avoid_: 用户, 玩家, 访客, 学员

**教师 (Teacher)**
The educator/admin who curates reply templates and reviews AI interactions via the admin panel. Distinct actor from Student.
_Avoid_: 管理员, 后台用户, 运营

## Content

**作品 (Post)**
A classical poem a poet shares on their Moments, serving as the prompt for student discussion. Comprises a title, the poem text, and an optional background story.
_Avoid_: 帖子, 状态, 朋友圈动态, 诗文

**评论 (Comment)**
A student's written response to a Post. It is the root of exactly one conversation thread.
_Avoid_: 留言, 留言板, 回复, 评论区

**AI 回复 (AI Reply)**
A poet's AI-generated reply, produced by the `ai-reply` Edge Function. It answers either a Comment (round 1) or a prior AI Reply (round 2+).
_Avoid_: AI回答, 机器回复, 智能回复, 诗人回复

**轮 (Round)**
One exchange within a multi-turn conversation: a `user_message` followed by one `reply_text`. Capped at 5 per thread.
_Avoid_: 回合, 次数, 轮次

**多轮对话 (Conversation)**
The thread rooted at a single Comment, made of up to 5 sequential (user message → AI Reply) exchanges.
_Avoid_: 对话, 聊天, 会话, 私聊

## System & Safety

**人格提示词 (System Prompt)**
The instruction text stored on each Poet that defines its persona, tone, and reply rules. The single source of a poet's voice.
_Avoid_: 提示词, prompt, 人设, 设定

**回复模板 (Reply Template)**
A canned fallback reply (generic, or keyword-triggered) used when the AI provider is unavailable, so the experience never dead-ends.
_Avoid_: 模板, 备用回复, 默认回复

**AI 互动日志 (AI Interaction Log)**
An audit record of each AI call (poet, round, status, flagged content) for safety review. Deliberately contains no student PII.
_Avoid_: 日志, 审计表, 调用记录

**朋友圈 (Moments)**
The product metaphor in which poets "post" and "reply". A framing device only — it is not a data structure.
_Avoid_: 社交平台, 动态墙, 时间线
