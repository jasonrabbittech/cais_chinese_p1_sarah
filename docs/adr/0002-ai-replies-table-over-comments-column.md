# Conversation threads stored in a dedicated `ai_replies` table

Replies live in `ai_replies` — one row per round (`comment_id`, `user_message`, `reply_text`, `round`, `parent_reply_id`) — not in the legacy `comments.ai_reply` text column. A separate table was required for multi-turn dialogue, per-post Realtime filtering, and querying whole threads.

The old `comments.ai_reply` / `is_replying` / `replied_at` columns are retained (nullable) only for backwards-compatible backfill and are **deprecated** — do not build new logic on them.

**Consequences**
- New replies require an extra insert and a join to reconstruct a thread, vs. the previous single-column simplicity.
- Frontend subscribes to `ai_replies` (and `comments`) via Realtime, filtered by `post_id`/`comment_id`.
