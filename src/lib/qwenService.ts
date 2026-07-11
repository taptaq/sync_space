// Qwen 多模态服务层（经应用服务端代理调用）
// 3 个模型 × 5 个能力：
//   全模态 qwen3.5-omni-plus-2026-03-15 → 语音签到 / 崩溃语音解读 / 环境图片分析
//   大语言 qwen3.7-plus                  → 智能建议生成
//   语音   qwen3-tts-vd-2026-01-26       → 文本转语音（TTS）
//
// 合规边界：
//   ✅ 语音转文字（不存声纹、不做语音情绪识别）
//   ✅ 环境图片理解（不分析人脸/表情）
//   ✅ 文本语义分析
//   ❌ 人脸表情/情绪识别（生物识别红线，尤其涉及未成年人）
//   ❌ 语音情绪/声纹分析（敏感个人信息）
//
// 安全边界：浏览器中不保存供应商 API Key。代理未配置或调用失败时降级到模拟实现。

import type { AIInterpretation, AxisKey, NeuroType, Phase } from "@/types";

// ============ 配置 ============

const PROXY_URL = (import.meta.env.VITE_QWEN_PROXY_URL ?? "").replace(/\/$/, "");
const HAS_BACKEND = PROXY_URL.length > 0;

const QWEN_OMNI_MODEL = "qwen3.5-omni-plus-2026-03-15";
const QWEN_TTS_MODEL = "qwen3-tts-vd-2026-01-26";
const QWEN_TEXT_MODEL = "qwen3.7-plus";

// ============ 通用工具 ============

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Blob → base64（不含 data: 前缀） */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Blob → data URL（含 data: 前缀，用于图片） */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getAudioFormat(blob: Blob): string {
  const t = blob.type;
  if (t.includes("webm")) return "webm";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("wav")) return "wav";
  if (t.includes("mp3")) return "mp3";
  if (t.includes("m4a")) return "m4a";
  return "webm";
}

/** 从模型回复中提取 JSON（兼容 markdown 代码块包裹） */
function extractJson<T = unknown>(text: string): T | null {
  // 直接 parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // ignore
  }
  // markdown 代码块
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1]) as T;
    } catch {
      // ignore
    }
  }
  // 花括号区间
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch {
      // ignore
    }
  }
  return null;
}

// ============ 通用 chat completion 调用 ============

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
    | { type: "input_audio"; input_audio: { data: string; format: string } }
  >;
}

async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options?: { temperature?: number; jsonMode?: boolean },
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options?.temperature ?? 0.7,
  };
  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  if (!HAS_BACKEND) throw new Error("Qwen 服务端代理未配置");

  const res = await fetch(`${PROXY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Qwen API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ============ 类型定义 ============

export interface VoiceCheckinResult {
  transcript: string;
  suggestedValues: Record<AxisKey, number>;
  summary: string;
  confidence: "high" | "mid" | "low";
}

export interface EnvAnalysisResult {
  overallScore: number;
  light: { score: number; note: string };
  noise: { score: number; note: string };
  clutter: { score: number; note: string };
  suggestions: string[];
  imageDescription: string;
}

export interface SmartGuidanceResult {
  title: string;
  message: string;
  actionableSteps: string[];
  basedOn: string;
}

export interface TTSResult {
  audioUrl: string; // blob URL，可直接用于 <audio>
}

// ============ 1. 语音输入签到 ============

export async function voiceToCheckin(
  audioBlob: Blob | null,
  fallbackText?: string,
): Promise<VoiceCheckinResult> {
  if (HAS_BACKEND) {
    try {
      return await realVoiceToCheckin(audioBlob, fallbackText);
    } catch (e) {
      console.warn("[Qwen] voiceToCheckin 降级到模拟:", e);
    }
  }
  return mockVoiceToCheckin(audioBlob, fallbackText);
}

async function realVoiceToCheckin(
  audioBlob: Blob | null,
  fallbackText?: string,
): Promise<VoiceCheckinResult> {
  const prompt = `你是一个内在状态分析助手。用户会用语音描述此刻的状态。
请转写语音内容，并基于描述提取三轴状态值（0-10，0=低，10=高）：
- sensory（感官负载：越高代表越刺激/不适）
- social（社交电量：越高代表越有余力社交）
- predictability（可预测性：越高代表越确定/踏实）

只返回 JSON，格式：
{"transcript":"转写文字","sensory":数字,"social":数字,"predictability":数字,"summary":"一句话总结","confidence":"high|mid|low"}`;

  let content: ChatMessage["content"];

  if (audioBlob) {
    const audioBase64 = await blobToBase64(audioBlob);
    const format = getAudioFormat(audioBlob);
    content = [
      { type: "input_audio", input_audio: { data: audioBase64, format } },
      { type: "text", text: prompt },
    ];
  } else {
    // 无音频，用 fallbackText 走文本模型
    const text = fallbackText ?? "";
    if (!text) throw new Error("无音频且无文本输入");
    const result = await chatCompletion(
      QWEN_TEXT_MODEL,
      [
        { role: "system", content: "你是内在状态分析助手，基于文本描述提取三轴状态。" },
        {
          role: "user",
          content: `${prompt}\n\n用户描述：${text}`,
        },
      ],
      { jsonMode: true, temperature: 0.4 },
    );
    return parseVoiceCheckinResult(result, fallbackText ?? "");
  }

  const result = await chatCompletion(
    QWEN_OMNI_MODEL,
    [{ role: "user", content }],
    { jsonMode: true, temperature: 0.4 },
  );

  return parseVoiceCheckinResult(result, fallbackText ?? "");
}

function parseVoiceCheckinResult(
  raw: string,
  fallback: string,
): VoiceCheckinResult {
  const parsed = extractJson<{
    transcript?: string;
    sensory?: number;
    social?: number;
    predictability?: number;
    summary?: string;
    confidence?: string;
  }>(raw);

  if (parsed) {
    return {
      transcript: parsed.transcript || fallback,
      suggestedValues: {
        sensory: clampNum(parsed.sensory, 5),
        social: clampNum(parsed.social, 5),
        predictability: clampNum(parsed.predictability, 5),
      },
      summary: parsed.summary || fallback.slice(0, 20),
      confidence: (parsed.confidence as VoiceCheckinResult["confidence"]) || "mid",
    };
  }

  // JSON 解析失败，降级到关键词提取
  const transcript = fallback || raw.slice(0, 100);
  return {
    transcript,
    suggestedValues: extractAxisFromText(transcript),
    summary: generateSummary(transcript),
    confidence: assessConfidence(transcript),
  };
}

function clampNum(val: unknown, defaultVal: number): number {
  const n = typeof val === "number" ? val : Number(val);
  if (isNaN(n)) return defaultVal;
  return Math.max(0, Math.min(10, n));
}

// ============ 2. 崩溃语音补记三段式解读 ============

export async function interpretCrashVoice(
  audioBlob: Blob | null,
  fallbackText?: string,
): Promise<{ transcript: string; interpretation: AIInterpretation }> {
  if (HAS_BACKEND) {
    try {
      return await realInterpretCrashVoice(audioBlob, fallbackText);
    } catch (e) {
      console.warn("[Qwen] interpretCrashVoice 降级到模拟:", e);
    }
  }
  return mockInterpretCrashVoice(audioBlob, fallbackText);
}

async function realInterpretCrashVoice(
  audioBlob: Blob | null,
  fallbackText?: string,
): Promise<{ transcript: string; interpretation: AIInterpretation }> {
  const prompt = `你是一个温柔的内在状态解读助手。用户刚刚经历过一次过载/崩溃，用语音记录了经过。
请转写语音，并做三段式解读（不评判、不诊断，只是翻译情绪和识别需求）：

只返回 JSON：
{"transcript":"转写文字","event":"客观描述发生了什么（一句话）","emotion":"翻译用户表达背后的情绪（用「你写的…这背后是…」的句式）","need":"识别用户真正需要什么（一句话）"}

注意：
- 不要分析语气/声纹/情绪化声音特征，只基于文字内容解读
- 语气温柔，不说教`;

  let content: ChatMessage["content"];

  if (audioBlob) {
    const audioBase64 = await blobToBase64(audioBlob);
    const format = getAudioFormat(audioBlob);
    content = [
      { type: "input_audio", input_audio: { data: audioBase64, format } },
      { type: "text", text: prompt },
    ];
  } else {
    const text = fallbackText ?? "";
    if (!text) throw new Error("无音频且无文本输入");
    const result = await chatCompletion(
      QWEN_TEXT_MODEL,
      [
        { role: "system", content: "你是温柔的内在状态解读助手。" },
        { role: "user", content: `${prompt}\n\n用户记录：${text}` },
      ],
      { jsonMode: true, temperature: 0.6 },
    );
    return parseCrashInterpretation(result, fallbackText ?? "");
  }

  const result = await chatCompletion(
    QWEN_OMNI_MODEL,
    [{ role: "user", content }],
    { jsonMode: true, temperature: 0.6 },
  );

  return parseCrashInterpretation(result, fallbackText ?? "");
}

function parseCrashInterpretation(
  raw: string,
  fallback: string,
): { transcript: string; interpretation: AIInterpretation } {
  const parsed = extractJson<{
    transcript?: string;
    event?: string;
    emotion?: string;
    need?: string;
  }>(raw);

  if (parsed && parsed.event && parsed.emotion && parsed.need) {
    return {
      transcript: parsed.transcript || fallback,
      interpretation: {
        event: parsed.event,
        emotion: parsed.emotion,
        need: parsed.need,
      },
    };
  }

  // 降级到模拟解读
  return {
    transcript: fallback || raw.slice(0, 100),
    interpretation: mockCrashInterpretation(fallback || raw.slice(0, 100)),
  };
}

// ============ 3. 环境感官友好度分析 ============

export async function analyzeEnvironment(
  imageBlob: Blob | null,
  neuroType: NeuroType,
): Promise<EnvAnalysisResult> {
  if (HAS_BACKEND && imageBlob) {
    try {
      return await realAnalyzeEnvironment(imageBlob, neuroType);
    } catch (e) {
      console.warn("[Qwen] analyzeEnvironment 降级到模拟:", e);
    }
  }
  return mockAnalyzeEnvironment(neuroType);
}

async function realAnalyzeEnvironment(
  imageBlob: Blob,
  neuroType: NeuroType,
): Promise<EnvAnalysisResult> {
  const imageUrl = await blobToDataUrl(imageBlob);
  const neuroLabel = getNeuroLabel(neuroType);

  const prompt = `你是一个感官友好度分析助手。请分析图片中的环境（不要描述或识别人物）。
用户神经特质：${neuroLabel}。

请评估三个维度（0-10，10=最友好/最舒适）：
- light：光线亮度与舒适度
- noise：噪音水平（从画面推断，如人多、机械等噪音源）
- clutter：视觉杂乱度

只返回 JSON：
{"description":"环境简述（一句话，不含人物）","light":{"score":数字,"note":"说明"},"noise":{"score":数字,"note":"说明"},"clutter":{"score":数字,"note":"说明"},"suggestions":["建议1","建议2"]}`;

  const result = await chatCompletion(
    QWEN_OMNI_MODEL,
    [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: prompt },
        ],
      },
    ],
    { jsonMode: true, temperature: 0.4 },
  );

  return parseEnvResult(result, neuroType);
}

function parseEnvResult(raw: string, neuroType: NeuroType): EnvAnalysisResult {
  const parsed = extractJson<{
    description?: string;
    light?: { score?: number; note?: string };
    noise?: { score?: number; note?: string };
    clutter?: { score?: number; note?: string };
    suggestions?: string[];
  }>(raw);

  if (parsed) {
    const lightScore = clampNum(parsed.light?.score, 5);
    const noiseScore = clampNum(parsed.noise?.score, 5);
    const clutterScore = clampNum(parsed.clutter?.score, 5);
    const overall = Math.round((lightScore + noiseScore + clutterScore) / 3);

    // 如果 API 没返回建议，用本地逻辑补充
    const suggestions =
      parsed.suggestions && parsed.suggestions.length > 0
        ? parsed.suggestions
        : generateEnvSuggestions(lightScore, noiseScore, clutterScore, neuroType);

    return {
      overallScore: overall,
      light: { score: lightScore, note: parsed.light?.note || "光线中等" },
      noise: { score: noiseScore, note: parsed.noise?.note || "噪音中等" },
      clutter: { score: clutterScore, note: parsed.clutter?.note || "视觉信息中等" },
      suggestions,
      imageDescription: parsed.description || "环境分析完成",
    };
  }

  // JSON 解析失败，返回默认中性结果
  return {
    overallScore: 5,
    light: { score: 5, note: "光线中等" },
    noise: { score: 5, note: "噪音中等" },
    clutter: { score: 5, note: "视觉信息中等" },
    suggestions: generateEnvSuggestions(5, 5, 5, neuroType),
    imageDescription: "环境分析完成",
  };
}

// ============ 4. 智能建议生成 ============

export async function generateSmartGuidance(
  phase: Phase,
  neuroType: NeuroType,
  recentTrend: "improving" | "stable" | "declining",
): Promise<SmartGuidanceResult> {
  if (HAS_BACKEND) {
    try {
      return await realGenerateSmartGuidance(phase, neuroType, recentTrend);
    } catch (e) {
      console.warn("[Qwen] generateSmartGuidance 降级到模拟:", e);
    }
  }
  return mockSmartGuidance(phase, neuroType, recentTrend);
}

async function realGenerateSmartGuidance(
  phase: Phase,
  neuroType: NeuroType,
  trend: "improving" | "stable" | "declining",
): Promise<SmartGuidanceResult> {
  const phaseLabel = getPhaseLabel(phase);
  const neuroLabel = getNeuroLabel(neuroType);
  const trendLabel = trend === "improving" ? "好转中" : trend === "declining" ? "下滑中" : "稳定";

  const systemPrompt = `你是一个温柔的内在气候引导助手，服务于神经多样性人群。
你的语气：温柔、不说教、不评判，给具体可执行的步骤而非空泛建议。
你知道用户的特质和当前状态，请基于此生成个性化引导。`;

  const userPrompt = `用户信息：
- 神经特质：${neuroLabel}
- 当前阶段：${phaseLabel}
- 近期趋势：${trendLabel}

请生成一段引导，只返回 JSON：
{"title":"一句话标题（温柔有力）","message":"2-3句话的核心引导","steps":["可执行步骤1","可执行步骤2","可执行步骤3"],"basedOn":"基于什么数据"}`;

  const result = await chatCompletion(
    QWEN_TEXT_MODEL,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { jsonMode: true, temperature: 0.7 },
  );

  return parseSmartGuidanceResult(result, phase, neuroType, trend);
}

function parseSmartGuidanceResult(
  raw: string,
  phase: Phase,
  neuroType: NeuroType,
  trend: "improving" | "stable" | "declining",
): SmartGuidanceResult {
  const parsed = extractJson<{
    title?: string;
    message?: string;
    steps?: string[];
    basedOn?: string;
  }>(raw);

  if (parsed && parsed.title && parsed.message) {
    return {
      title: parsed.title,
      message: parsed.message,
      actionableSteps: parsed.steps && parsed.steps.length > 0
        ? parsed.steps
        : mockSmartGuidance(phase, neuroType, trend).actionableSteps,
      basedOn: parsed.basedOn || `${getNeuroLabel(neuroType)}特质 · ${getPhaseLabel(phase)} · ${trend}`,
    };
  }

  return mockSmartGuidance(phase, neuroType, trend);
}

// ============ 5. 文本转语音（TTS） ============

export async function textToSpeech(text: string): Promise<TTSResult> {
  if (HAS_BACKEND) {
    try {
      return await realTextToSpeech(text);
    } catch (e) {
      console.warn("[Qwen] textToSpeech 失败:", e);
      throw new Error("语音合成失败");
    }
  }
  // 无 API Key 时返回空 URL，调用方自行处理
  throw new Error("未配置 API Key，TTS 不可用");
}

async function realTextToSpeech(text: string): Promise<TTSResult> {
  if (!HAS_BACKEND) throw new Error("Qwen 服务端代理未配置");

  const res = await fetch(`${PROXY_URL}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: QWEN_TTS_MODEL,
      input: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`TTS API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  return { audioUrl };
}

// ============ 模拟实现（降级用） ============

function mockVoiceToCheckin(
  _audioBlob: Blob | null,
  fallbackText?: string,
): Promise<VoiceCheckinResult> {
  return delay(1200).then(() => {
    const transcript = fallbackText ?? generateMockTranscript();
    return {
      transcript,
      suggestedValues: extractAxisFromText(transcript),
      summary: generateSummary(transcript),
      confidence: assessConfidence(transcript),
    };
  });
}

function mockInterpretCrashVoice(
  _audioBlob: Blob | null,
  fallbackText?: string,
): Promise<{ transcript: string; interpretation: AIInterpretation }> {
  return delay(1400).then(() => {
    const transcript = fallbackText ?? generateMockCrashTranscript();
    return { transcript, interpretation: mockCrashInterpretation(transcript) };
  });
}

function mockAnalyzeEnvironment(neuroType: NeuroType): Promise<EnvAnalysisResult> {
  return delay(1800).then(() => {
    const variants = [
      {
        light: { score: 3, note: "灯光偏亮，有荧光灯频闪风险" },
        noise: { score: 4, note: "背景有持续噪音，人多嘈杂" },
        clutter: { score: 5, note: "视觉信息中等，桌面有些杂乱" },
        imageDescription: "一个室内空间，光线较亮，有几处视觉杂乱",
      },
      {
        light: { score: 7, note: "自然光柔和，窗帘半遮，光线舒适" },
        noise: { score: 8, note: "环境安静，只有轻微背景音" },
        clutter: { score: 7, note: "空间整洁，视觉信息有序" },
        imageDescription: "一个安静的室内空间，自然光柔和，布置整洁",
      },
      {
        light: { score: 5, note: "光线中等，混合光源" },
        noise: { score: 3, note: "有明显噪音源，可能影响注意力" },
        clutter: { score: 4, note: "视觉信息较多，可能分散注意力" },
        imageDescription: "一个室内空间，光线中等，有一些视觉杂乱",
      },
    ];
    const v = variants[Math.floor(Math.random() * variants.length)];
    const overall = Math.round((v.light.score + v.noise.score + v.clutter.score) / 3);
    const suggestions = generateEnvSuggestions(
      v.light.score,
      v.noise.score,
      v.clutter.score,
      neuroType,
    );
    return {
      overallScore: overall,
      light: v.light,
      noise: v.noise,
      clutter: v.clutter,
      suggestions,
      imageDescription: v.imageDescription,
    };
  });
}

function mockSmartGuidance(
  phase: Phase,
  neuroType: NeuroType,
  trend: "improving" | "stable" | "declining",
): SmartGuidanceResult {
  const neuroLabel = getNeuroLabel(neuroType);
  const trendLabel = trend === "improving" ? "在好转" : trend === "declining" ? "在下滑" : "比较稳定";

  const phaseGuidance: Record<Phase, SmartGuidanceResult> = {
    stable: {
      title: "现在是充电的好时机",
      message: `你的状态${trendLabel}，在平稳期。这是建设、储备的好时候——做点需要专注的事，也为未来储备能量。`,
      actionableSteps: [
        "可以尝试一件稍微有挑战的事，现在的你有余力",
        "记录下此刻什么让你感觉好，过载时可以复用",
        "不用塞满，留白本身就是储备",
      ],
      basedOn: `${neuroLabel}特质 · 平稳期 · 近期趋势${trendLabel}`,
    },
    accumulating: {
      title: "信号在累积，提前减负",
      message: `你的状态${trendLabel}，已进入累积期。还来得及——提前减负比事后修复轻松得多。`,
      actionableSteps: [
        "现在取消一项非必要安排是划算的",
        "降低感官输入：关背景音、调暗光线",
        "给下一个时段留出 15 分钟缓冲",
      ],
      basedOn: `${neuroLabel}特质 · 累积期 · 近期趋势${trendLabel}`,
    },
    warning: {
      title: "离过载还有一步",
      message: `你的状态${trendLabel}，已进入预警期。现在执行预案，比硬撑过去省力得多。`,
      actionableSteps: [
        "立即执行已设协议，不要再等",
        "能撤就撤——从当前环境撤出来最有效",
        "不要在这时做决策，最小化选择",
      ],
      basedOn: `${neuroLabel}特质 · 预警期 · 近期趋势${trendLabel}`,
    },
    overload: {
      title: "已经过载，只做保护动作",
      message: `你的状态${trendLabel}，已进入过载期。此刻不需要「应该」，只需要保命动作。`,
      actionableSteps: [
        "降低一切输入到最低：不说话、不触碰、不对视",
        "保证安全：移开危险物品",
        "允许自己什么都不做",
      ],
      basedOn: `${neuroLabel}特质 · 过载期 · 近期趋势${trendLabel}`,
    },
    recovery: {
      title: "刚经历过过载，慢慢来",
      message: `你的状态${trendLabel}，在恢复期。电量低是正常的，别急着回到平时的自己。`,
      actionableSteps: [
        "允许低电量：可以发呆、可以少做、可以慢",
        "不复盘、不分析、不「趁机教育」",
        "接下来 24 小时尽量减少安排",
      ],
      basedOn: `${neuroLabel}特质 · 恢复期 · 近期趋势${trendLabel}`,
    },
  };

  return phaseGuidance[phase];
}

// ============ 模拟辅助函数 ============

function extractAxisFromText(text: string): Record<AxisKey, number> {
  const result: Record<AxisKey, number> = { sensory: 5, social: 5, predictability: 5 };

  if (/吵|刺耳|光线|亮|噪音|吵闹|捂耳|眯眼|过载|受不了/.test(text)) {
    result.sensory = 8;
  } else if (/安静|舒服|柔和|放松|还好/.test(text)) {
    result.sensory = 2;
  }

  if (/不想说话|躲|一个人|独处|回避|不理|退缩/.test(text)) {
    result.social = 2;
  } else if (/想聊天|开心|主动|朋友|聚/.test(text)) {
    result.social = 8;
  }

  if (/混乱|失控|不知道|意外|计划变|突然/.test(text)) {
    result.predictability = 2;
  } else if (/计划|确定|踏实|清楚|规律/.test(text)) {
    result.predictability = 8;
  }

  return result;
}

function generateMockTranscript(): string {
  const samples = [
    "现在有点吵，灯光也刺眼，想找个安静的地方待一会儿",
    "今天还好，刚做完一件事，感觉挺踏实的",
    "人太多了，不想说话，想一个人待着",
    "计划突然变了，有点慌，不知道接下来怎么办",
    "刚和朋友聊完天，心情不错，电量还够",
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}

function generateMockCrashTranscript(): string {
  const samples = [
    "又崩了…声音变得好刺耳，一直在忍，后来实在忍不住就跑出来了…",
    "今天不太对…早上就知道，但还是会开太久，现在什么都听不进去…",
    "他又不理我了，我一直在等回复，越等越难受，明明知道不该等…",
    "人太多了，一直在扛，后来突然就受不了了，什么都处理不了…",
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}

function generateSummary(text: string): string {
  if (text.length === 0) return "没有识别到内容";
  if (text.length <= 20) return text;
  return text.slice(0, 18) + "…";
}

function assessConfidence(text: string): "high" | "mid" | "low" {
  if (text.length < 5) return "low";
  const keywordCount = [
    /吵|刺耳|光线|亮|噪音|安静|舒服|柔和/.test(text),
    /不想说话|躲|一个人|独处|想聊天|开心|主动/.test(text),
    /混乱|失控|不知道|意外|计划|确定|踏实/.test(text),
  ].filter(Boolean).length;
  if (keywordCount >= 2) return "high";
  if (keywordCount >= 1) return "mid";
  return "low";
}

function mockCrashInterpretation(text: string): AIInterpretation {
  if (/不理|不回|沉默|停止/.test(text)) {
    return {
      event: "对方的沟通突然停止或变得沉默。",
      emotion: "你写的「总是不理我」——这背后是：当沟通突然停止时，你会感到焦虑。你希望提前知道对方什么时候需要独处，而不是突然失去回应。",
      need: "你需要沟通的可预测性——即使对方需要空间，也希望被告知「什么时候回来」。",
    };
  }
  if (/声音|刺耳|吵|嘈杂|忍|崩溃|跑出来/.test(text)) {
    return {
      event: "环境声音变得刺耳，持续忍耐后崩溃离开。",
      emotion: "你写的「一直在忍」——这背后是：你知道自己在过载，但觉得不应该撤退，因为别人没有撤退。你在用别人的反应来校准自己的感受。",
      need: "你需要一个「允许自己撤退」的许可。这个许可不来自别人，来自你自己。",
    };
  }
  if (/人太多|扛|受不了|处理不了/.test(text)) {
    return {
      event: "在人多场合持续硬撑后过载。",
      emotion: "你写的「一直在扛」——这背后是：你一直在用意志力对抗感官超载，但意志力是有限度的，到了尽头就是崩溃。",
      need: "你需要提前识别累积期信号，在硬撑之前就给自己撤退的许可。",
    };
  }
  return {
    event: text.length > 0 ? `发生了：${text.slice(0, 40)}${text.length > 40 ? "…" : ""}` : "一次过载事件。",
    emotion: "你记录下了这件事，说明它对你重要。情绪不是问题，它是信号——告诉你某个边界被越过了。",
    need: "你需要识别那个被越过的边界，并为自己写一条协议来守护它。",
  };
}

function generateEnvSuggestions(
  lightScore: number,
  noiseScore: number,
  clutterScore: number,
  neuroType: NeuroType,
): string[] {
  const suggestions: string[] = [];
  if (lightScore <= 4) suggestions.push("光线偏亮：尝试调暗灯光或拉窗帘，换暖光源");
  if (noiseScore <= 4) suggestions.push("噪音偏高：戴降噪耳机或耳塞，找安静角落");
  if (clutterScore <= 4) suggestions.push("视觉杂乱：整理视线范围内的物品，减少桌面物品");

  if (neuroType === "asd" || neuroType === "hsp") {
    if (lightScore <= 4 || noiseScore <= 4) suggestions.push("感官敏感特质：这个环境可能加速你的累积，建议缩短停留时间");
  }
  if (neuroType === "adhd") {
    if (clutterScore <= 4) suggestions.push("注意力特质：视觉杂乱会分散你的注意力，建议整理后再开始");
  }
  if (neuroType === "ptsd") {
    if (noiseScore <= 4) suggestions.push("安全特质：突发噪音可能触发警觉，建议准备降噪工具");
  }
  if (suggestions.length === 0) suggestions.push("这个环境对你比较友好，可以安心待着");
  return suggestions;
}

function getNeuroLabel(neuroType: NeuroType): string {
  switch (neuroType) {
    case "asd": return "ASD";
    case "adhd": return "ADHD";
    case "hsp": return "HSP";
    case "ptsd": return "PTSD";
    default: return "通用";
  }
}

function getPhaseLabel(phase: Phase): string {
  switch (phase) {
    case "stable": return "平稳期";
    case "accumulating": return "累积期";
    case "warning": return "预警期";
    case "overload": return "过载期";
    case "recovery": return "恢复期";
    default: return "未知";
  }
}

// ============ 导出配置状态 ============

export const qwenApiConfigured = HAS_BACKEND;
