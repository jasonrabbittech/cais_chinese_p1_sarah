# 測試報告 — Feature 002：多詩人 + 多作品 + AI 多輪對話

**Feature ID**: 002  
**測試日期**: 2026-07-01  
**測試環境**: Testing Supabase (`gjbdqcjyliuxrnmwotvc`) + Staging GitHub Pages  
**相關遷移**: `002_multi_poet.sql`, `002_backfill.sql`  
**相關 Edge Function**: `ai-reply`  
**相關前端**: `index.html`

---

## 執行前準備

```bash
# 1. 套用遷移
supabase db push --linked --project-ref gjbdqcjyliuxrnmwotvc

# 2. 部署 Edge Function（含 ALLOWED_ORIGINS / DEEPSEEK_API_KEY / SERVICE_ROLE_KEY）
supabase functions deploy ai-reply --project-ref gjbdqcjyliuxrnmwotvc

# 3. 在 Supabase Secrets 設定 ai-reply 的 ALLOWED_ORIGINS
```

---

## 測試場景（對應 quickstart.md）

### Scenario A：多詩人選擇（P1）

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| A1 | 開啟 App | 頂部顯示 4 位詩人標籤（蘇軾/李白/杜甫/李清照） | ☐ |
| A2 | 選李白 | 作品下拉切換為李白的作品 | ☐ |
| A3 | 對李白作品留言 | AI 以李白風格回覆 | ☐ |
| A4 | 切到杜甫 | 作品與回覆風格不同 | ☐ |

**通過標準**：每位詩人 AI 回覆風格明顯不同。

### Scenario B：多輪對話（P1）

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| B1 | 留言 | 第 1 輪回覆出現 | ☐ |
| B2 | 點「繼續提問」 | 出現追問輸入框 | ☐ |
| B3 | 提交追問 | 第 2 輪回覆（線程式）出現 | ☐ |
| B4 | 重複至第 5 輪 | 第 5 輪後「繼續提問」停用 | ☐ |
| B5 | 重新整理 | 所有輪次保留 | ☐ |

**通過標準**：線程依序顯示第 1→5 輪。

### Scenario C：Realtime 多作品（P2）

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| C1 | 開兩個視窗，不同作品 | — | ☐ |
| C2 | 在視窗 1 對作品 A 留言 | 視窗 2（作品 B）**不**看到 | ☐ |
| C3 | 在視窗 2 對作品 A 留言 | 視窗 2（作品 A）即時看到 | ☐ |

**通過標準**：Realtime 依 post_id 正確過濾，無跨作品洩漏。

### Scenario D：遷移安全（P1）

| Step | Action | Expected | Result |
|------|--------|----------|--------|
| D1 | 遷移後開 App | Phase 1 舊留言仍在 | ☐ |
| D2 | 檢查舊留言 | AI 回覆已回填至 ai_replies（第 1 輪） | ☐ |
| D3 | 對蘇軾作品新留言 | 正常運作 | ☐ |

**通過標準**：Phase 1 資料零遺失。

---

## 憲法合規檢查（F1–F7）

| 項目 | 驗證 | Status |
|------|------|--------|
| F1 限流 (VI) | `ai-reply` 實作 IP 令牌桶（12 次/分） | ☐ |
| F2 AI 日誌 (VI) | `ai_interaction_logs` 表寫入來源/輪次/標記 | ☐ |
| F3 每詩人統計 (T030) | 教師後台顯示詩人/作品上下文 | ☐ |
| F4 CORS (IV) | `ALLOWED_ORIGINS` 顯式來源清單 | ☐ |
| F6 JSDoc (VII) | `ai-reply` 主要函數含 JSDoc | ☐ |
| F7 30s 超時 (VI) | `AbortController` 30s | ☐ |

---

## Phase 1 回歸

- [ ] `comments` 表公開讀/寫正常
- [ ] `reply_templates` 教師管理正常
- [ ] 點讚 / 姓名輸入正常

---

## 總結

| 項目 | 狀態 |
|------|------|
| 實作完成 | ✅ |
| 單元/整合測試（需於 Staging 執行） | ⏳ 待執行 |
| 結論 | 待 Staging 驗證後合併至 main |

**備註**：本報告為測試計畫與結果紀錄模板；實際 ✅ 勾選需於 Testing Supabase 部署後執行。
