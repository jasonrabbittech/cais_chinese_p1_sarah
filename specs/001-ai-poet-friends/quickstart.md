# Quickstart Guide: AI 古代诗人朋友圈教学小程序

**Feature ID**: 001  
**Created**: 2026-07-01  
**Purpose**: Validation guide for testing the feature end-to-end

---

## Prerequisites / 前置条件

### 1. Supabase Project Setup

**Production Environment**:
- Project: `Sarah_Chinese_P1`
- Project ID: `pzatgmavjvrastnumxty`
- Region: `ap-southeast-2`

**Testing Environment**:
- Project: `cais-chinese-p1-sarah-testing`
- Project ID: (to be determined)
- Region: `ap-southeast-2`

### 2. Environment Variables

**Frontend** (in `inject-env.js` or Supabase client init):
```javascript
const SUPABASE_URL = 'https://pzatgmavjvrastnumxty.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // anon key
```

**Edge Function** (in Supabase Secrets):
- `DEEPSEEK_API_KEY`: DeepSeek API key

### 3. Database Schema

**Tables**:
- `comments` (with RLS enabled)
- `reply_templates` (with RLS enabled)

**Initial Data**:
- 16 reply templates (8 generic + 8 smart)

---

## Validation Scenarios / 验证场景

### Scenario 1: Student First-Time Experience (P1)

**Objective**: Verify student can login, view post, comment, and receive AI reply.

**Steps**:

1. **Open index.html in browser**
   - Expected: Login modal appears

2. **Enter student name "测试学生1" and click "进入"**
   - Expected: Modal closes, main post appears
   - Expected: Post shows "苏轼", poem "水调歌头·明月几时有", background story

3. **Click like button**
   - Expected: Like count increases (if persisted to DB)
   - Expected: Button shows "liked" state

4. **Write comment "苏轼先生，你的词写得太好了！" and click "发送"**
   - Expected: Comment appears in comment list with name "测试学生1"
   - Expected: Message "诗人正在思考中..." appears under comment
   - Expected: Within 5 seconds, AI reply appears (in classical Chinese style)

5. **Refresh page**
   - Expected: Comment and AI reply still visible (persisted in DB)

**Success Criteria**:
- ✅ Student can login with name
- ✅ Post displays correctly
- ✅ Comment submits successfully
- ✅ AI reply generates within 5 seconds
- ✅ Data persists after refresh

---

### Scenario 2: Teacher Moderation (P1)

**Objective**: Verify teacher can login, delete comment, download CSV.

**Steps**:

1. **Click "教师入口" button (bottom right corner)**
   - Expected: Teacher login modal appears

2. **Enter password "cais2024" and click "登录"**
   - Expected: Modal closes, admin panel appears
   - Expected: All comments displayed with student names

3. **Click "删除" button on a comment**
   - Expected: Confirmation dialog appears
   - Expected: After confirm, comment removed from list

4. **Click "下载评论" button**
   - Expected: CSV file downloads with columns: student_name, comment_text, created_at, ai_reply, replied_at

5. **View statistics**
   - Expected: Total comments count, total likes, active students count displayed

**Success Criteria**:
- ✅ Teacher can login with password
- ✅ Teacher can delete comments
- ✅ Teacher can download CSV
- ✅ Statistics display correctly

---

### Scenario 3: AI Reply Quality (P1)

**Objective**: Verify AI reply is in Su Shi's style and appropriate.

**Steps**:

1. **Submit comment with keyword "月亮"**
   - Expected: AI reply mentions moon, uses classical Chinese style
   - Expected: Reply length 50-200 characters

2. **Submit comment with keyword "兄弟"**
   - Expected: AI reply mentions 子由 (Su Zhe), talks about brotherhood

3. **Submit comment without keywords (generic)**
   - Expected: AI reply uses generic template (one of 8)

4. **Test profanity filter**
   - Expected: Comment with bad words is rejected or filtered

**Success Criteria**:
- ✅ AI reply matches Su Shi's personality
- ✅ Smart templates match keywords correctly
- ✅ Generic templates used as fallback
- ✅ Profanity filter works

---

### Scenario 4: Responsive Design (P1)

**Objective**: Verify UI works on desktop and mobile.

**Steps**:

1. **Open in Chrome desktop (1920x1080)**
   - Expected: Layout displays correctly, no horizontal scroll
   - Expected: All buttons clickable

2. **Open in Chrome mobile emulator (375x667, iPhone SE)**
   - Expected: Layout adapts, no horizontal scroll
   - Expected: Buttons touch-friendly (min 44px)

3. **Open in Safari iOS (real device or emulator)**
   - Expected: Same as Chrome mobile

**Success Criteria**:
- ✅ No layout breaking on desktop
- ✅ No layout breaking on mobile
- ✅ All features usable on both devices

---

### Scenario 5: Error Handling (P2)

**Objective**: Verify system handles errors gracefully.

**Steps**:

1. **Disconnect internet, submit comment**
   - Expected: Error message appears, comment not lost (queued or retried)

2. **Simulate DeepSeek API failure (wrong API key)**
   - Expected: Fallback message "诗人正在思考中，请稍后再来..." appears

3. **Submit empty comment**
   - Expected: Validation error, submit button disabled

4. **Submit comment with 501 characters**
   - Expected: Validation error, max 500 characters

**Success Criteria**:
- ✅ Errors handled gracefully (no crash)
- ✅ User-friendly error messages
- ✅ Input validation works

---

## Automated Validation / 自动化验证

### Script: `validate.js` (to be created)

```javascript
// Pseudo-code for automated validation
async function validateScenario1() {
  // 1. Login
  await loginAsStudent('测试学生1');
  
  // 2. Verify post displays
  const post = await getPost();
  assert(post.poetName === '苏轼');
  
  // 3. Submit comment
  const comment = await submitComment('测试评论');
  assert(comment.content === '测试评论');
  
  // 4. Wait for AI reply (max 5 seconds)
  const reply = await waitForAIReply(comment.id, 5000);
  assert(reply !== null);
  assert(reply.length >= 50 && reply.length <= 200);
  
  // 5. Refresh and verify persistence
  await refreshPage();
  const comments = await getComments();
  assert(comments.includes(comment.id));
}

async function validateScenario2() {
  // 1. Login as teacher
  await loginAsTeacher('cais2024');
  
  // 2. Verify admin panel loads
  const stats = await getStats();
  assert(stats.totalComments >= 0);
  
  // 3. Delete a comment
  const commentId = await getFirstCommentId();
  await deleteComment(commentId);
  
  // 4. Verify comment deleted
  const comments = await getComments();
  assert(!comments.includes(commentId));
}
```

---

## Performance Benchmarks / 性能基准

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Page load time (3G) | < 3 seconds | Chrome DevTools Network tab |
| AI reply generation | < 5 seconds (P95) | Log timestamps in Edge Function |
| Database query (SELECT *) | < 500ms (p95) | Supabase Dashboard → Logs |
| Edge Function cold start | < 1 second | Supabase Dashboard → Edge Functions → Logs |

---

## Deployment Validation / 部署验证

### Staging Environment (testing branch)

1. **Push to `testing` branch**
2. **Wait for GitHub Actions to deploy**
3. **Verify in staging URL** (GitHub Pages)
4. **Run validation scenarios above**

### Production Environment (main branch)

1. **Merge `testing` to `main` via PR**
2. **Wait for GitHub Actions to deploy**
3. **Verify in production URL** (GitHub Pages)
4. **Run validation scenarios above**

---

## Troubleshooting / 故障排除

### Issue: AI reply not generating

**Possible Causes**:
1. DeepSeek API key not set in Supabase Secrets
2. Edge Function not deployed
3. DeepSeek API timeout ( > 30s)

**Solution**:
- Check Supabase Dashboard → Edge Functions → `su-shi-reply` → Logs
- Verify `DEEPSEEK_API_KEY` is set in Supabase Secrets

---

### Issue: Comments not persisting

**Possible Causes**:
1. Supabase anon key incorrect
2. RLS policies blocking INSERT
3. Database connection failed

**Solution**:
- Check browser console for errors
- Verify Supabase URL and anon key in `inject-env.js`
- Check Supabase Dashboard → Database → Logs

---

### Issue: Teacher login fails

**Possible Causes**:
1. Password incorrect (should be `cais2024`)
2. JavaScript error in login logic

**Solution**:
- Check browser console for errors
- Verify password in `index.html` (search for `cais2024`)

---

**End of Quickstart Guide**
