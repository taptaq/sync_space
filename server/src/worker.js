// Cloudflare Workers 入口
// Hono app 直接作为 Workers 的 default export（app.fetch 符合 Workers fetch handler 签名）
// 环境变量通过 wrangler secret 设置，Hono 自动注入到 c.env

export { default } from "./app.js";
