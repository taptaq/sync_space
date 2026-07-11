import type { AIInterpretation, AIObservation, Protocol } from "@/types";

// AI 模拟器（Demo 阶段模拟 Qwen3.7-Plus 输出，PRD §08 四种 Prompt 模式）

// 模拟思考延迟
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 情绪翻译模式（PRD §08 翻译模式）
// 输入用户反思日志原始文本，输出三段式解读——事件描述/情绪翻译/需求识别
export async function interpretEmotion(
  rawText: string,
): Promise<AIInterpretation> {
  await delay(900);

  const text = rawText.trim();

  // 关键词匹配模拟（真实场景由 Qwen3.7-Plus 完成）
  if (/不理|不回|沉默|停止/.test(text)) {
    return {
      event: `对方的沟通突然停止或变得沉默。`,
      emotion: `你写的"总是不理我"——这背后是：当沟通突然停止时，你会感到焦虑。你希望提前知道对方什么时候需要独处，而不是突然失去回应。`,
      need: `你需要沟通的可预测性——即使对方需要空间，也希望被告知"什么时候回来"。`,
    };
  }

  if (/声音|刺耳|吵|嘈杂|忍|崩溃|跑出来/.test(text)) {
    return {
      event: `环境声音变得刺耳，持续忍耐后崩溃离开。`,
      emotion: `你写的"一直在忍"——这背后是：你知道自己在过载，但觉得不应该撤退，因为别人没有撤退。你在用别人的反应来校准自己的感受。`,
      need: `你需要一个"允许自己撤退"的许可。这个许可不来自别人，来自你自己。`,
    };
  }

  if (/消息|回复|不舒服|应该/.test(text)) {
    return {
      event: `收到一条让你不舒服的消息，你强迫自己立刻回复。`,
      emotion: `你觉得自己"应该"立刻回应，但这个"应该"不是你的需求，是习惯。你的身体其实在抗拒，只是大脑盖过了它。`,
      need: `你需要允许自己延迟回应——不舒服的消息可以等到明天再回。`,
    };
  }

  // 通用解读
  return {
    event: text.length > 0 ? `发生了：${text.slice(0, 40)}${text.length > 40 ? "…" : ""}` : `一次过载事件。`,
    emotion: `你记录下了这件事，说明它对你重要。情绪不是问题，它是信号——告诉你某个边界被越过了。`,
    need: `你需要识别那个被越过的边界，并为自己写一条协议来守护它。`,
  };
}

// 模式观察模式（PRD §08 观察模式，每周日生成，最多 1 条）
export async function generateWeeklyObservation(): Promise<AIObservation> {
  await delay(700);
  return {
    id: `obs_${Date.now()}`,
    week_label: `本周`,
    pattern: `你过去三次 meltdown 前的 90 分钟，都做了一件相同的事：回复了一条让你不舒服的消息。`,
    suggested_protocol: {
      trigger_description: `收到让你不舒服的消息`,
      action_description: `推迟到明天再回，不强迫自己立刻回应`,
    },
    status: "pending",
    created_at: new Date().toISOString(),
  };
}

// 协议提取模式（PRD §08 建议模式）
// 从复盘内容生成协议草案
export async function extractProtocolFromReview(
  interpretation: AIInterpretation,
): Promise<{
  trigger_description: string;
  action_description: string;
}> {
  await delay(600);

  // 基于解读内容生成协议草案
  if (interpretation.need.includes(`撤退`)) {
    return {
      trigger_description: `感官负载 > 7`,
      action_description: `15 分钟内撤退到安静空间，不等别人同意`,
    };
  }
  if (interpretation.need.includes(`可预测性`)) {
    return {
      trigger_description: `对方沟通突然停止`,
      action_description: `先用文字写下自己的感受，不立刻追问对方`,
    };
  }
  if (interpretation.need.includes(`延迟回应`)) {
    return {
      trigger_description: `收到让你不舒服的消息`,
      action_description: `推迟到明天再回`,
    };
  }
  return {
    trigger_description: `感到过载时`,
    action_description: `先用文字写下来再尝试说话`,
  };
}

// 协议候选转为正式协议结构
export function candidateToProtocol(
  triggerDesc: string,
  actionDesc: string,
): Pick<Protocol, "trigger" | "action" | "source" | "status"> {
  return {
    trigger: {
      type: "threshold",
      axis: "sensory",
      operator: ">",
      value: 7,
      description: triggerDesc,
    },
    action: {
      description: actionDesc,
      duration_minutes: 15,
      timer: true,
    },
    source: "crash_reflection",
    status: "candidate",
  };
}
