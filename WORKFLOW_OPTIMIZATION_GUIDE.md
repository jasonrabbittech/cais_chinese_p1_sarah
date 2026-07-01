# Sarah-AI-Sushi 工作流優化指南

## 📋 概述

本文檔描述了優化後的 **testing → production** 完整部署流程，包含 Supabase 測試/生產環境分離和 GitHub 審批機制。

---

## 🏗️ 架構設計

### 環境配置

| 環境 | 分支 | Supabase 項目 | GitHub Pages | 審批要求 |
|------|------|---------------|--------------|----------|
| **Staging** | `testing` | `gjbdqcjyliuxrnmwotvc` | `staging` 環境 | 無（自動部署） |
| **Production** | `main` | `pzatgmavjvrastnumxty` | `production` 環境 | ✅ 需要審批 |

### 部署組件

1. **前端** (HTML/CSS/JS) → GitHub Pages
2. **Edge Function** (TypeScript/Deno) → Supabase Edge Functions
3. **數據庫遷移** (SQL migrations) → Supabase Database

---

## 🔄 完整工作流程

### 階段 1: 本地開發

```bash
# 1. 確保在 testing 分支
cd /Users/a/CodeBuddy/Sarah-AI-sushi
git checkout testing
git pull origin testing

# 2. 創建功能分支
git checkout -b feature/新功能名稱

# 3. 開發和本地測試
# - 前端: 直接在瀏覽器打開 index.html
# - Edge Function: supabase functions serve su-shi-reply
# - 數據庫: supabase db diff（查看變更）

# 4. 提交到功能分支
git add .
git commit -m "feat: 添加新功能"
git push origin feature/新功能名稱

# 5. 創建 PR 到 testing 分支
# 在 GitHub 上創建 PR: testing ← feature/新功能名稱
```

### 階段 2: 測試環境部署（自動）

**觸發條件**:
- 推送代碼到 `testing` 分支
- 或合併 PR 到 `testing` 分支

**自動執行的操作**:
1. ✅ 構建前端（注入 testing 環境變量）
2. ✅ 部署到 GitHub Pages (staging)
3. ✅ 部署 Edge Function 到 Testing Supabase
4. ✅ 執行數據庫遷移（如有變更）

**部署時間**: 約 3-5 分鐘

**驗證 URL**:
- 前端: `https://jasonrabbittech.github.io/cais_chinese_p1_sarah/` (staging)
- Edge Function: `https://gjbdqcjyliuxrnmwotvc.supabase.co/functions/v1/su-shi-reply`

### 階段 3: 生產環境部署（需審批）

**觸發條件**:
- 推送代碼到 `main` 分支
- 或合併 PR 到 `main` 分支

**審批流程**:
1. 🔔 GitHub 自動創建部署審批請求
2. 👤 審批人在 GitHub 上審查代碼和測試結果
3. ✅ 審批通過 → 自動部署到生產環境
4. ❌ 審批拒絕 → 部署中止

**部署步驟**:
1. ✅ 預部署檢查（代碼驗證）
2. ✅ 構建前端（注入 production 環境變量）
3. ✅ 部署到 GitHub Pages (production)
4. ✅ 部署 Edge Function 到 Production Supabase
5. ✅ 執行數據庫遷移（如有變更）
6. ✅ 部署後驗證

**部署時間**: 約 5-10 分鐘（不含審批時間）

**生產 URL**:
- 前端: `https://jasonrabbittech.github.io/cais_chinese_p1_sarah/` (production)
- Edge Function: `https://pzatgmavjvrastnumxty.supabase.co/functions/v1/su-shi-reply`

---

## 🔧 配置步驟

### 1. 配置 GitHub Environments（審批門控）

**操作步驟**:

1. 進入 GitHub 倉庫 → **Settings** → **Environments**
2. 創建 `production` 環境：
   - 點擊 **New environment**
   - 名稱: `production`
   - 點擊 **Configure environment**
   - 啟用 **Required reviewers**
   - 添加審批人（至少 1 人）
   - 保存
3. 創建 `staging` 環境（可選）：
   - 名稱: `staging`
   - 不需要審批配置

**截图说明**:
```
Settings → Environments
  ├── production (Required reviewers: @jasonrabbittech)
  └── staging (No protection rules)
```

### 2. 配置 GitHub Secrets

進入 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

**Testing 環境變量**:
| Secret 名稱 | 值 | 說明 |
|------------|-----|------|
| `TESTING_SUPABASE_PROJECT_REF` | `gjbdqcjyliuxrnmwotvc` | Testing Supabase 項目 ID |
| `TESTING_SUPABASE_ANON_KEY` | `eyJhbGc...` | Testing Supabase Anon Key |
| `TESTING_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Testing Supabase Service Role Key |

**Production 環境變量**:
| Secret 名稱 | 值 | 說明 |
|------------|-----|------|
| `PROD_SUPABASE_PROJECT_REF` | `pzatgmavjvrastnumxty` | Production Supabase 項目 ID |
| `PROD_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production Supabase Anon Key |
| `PROD_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Production Supabase Service Role Key |

**通用環境變量**:
| Secret 名稱 | 值 | 說明 |
|------------|-----|------|
| `SUPABASE_ACCESS_TOKEN` | `sb_<token>` | Supabase Access Token（從 Supabase Dashboard 獲取） |
| `DEEPSEEK_API_KEY` | `sk-...` | DeepSeek API Key |

### 3. 配置 Supabase 項目

**Testing 項目** (`gjbdqcjyliuxrnmwotvc`):
1. 啟用 **Authentication** → 配置 Providers
2. 啟用 **Database** → 執行初始 schema
3. 部署 **Edge Functions** → 設置環境變量
4. 配置 **Row Level Security (RLS)**

**Production 項目** (`pzatgmavjvrastnumxty`):
1. 重複上述步驟
2. 確保使用生產環境的 API Keys
3. 配置自定義域名（可選）

---

## 📊 監控和調試

### 查看部署日誌

1. 進入 GitHub 倉庫 → **Actions** 標籤
2. 選擇對應的 workflow run
3. 點擊具體的 job 查看詳細日誌

### 常見問題排查

#### 問題 1: Edge Function 部署失敗

**錯誤信息**: `Error: Failed to deploy Edge Function`

**解決步驟**:
1. 檢查 `SUPABASE_ACCESS_TOKEN` 是否有效
2. 檢查 Edge Function 代碼語法
3. 查看 Supabase Dashboard → Edge Functions → Logs

#### 問題 2: 數據庫遷移失敗

**錯誤信息**: `Error: Migration failed`

**解決步驟**:
1. 檢查 `supabase/migrations/` 中的 SQL 語法
2. 手動執行遷移：`supabase db push --dry-run`
3. 查看 Supabase Dashboard → Database → Logs

#### 問題 3: 前端部署後頁面空白

**錯誤信息**: 瀏覽器控制台顯示 `Failed to load resource`

**解決步驟**:
1. 檢查 `inject-env.js` 是否正確注入環境變量
2. 檢查瀏覽器控制台錯誤信息
3. 確認 Supabase URL 和 Anon Key 是否正確

---

## 🔐 安全最佳實踐

1. **環境變量分離**:
   - Testing 和 Production 使用不同的 Supabase 項目
   - 永遠不要在前端代碼中硬編碼 API Keys

2. **審批流程**:
   - Production 部署必須經過至少 1 人審批
   - 審批人應該檢查代碼變更和測試結果

3. **數據庫安全**:
   - 所有表都啟用 RLS (Row Level Security)
   - 使用 Supabase Auth 進行用戶認證

4. **Edge Function 安全**:
   - 驗證所有輸入參數
   - 設置超時限制（防止濫用）
   - 記錄所有 API 調用日誌

---

## 📝 部署檢查清單

### 部署到 Testing 環境前

- [ ] 代碼已通過本地測試
- [ ] 所有更改已提交到 `testing` 分支
- [ ] 沒有敏感信息（API Keys、密碼等）暴露在代碼中
- [ ] `supabase/migrations/` 中的 SQL 文件已測試

### 部署到 Production 環境前

- [ ] 已在 Testing 環境充分測試
- [ ] 創建了 PR: `main` ← `testing`
- [ ] PR 描述清晰，包含變更說明
- [ ] 代碼已通過 Review
- [ ] 沒有未解決的 merge conflicts

### 部署到 Production 環境後

- [ ] 驗證前端頁面正常加載
- [ ] 驗證 Edge Function 正常響應
- [ ] 驗證數據庫遷移成功（如有）
- [ ] 檢查 Supabase Dashboard 監控指標
- [ ] 通知團隊部署完成

---

## 🚀 快速參考命令

```bash
# 本地開發
supabase start                    # 啟動本地 Supabase
supabase functions serve          # 本地測試 Edge Function
supabase db diff                  # 查看數據庫變更

# 部署
supabase functions deploy          # 部署 Edge Function
supabase db push                  # 推送數據庫遷移

# 調試
supabase functions logs           # 查看 Edge Function 日誌
supabase db lint                  # 檢查數據庫 schema
```

---

## 📚 參考資源

- [Supabase CLI 文檔](https://supabase.com/docs/guides/cli)
- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [GitHub Environments 文檔](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)

---

**最後更新**: 2026-07-01
