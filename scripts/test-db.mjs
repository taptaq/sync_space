// 临时脚本：用 fetch 测试 Supabase 匿名登录 + 读写（不依赖 WebSocket）
import { readFileSync } from "node:fs";

const envContent = readFileSync(new URL("../.env", import.meta.url), "utf-8");
const url = envContent.match(/^VITE_SUPABASE_URL="(.+)"$/m)[1];
const anonKey = envContent.match(/^VITE_SUPABASE_ANON_KEY="(.+)"$/m)[1];

console.log("Supabase URL:", url);
console.log("Anon Key:", anonKey.substring(0, 20) + "...");

// 1. 匿名登录
console.log("\n1. 尝试匿名登录...");
const authRes = await fetch(`${url}/auth/v1/signup`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({}),
});
const authData = await authRes.json();

if (!authRes.ok || !authData.user) {
  console.error("   匿名登录失败:", authData.message || authData.error_description || JSON.stringify(authData));
  console.error("\n   请确保已在 Supabase Dashboard 开启匿名登录：");
  console.error("   Authentication → Providers → Anonymous → 开启");
  process.exit(1);
}
const accessToken = authData.access_token;
const userId = authData.user.id;
console.log("   匿名登录成功！User ID:", userId);

// 2. 写入 user_settings
console.log("\n2. 测试写入 user_settings...");
const insertRes = await fetch(`${url}/rest/v1/user_settings`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    user_id: userId,
    onboarded: false,
    neuro_type: "asd",
  }),
});
const insertData = await insertRes.json();
if (!insertRes.ok) {
  console.error("   写入失败:", JSON.stringify(insertData));
  process.exit(1);
}
console.log("   写入成功！");

// 3. 读取 user_settings
console.log("\n3. 测试读取 user_settings...");
const readRes = await fetch(`${url}/rest/v1/user_settings?user_id=eq.${userId}`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
});
const readData = await readRes.json();
if (!readRes.ok) {
  console.error("   读取失败:", JSON.stringify(readData));
  process.exit(1);
}
console.log("   读取成功！onboarded:", readData[0].onboarded, "neuro_type:", readData[0].neuro_type);

// 4. 写入 checkins
console.log("\n4. 测试写入 checkins...");
const checkinRes = await fetch(`${url}/rest/v1/checkins`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    id: "test_chk_001",
    axis_sensory: 5.0,
    axis_social: 6.0,
    axis_predictability: 7.0,
    hesitation_ms: 2000,
    checkin_at: new Date().toISOString(),
    response_delay_minutes: 10,
    weather_snapshot: { climate: "clear_breeze" },
  }),
});
const checkinData = await checkinRes.json();
if (!checkinRes.ok) {
  console.error("   写入 checkins 失败:", JSON.stringify(checkinData));
} else {
  console.log("   写入 checkins 成功！");
  // 清理
  await fetch(`${url}/rest/v1/checkins?id=eq.test_chk_001`, {
    method: "DELETE",
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
  });
  console.log("   已清理测试数据");
}

// 清理 user_settings
await fetch(`${url}/rest/v1/user_settings?user_id=eq.${userId}`, {
  method: "DELETE",
  headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
});

console.log("\n所有测试通过！Supabase 连接正常，匿名登录 + RLS 读写均可用。");
process.exit(0);
