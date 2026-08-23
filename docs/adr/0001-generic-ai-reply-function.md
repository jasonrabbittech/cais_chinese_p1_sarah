# Generic `ai-reply` Edge Function replaces per-poet functions

Feature 001 shipped a Su-Shi-only function `su-shi-reply`. Feature 002 replaced it with a single generic `ai-reply` Edge Function that loads the target poet's `system_prompt` from the `poets` table at call time, keyed by `poet_id`. This lets any number of poets be supported by seed data rather than code changes.

**Considered options**
- Per-poet functions (`su-shi-reply`, `li-bai-reply`, …): trivial per function, but every new poet needs a new deploy.
- One generic function with DB-driven prompts (chosen): slightly more logic (prompt lookup, persona switching) but adding a poet is a data insert, not a redeploy.
