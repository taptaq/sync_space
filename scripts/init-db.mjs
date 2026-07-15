// 临时脚本：执行 supabase/schema.sql 创建数据库表
// 使用 DIRECT_URL（session-mode pooler，端口 5432）连接
import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;
const schemaSql = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf-8");

// 从 .env 读取 DIRECT_URL
const envContent = readFileSync(new URL("../.env", import.meta.url), "utf-8");
const directUrlMatch = envContent.match(/^DIRECT_URL="(.+)"$/m);
const directUrl = directUrlMatch ? directUrlMatch[1] : null;

if (!directUrl) {
  console.error("ERROR: DIRECT_URL 未在 .env 中找到");
  process.exit(1);
}

const client = new Client({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("正在连接 Supabase PostgreSQL...");
  await client.connect();
  console.log("连接成功，正在执行 schema.sql...");

  await client.query(schemaSql);

  // 验证表是否创建成功
  const { rows } = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log("\n已创建的表：");
  rows.forEach((r) => console.log(`  ✓ ${r.tablename}`));

  // 验证 RLS 策略
  const { rows: policies } = await client.query(
    "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log("\n已创建的 RLS 策略：");
  policies.forEach((p) => console.log(`  ✓ ${p.tablename}: ${p.policyname}`));

  console.log("\n数据库初始化完成！");
} catch (err) {
  console.error("执行失败:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
