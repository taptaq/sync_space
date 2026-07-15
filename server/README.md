# Qwen API 代理服务（Hono · Cloudflare Workers 兼容）

浏览器不能直接持有阿里云 API Key，本服务做三件事：**注入 Key · CORS · 透传 OpenAI 兼容接口**。

基于 [Hono](https://hono.dev) 框架，同一套代码同时支持：
- **本地开发**：Node.js (`npm run dev`)
- **生产部署**：Cloudflare Workers (`npm run deploy`)

## 本地开发

```bash
cd server
cp .env.example .env   # 填入 DASHSCOPE_API_KEY
npm install
npm run dev             # → http://localhost:8787
```

## 部署到 Cloudflare Workers

### 1. 安装 Wrangler 并登录

```bash
cd server
npx wrangler login     # 浏览器授权 Cloudflare 账号
```

### 2. 设置 API Key（Secret）

```bash
npm run secret          # 等价于 wrangler secret put DASHSCOPE_API_KEY
# 粘贴你的阿里云百炼 API Key，回车
```

### 3. 部署

```bash
npm run deploy          # 等价于 wrangler deploy
```

部署成功后会输出 Workers URL，类似：
```
https://syncspace-qwen-proxy.<你的子域名>.workers.dev
```

### 4. 更新前端环境变量

在前端项目的 `.env`（或 Cloudflare Pages 环境变量）中设置：

```
VITE_QWEN_PROXY_URL="https://syncspace-qwen-proxy.<你的子域名>.workers.dev"
```

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET  | `/health` | 健康检查 |
| POST | `/chat/completions` | 文本/多模态对话（OpenAI 兼容格式透传） |
| POST | `/audio/speech` | TTS 语音合成（CosyVoice · 返回二进制音频流） |

## 端口/域名

- 本地：`http://localhost:8787`
- Workers：`https://<worker-name>.<account>.workers.dev`

CORS 自动允许 `localhost`、`*.pages.dev`、自定义域名。
