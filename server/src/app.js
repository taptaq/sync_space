// Qwen API 代理 — Hono 核心（同时兼容 Node.js 和 Cloudflare Workers）
// Express 不能跑在 Workers 上（Workers 用 Web 标准 API），Hono 两端通用

import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// ============ CORS ============
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      // 允许本地开发
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
      // 允许 Cloudflare Pages 域名
      if (origin.endsWith(".pages.dev")) return origin;
      // 允许自定义域名（部署后可按需收紧）
      return origin;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// ============ 环境变量获取 ============
// Node.js: process.env / Workers: c.env（Hono 自动注入）
function getApiKey(c) {
  if (typeof process !== "undefined" && process.env?.DASHSCOPE_API_KEY) {
    return process.env.DASHSCOPE_API_KEY;
  }
  return c.env?.DASHSCOPE_API_KEY || "";
}

const DASHSCOPE_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1";

// ============ 健康检查 ============
app.get("/health", (c) => {
  return c.json({ ok: true, service: "qwen-proxy", time: Date.now() });
});

// ============ /chat/completions 透传 ============
app.post("/chat/completions", async (c) => {
  const apiKey = getApiKey(c);
  if (!apiKey) {
    return c.json({ error: { message: "DASHSCOPE_API_KEY 未配置" } }, 500);
  }

  try {
    const body = await c.req.json();
    const upstream = await fetch(`${DASHSCOPE_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`[chat/completions] 上游 ${upstream.status}: ${errText.slice(0, 300)}`);
      return c.json(
        { error: { message: `Qwen API 错误: ${errText.slice(0, 500)}` } },
        upstream.status,
      );
    }

    const data = await upstream.json();
    return c.json(data);
  } catch (e) {
    console.error("[chat/completions] 代理异常:", e.message);
    return c.json({ error: { message: `代理异常: ${e.message}` } }, 502);
  }
});

// ============ /audio/speech TTS ============
app.post("/audio/speech", async (c) => {
  const apiKey = getApiKey(c);
  if (!apiKey) {
    return c.json({ error: { message: "DASHSCOPE_API_KEY 未配置" } }, 500);
  }

  try {
    const { model, input } = await c.req.json();
    const text = typeof input === "string" ? input : input?.text || "";
    if (!text) {
      return c.json({ error: { message: "input.text 不能为空" } }, 400);
    }

    const ttsPayload = {
      model: model || "cosyvoice-v3-flash",
      input: {
        text,
        voice: "longanyang",
      },
    };

    const upstream = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(ttsPayload),
      },
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error(`[audio/speech] 上游 ${upstream.status}: ${errText.slice(0, 300)}`);
      return c.json(
        { error: { message: `TTS API 错误: ${errText.slice(0, 500)}` } },
        upstream.status,
      );
    }

    const data = await upstream.json();
    const audioUrl = data?.output?.audio?.url;
    if (!audioUrl) {
      console.error("[audio/speech] 未返回音频 URL:", JSON.stringify(data).slice(0, 300));
      return c.json({ error: { message: "TTS 未返回音频" } }, 502);
    }

    // 下载音频并返回二进制流
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return c.json({ error: { message: "下载音频失败" } }, 502);
    }
    const audioBuffer = await audioRes.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("[audio/speech] 代理异常:", e.message);
    return c.json({ error: { message: `代理异常: ${e.message}` } }, 502);
  }
});

export default app;
