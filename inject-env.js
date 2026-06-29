#!/usr/bin/env node
/**
 * inject-env.js - 構建時注入環境變量到 index.html
 *
 * 用法：node inject-env.js <input> <output>
 *
 * 環境變量：
 *   SUPABASE_URL      - Supabase 項目 URL
 *   SUPABASE_ANON_KEY - Supabase 匿名 Key
 *
 * 佔位符：
 *   %%SUPABASE_URL%%     → 替換為 SUPABASE_URL 環境變量值
 *   %%SUPABASE_ANON_KEY%% → 替換為 SUPABASE_ANON_KEY 環境變量值
 */

const fs = require('fs');
const path = require('path');

// 獲取命令行參數
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法: node inject-env.js <input.html> <output.html>');
  console.error('');
  console.error('環境變量:');
  console.error('  SUPABASE_URL      (必填) - Supabase 項目 URL');
  console.error('  SUPABASE_ANON_KEY  (必填) - Supabase 匿名 Key');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1];

// 讀取環境變量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 錯誤: 缺少環境變量');
  console.error('  SUPABASE_URL =', supabaseUrl ? '(已設置)' : '(未設置)');
  console.error('  SUPABASE_ANON_KEY =', supabaseAnonKey ? '(已設置)' : '(未設置)');
  process.exit(1);
}

// 讀取輸入文件
let content;
try {
  content = fs.readFileSync(inputFile, 'utf8');
} catch (e) {
  console.error('❌ 無法讀取輸入文件:', inputFile);
  process.exit(1);
}

// 替換佔位符
const replacements = {
  '%%SUPABASE_URL%%': supabaseUrl,
  '%%SUPABASE_ANON_KEY%%': supabaseAnonKey,
};

let replacedCount = 0;
for (const [placeholder, value] of Object.entries(replacements)) {
  const count = (content.match(new RegExp(placeholder.replace(/%/g, '\\%'), 'g')) || []).length;
  if (count > 0) {
    content = content.split(placeholder).join(value);
    replacedCount += count;
    console.log(`  ✅ ${placeholder} → ${value.substring(0, 30)}... (${count} 處)`);
  } else {
    console.warn(`  ⚠️ 未找到佔位符: ${placeholder}`);
  }
}

// 寫入輸出文件
try {
  // 確保輸出目錄存在
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(outputFile, content, 'utf8');
  console.log(`\n✅ 構建完成: ${inputFile} → ${outputFile} (${replacedCount} 處替換)`);
} catch (e) {
  console.error('❌ 無法寫入輸出文件:', outputFile);
  process.exit(1);
}
