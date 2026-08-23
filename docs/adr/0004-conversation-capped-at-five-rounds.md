# Multi-turn conversations are capped at 5 rounds

Each Comment's conversation may contain at most 5 rounds (`ai_replies.round` CHECK `1..5`). This bounds token spend and the abuse surface per student while still feeling like a real back-and-forth.

**Consequences**
- Very engaged learners are arbitrarily cut off after round 5; 5 was chosen as the point where pedagogical value flattens relative to cost, not from a pedagogical requirement.
