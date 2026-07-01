# Feature Specification: AI 古代诗人朋友圈教学小程序

**Feature ID**: 001  
**Feature Name**: ai-poet-friends  
**Created**: 2026-07-01  
**Phase**: Phase 1 (MVP)  
**Status**: Draft

---

## Executive Summary / 概述

### English

A Chinese language teaching mini-program that simulates ancient Chinese poets' social media posts ("moments" / 朋友圈). Students can interact with AI-simulated ancient celebrities by viewing their posts, liking, and commenting. AI responds to student comments in the poet's style and personality. Teachers have administrative capabilities to manage comments, view statistics, and adjust AI behavior.

**Phase 1 Scope**: Simulate Su Shi (苏轼) posting after writing "水调歌头·明月几时有". Students can login with name, like posts, comment, and receive AI replies. Teachers can login with password to moderate content.

### 中文

一个中文教学小程序，模拟中国古代诗人的社交媒体动态（"朋友圈"）。学生可以查看古代名人的动态、点赞和评论，AI 会以诗人的风格和个性回复评论。教师具有管理功能，可以管理评论、查看统计和调整 AI 行为。

**第一期范围**：模拟苏轼在写完《水调歌头·明月几时有》后发布的一篇朋友圈。学生可以输入姓名登录、点赞动态、发表评论，后台对接 AI 由 AI 回复评论。教师输入密码后可登录后台，删除评论、下载评论、统计评论、修改 AI 回复。

---

## User Scenarios / 用户场景

### Scenario 1: Student First-Time Experience (P1)

**As a** student,  
**I want to** view Su Shi's post about "水调歌头·明月几时有" and interact with it,  
**So that** I can learn about the poem's context and practice Chinese in an engaging way.

**Acceptance Criteria**:
- Student can enter their name to "login" (no password required)
- Student can see Su Shi's post with poem, background story, and imagery
- Student can like the post
- Student can write and submit a comment
- Student receives an AI-generated reply in Su Shi's style within 5 seconds
- Student can see all comments and replies

---

### Scenario 2: Student Returning User (P2)

**As a** returning student,  
**I want to** see my previous comments and AI replies,  
**So that** I can review my learning progress and continue the conversation.

**Acceptance Criteria**:
- Student's name is remembered (local storage or session)
- Student can see their comment history on the post
- Student can continue commenting and receiving AI replies

---

### Scenario 3: Teacher Moderation - Delete Comment (P1)

**As a** teacher,  
**I want to** login to an admin panel and delete inappropriate comments,  
**So that** the learning environment remains safe and appropriate.

**Acceptance Criteria**:
- Teacher can access admin panel via a hidden URL or button
- Teacher must enter a password to login (password: configured in system)
- Teacher can see all comments with student names
- Teacher can delete any comment
- Deleted comments are soft-deleted (preserved in database for audit)

---

### Scenario 4: Teacher Analytics - Download Comments (P1)

**As a** teacher,  
**I want to** download all student comments as a CSV file,  
**So that** I can review student engagement and assess learning outcomes.

**Acceptance Criteria**:
- Teacher can click "Download Comments" button in admin panel
- System generates a CSV file with: student name, comment text, timestamp, AI reply, reply timestamp
- File is downloaded to teacher's computer

---

### Scenario 5: Teacher Analytics - View Statistics (P2)

**As a** teacher,  
**I want to** see statistics about student engagement,  
**So that** I can understand class participation and identify trends.

**Acceptance Criteria**:
- Teacher can see: total comments, total likes, active students, comments per student
- Statistics are displayed in a simple dashboard
- Data is real-time (no caching delay)

---

### Scenario 6: Teacher AI Management - Modify AI Reply (P2)

**As a** teacher,  
**I want to** edit or delete AI-generated replies to student comments,  
**So that** I can correct inaccuracies or provide better teaching feedback.

**Acceptance Criteria**:
- Teacher can see all AI replies in admin panel
- Teacher can edit an AI reply (textarea with save button)
- Teacher can delete an AI reply
- Edited/deleted replies are marked as "teacher-modified"

---

### Scenario 7: Responsive Design - Computer and Mobile (P1)

**As a** user (student or teacher),  
**I want to** access the mini-program on both computer and mobile devices,  
**So that** I can use it in different learning environments.

**Acceptance Criteria**:
- Interface adapts to screen size (responsive design)
- Primary use case is computer (larger screen for reading poem)
- Mobile layout is simplified but functional
- All features work on both desktop and mobile browsers

---

## Functional Requirements / 功能需求

### FR-001: Student Login (P1)

**Description**: Students must be able to "login" by entering their name.

**Details**:
- Input field for student name
- No password required
- Name is stored in browser session or local storage
- If name is already stored, auto-login on return visit
- Name must be non-empty (validation)

**Acceptance Criteria**:
- Given I am a student
- When I enter my name and click "Enter"
- Then I am logged in and can see the main post

---

### FR-002: Display Poet's Post (P1)

**Description**: System must display Su Shi's post with poem content and context.

**Details**:
- Post includes: poet avatar, poet name, post timestamp, poem text, background story
- Poem text: "水调歌头·明月几时有" (full text)
- Background story: Brief context about when and why the poem was written
- Visual design: Ancient Chinese aesthetic, readable fonts
- Responsive layout for desktop and mobile

**Acceptance Criteria**:
- Given I am logged in as a student
- When I view the main page
- Then I can see Su Shi's post with poem and background story

---

### FR-003: Like Functionality (P1)

**Description**: Students must be able to like the post.

**Details**:
- Like button with count display
- Students can like/unlike (toggle)
- Like count updates in real-time for all users
- Like is tied to student name (one like per student per post)

**Acceptance Criteria**:
- Given I am logged in as a student
- When I click the like button
- Then the like count increases by 1 and the button shows "liked" state

---

### FR-004: Comment Functionality (P1)

**Description**: Students must be able to write and submit comments.

**Details**:
- Textarea for comment input (max 500 characters)
- Submit button (disabled if empty)
- Comments are displayed in chronological order
- Each comment shows: student name, comment text, timestamp
- Input validation: no empty comments, no profanity (basic filter)

**Acceptance Criteria**:
- Given I am logged in as a student
- When I write a comment and click "Submit"
- Then my comment appears in the comment list with my name and timestamp

---

### FR-005: AI Reply to Comments (P1)

**Description**: System must generate AI replies to student comments in Su Shi's style.

**Details**:
- AI reply is generated via Edge Function calling DeepSeek API
- Reply is in classical Chinese style but accessible to modern students
- Reply length: 50-200 characters
- Reply generation time: under 5 seconds
- Reply is displayed under the student's comment
- If AI fails, show fallback message: "诗人正在思考中，请稍后再来..."

**Acceptance Criteria**:
- Given I am logged in as a student
- When I submit a comment
- Then within 5 seconds, an AI-generated reply appears under my comment

---

### FR-006: Teacher Login (P1)

**Description**: Teachers must be able to login to admin panel with a password.

**Details**:
- Admin panel access: hidden button or URL path (`/admin`)
- Password input field (masked)
- Default password: `teacher123` (configurable via environment variable)
- Failed login attempt: show error message, no lockout (Phase 1)
- Successful login: redirect to admin dashboard

**Acceptance Criteria**:
- Given I am a teacher
- When I navigate to `/admin` and enter the correct password
- Then I am logged in and can see the admin dashboard

---

### FR-007: Teacher Delete Comment (P1)

**Description**: Teachers must be able to delete inappropriate comments.

**Details**:
- Admin dashboard shows all comments with: student name, comment text, timestamp, AI reply
- Delete button next to each comment
- Confirmation dialog: "确定删除这条评论吗？"
- Soft delete: comment is marked as `deleted` in database, not permanently removed
- Deleted comments are hidden from student view but visible to teacher (marked as deleted)

**Acceptance Criteria**:
- Given I am logged in as a teacher
- When I click "Delete" on a comment and confirm
- Then the comment is hidden from student view and marked as deleted in admin view

---

### FR-008: Teacher Download Comments (P1)

**Description**: Teachers must be able to download all comments as CSV.

**Details**:
- "Download Comments" button in admin dashboard
- Generates CSV file with columns: student_name, comment_text, comment_timestamp, ai_reply, reply_timestamp
- File name: `comments_export_YYYYMMDD_HHMMSS.csv`
- File is downloaded to teacher's computer via browser

**Acceptance Criteria**:
- Given I am logged in as a teacher
- When I click "Download Comments"
- Then a CSV file is downloaded with all comment data

---

### FR-009: Teacher View Statistics (P2)

**Description**: Teachers must be able to view basic statistics about student engagement.

**Details**:
- Statistics displayed in admin dashboard:
  - Total comments count
  - Total likes count
  - Number of active students (unique student names)
  - Average comments per student
  - Comments over time (simple line chart or table)
- Data is real-time (fetched from database on page load)

**Acceptance Criteria**:
- Given I am logged in as a teacher
- When I view the admin dashboard
- Then I can see statistics about student engagement

---

### FR-010: Teacher Modify AI Reply (P2)

**Description**: Teachers must be able to edit or delete AI-generated replies.

**Details**:
- Admin dashboard shows AI replies with "Edit" and "Delete" buttons
- Edit: textarea appears with current reply, teacher can modify and save
- Delete: confirmation dialog, reply is hidden from student view
- Modified replies are marked as "teacher-modified" (not attributed to AI)
- Students see modified replies without indication of modification (transparent to students)

**Acceptance Criteria**:
- Given I am logged in as a teacher
- When I edit an AI reply and save
- Then the student sees the teacher's edited reply instead of the original AI reply

---

### FR-011: Responsive Design (P1)

**Description**: Interface must work on both desktop and mobile browsers.

**Details**:
- Responsive CSS using media queries
- Desktop layout: larger fonts, side-by-side layout if appropriate
- Mobile layout: stacked layout, touch-friendly buttons
- Primary use case: computer (design for desktop first, then adapt for mobile)
- Tested on: Chrome (desktop + mobile emulator), Safari (iOS)

**Acceptance Criteria**:
- Given I access the mini-program on a desktop computer
- Then the interface is readable and usable
- Given I access the mini-program on a mobile phone
- Then the interface is readable and usable (may be simplified)

---

### FR-012: Data Persistence (P1)

**Description**: All data (comments, likes, AI replies) must be persisted in Supabase.

**Details**:
- Database tables:
  - `posts`: post_id, poet_name, post_content, created_at
  - `comments`: comment_id, post_id, student_name, comment_text, created_at, is_deleted
  - `likes`: like_id, post_id, student_name, created_at
  - `ai_replies`: reply_id, comment_id, reply_text, created_at, is_modified_by_teacher
- Row Level Security (RLS): students can only read/write their own data; teachers can read all, write only via admin
- Data retention: no automatic deletion (Phase 1)

**Acceptance Criteria**:
- Given a student submits a comment
- When the page is refreshed
- Then the comment is still visible (persisted in database)

---

## Success Criteria / 成功标准

### SC-001: Student Engagement Rate (Measurable)

**Metric**: 80% of students who login submit at least one comment.

**Measurement**: Track number of unique student names with comments / total unique student names who logged in.

**Target**: 80% or higher.

---

### SC-002: AI Reply Generation Time (Measurable)

**Metric**: 95% of AI replies are generated within 5 seconds.

**Measurement**: Log timestamp of comment submission and AI reply completion. Calculate percentile.

**Target**: P95 < 5 seconds.

---

### SC-003: Teacher Task Completion Rate (Measurable)

**Metric**: Teachers can complete core tasks (delete comment, download CSV) without assistance.

**Measurement**: User testing with 3 teachers. Success = all 3 can complete tasks without help.

**Target**: 100% task completion in user testing.

---

### SC-004: Cross-Device Usability (Measurable)

**Metric**: Interface is usable on both desktop and mobile without layout breaking.

**Measurement**: Manual testing on Chrome (desktop + mobile emulator) and Safari (iOS). No horizontal scrolling, no overlapping elements, all buttons clickable.

**Target**: Pass all manual tests.

---

### SC-005: Data Accuracy (Measurable)

**Metric**: Comments and likes are accurately persisted and retrieved.

**Measurement**: Automated tests: submit comment, refresh page, verify comment appears. Submit like, refresh page, verify like count. 100% accuracy required.

**Target**: 100% data accuracy in automated tests.

---

## Key Entities / 关键实体

### Post (帖子)

| Field | Type | Description |
|-------|------|-------------|
| post_id | UUID | Primary key |
| poet_name | String | "苏轼" |
| post_content | Text | Poem text + background story |
| poet_avatar | URL | Poet's avatar image |
| created_at | Timestamp | Post creation time |

---

### Comment (评论)

| Field | Type | Description |
|-------|------|-------------|
| comment_id | UUID | Primary key |
| post_id | UUID | Foreign key to posts |
| student_name | String | Student's name |
| comment_text | Text | Comment content |
| created_at | Timestamp | Comment time |
| is_deleted | Boolean | Soft delete flag |

---

### Like (点赞)

| Field | Type | Description |
|-------|------|-------------|
| like_id | UUID | Primary key |
| post_id | UUID | Foreign key to posts |
| student_name | String | Student's name |
| created_at | Timestamp | Like time |

---

### AI Reply (AI 回复)

| Field | Type | Description |
|-------|------|-------------|
| reply_id | UUID | Primary key |
| comment_id | UUID | Foreign key to comments |
| reply_text | Text | AI-generated reply |
| created_at | Timestamp | Reply time |
| is_modified_by_teacher | Boolean | Whether teacher edited the reply |

---

## Assumptions / 假设

1. **Assumption 1**: Students will use real names or recognizable pseudonyms (no anonymous comments).  
   **Rationale**: Encourages accountability and reduces inappropriate content.

2. **Assumption 2**: Teacher password can be shared via secure channel (WeChat, email) and changed manually in Phase 1.  
   **Rationale**: Phase 1 MVP, full user management is Phase 2.

3. **Assumption 3**: Supabase free tier is sufficient for Phase 1 (500MB database, 500K Edge Function invocations/month).  
   **Rationale**: Small class size (20-50 students), low traffic.

4. **Assumption 4**: DeepSeek API is available and reliable for AI reply generation.  
   **Rationale**: DeepSeek is cost-effective and supports Chinese language well. Fallback message if API fails.

5. **Assumption 5**: Poet's "personality" and reply style can be encoded in a system prompt (no fine-tuning required).  
   **Rationale**: Large language models (DeepSeek) can adopt personas via prompting.

6. **Assumption 6**: Students access the mini-program via web browser (not WeChat mini-program framework).  
   **Rationale**: Web-based is easier to deploy (GitHub Pages) and works on both desktop and mobile.

---

## Edge Cases / 边界情况

1. **Edge Case 1**: Student name contains profanity or inappropriate content.  
   **Handling**: Basic profanity filter on name input (client-side and server-side). If flagged, show error: "请使用合适的姓名".

2. **Edge Case 2**: Two students have the same name.  
   **Handling**: Allow duplicate names in Phase 1 (no unique constraint). In Phase 2, add student ID or class selection.

3. **Edge Case 3**: AI API fails or times out.  
   **Handling**: Show fallback message: "诗人正在思考中，请稍后再来...". Log error for debugging.

4. **Edge Case 4**: Teacher forgets password.  
   **Handling**: Phase 1: Password is hardcoded in environment variable, can be reset by developer. Phase 2: Password reset via email.

5. **Edge Case 5**: Student submits empty comment (spaces only).  
   **Handling**: Trim input, check if empty after trimming. Reject if empty.

6. **Edge Case 6**: High traffic (all students commenting at same time).  
   **Handling**: Edge Functions automatically scale. Database connection pooling via Supabase. If database hits limits, show "系统繁忙，请稍后再试".

7. **Edge Case 7**: Student accesses admin panel URL.  
   **Handling**: Admin panel requires password. Even if student guesses URL, they cannot access without password.

---

## Out of Scope / 范围外

The following items are explicitly **out of scope** for Phase 1 and will be addressed in Phase 2:

1. **Multiple Poets**: Only Su Shi is supported in Phase 1. Phase 2 will add support for multiple poets (李白, 杜甫, etc.).

2. **System Prompt Configuration**: Teachers cannot customize AI personality in Phase 1. System prompt is hardcoded. Phase 2 will add UI for configuring poet personality, background, reply style.

3. **Sensitive Word Filtering**: Basic profanity filter only in Phase 1. Phase 2 will add configurable sensitive word list.

4. **Preset Reply Templates**: Not included in Phase 1. Phase 2 will allow teachers to create preset replies for common questions.

5. **Upload Avatar / Background Images**: Not included in Phase 1. Phase 2 will allow teachers to upload poet avatar and post background images.

6. **Student Accounts with Authentication**: No real user accounts in Phase 1 (name only). Phase 2 may add Supabase Auth for students.

7. **Class Management**: No class/section support in Phase 1. All students are in one "class". Phase 2 will add class management.

8. **Advanced Analytics**: Only basic statistics in Phase 1 (count, simple charts). Phase 2 will add advanced analytics (sentiment analysis, learning outcomes).

---

## Phase 1 Simplifications / 一期简化

The following items are **intentionally simplified in Phase 1** due to MVP constraints. These are **known technical debt** items that will be addressed in Phase 2.

| Item | Spec Requirement | Phase 1 Implementation | Rationale | Phase 2 Fix |
|------|------------------|-------------------------|-----------|-------------|
| **Likes Persistence** | FR-003: Like count updates in real-time for all users | localStorage only (per-user, not shared) | Simplifying MVP — likes are nice-to-have | Create `likes` table in Supabase, implement real-time like count |
| **Teacher Password** | IV. Security by Default: No secrets in frontend | Hardcoded in `index.html` (password: `cais2024`) | Phase 1 MVP — only 1 teacher, low security risk | Move to Supabase Edge Function validation or Supabase Auth |
| **Comment Deletion** | FR-007: Soft delete (marked as `deleted`) | Hard delete (permanent removal from DB) | Simplifying MVP — audit not required in Phase 1 | Add `is_deleted` field, implement soft delete |
| **AI Reply Editing** | FR-010: Teacher can edit AI replies | Not implemented (T015 not started) | Phase 1 scope reduction | Implement T015 in Phase 2 |
| **Analytics Tracking** | SC-001: 80% engagement rate measurement | Manual measurement via CSV export | Phase 1 MVP — no automated analytics | Add analytics events table, automated reporting |
| **AI Performance Logging** | SC-002: P95 < 5s measurement | No logging infrastructure | Phase 1 MVP — can measure manually | Add `ai_reply_logs` table with timestamps |

**Note to Developers**: These simplifications are **acceptable for Phase 1 MVP** but **must be addressed before scaling to multiple classes or production use with real student data**. See `plan.md` "Technical Debt" section for tracking.

---

## Phase 2 Preview / 二期预览

The following features are planned for Phase 2 (separate specification will be created):

1. **Multiple Poets Support**: Add 李白, 杜甫, 白居易, etc.
2. **System Prompt Configuration UI**: Teachers can edit poet personality, background story, reply style.
3. **Upload Images**: Teachers can upload poet avatar and post background images.
4. **Sensitive Word Management**: Configurable sensitive word list with add/delete functionality.
5. **Preset Reply Templates**: Teachers can create preset replies for common student questions.
6. **Student Accounts**: Optional Supabase Auth for students (email or student ID).
7. **Class Management**: Support multiple classes, each with different poets/posts.
8. **Advanced Analytics**: Sentiment analysis, learning outcome tracking, export reports.

---

## Appendix: AI System Prompt (Phase 1 Hardcoded)

**Note**: This is the system prompt that will be used in Phase 1. In Phase 2, this will be configurable via UI.

```
你是一位名叫苏轼（苏东坡）的古代中国诗人。你刚刚创作了《水调歌头·明月几时有》这首词。

你的性格特点：
- 豁达乐观，即使被贬官也能保持开朗
- 幽默风趣，喜欢用比喻和典故
- 关心民间疾苦，有同情心
- 热爱自然，尤其喜欢月亮和酒

创作背景：
这首词写于宋神宗熙宁九年（1076年）中秋，当时苏轼在密州（今山东诸城）任知州。他已经六年未见弟弟苏辙（子由），中秋之夜，月色美好，他喝了很多酒，写下这首词。

回复风格：
- 用半文半白的语言（学生能看懂，但有古风）
- 回复长度：50-200字
- 可以引用自己的其他诗句
- 可以问学生问题，引导思考
- 不要过于严肃，可以适当幽默

现在，请回复学生的评论。学生的评论会用"学生："开头。
```

---

**End of Specification**
