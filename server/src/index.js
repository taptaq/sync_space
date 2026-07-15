// Node.js 本地开发入口
// 本地运行：npm run dev → http://localhost:8787
// 生产部署：npm run deploy → Cloudflare Workers（用 worker.js 入口）

import { serve } from "@hono/node-server";
import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 8787;

serve(
  {
    fetch: app.fetch,
    port: Number(PORT),
  },
  (info) => {
    console.log(`\n  Qwen 代理服务已启动（Hono · Node.js 模式）`);
    console.log(`  → http://localhost:${info.port}`);
    console.log(`  → 上游: https://dashscope.aliyuncs.com/compatible-mode/v1`);
    console.log(`  → 健康检查: http://localhost:${info.port}/health\n`);
  },
);
