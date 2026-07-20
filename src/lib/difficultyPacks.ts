import type { DifficultyType, LocalText, NeuroType } from "@/types";

// 困难类型干预包（PRD §困难类型 5 选 1 · 替代锁死轴模型）
// 每个困难类型对应一个干预包：减法（降低输入）或加法（增加结构/外部化）
// 内容参考 ASD/ADHD 循证干预 · 非诊断 · 辅助自我调节

// 干预动作（包内一条具体可执行的微动作）
export interface InterventionAction {
  id: string;
  label: LocalText; // 动作名称
  description: LocalText; // 一句话说明
  duration_minutes?: number; // 预计时长（可选 · 即时动作不填）
  instant?: boolean; // 是否即时动作（如一键降载）
}

// 困难类型干预包
export interface DifficultyPack {
  type: DifficultyType;
  title: LocalText; // 包标题，如"感官减载"
  direction: LocalText; // 干预方向，如"减法：降低输入"
  actions: InterventionAction[];
}

// 5 种困难类型的干预包
export const DIFFICULTY_PACKS: DifficultyPack[] = [
  // ========== sensory · 减法：降低输入 ==========
  {
    type: "sensory",
    title: { zh: "先让周围安静一点", en: "Make things quieter first" },
    direction: { zh: "减法：降低输入", en: "Subtraction: reduce input" },
    actions: [
      {
        id: "low_sensory_mode",
        label: { zh: "减少屏幕动效和视觉刺激", en: "Reduce motion and visual input" },
        description: {
          zh: "停止动效、降低亮度，只留一个动作入口",
          en: "Stop animations, dim brightness, keep only one action entry",
        },
        instant: true,
      },
      {
        id: "brown_noise",
        label: { zh: "播放低沉、连续的背景声", en: "Play a low, steady background sound" },
        description: {
          zh: "可能帮助盖住忽高忽低的环境声；不舒服就立即关闭",
          en: "Mask environmental sound with continuous low-frequency noise for rapid sensory load-down",
        },
        instant: true,
      },
      {
        id: "pause_communication",
        label: { zh: '发送"暂停交流"消息', en: 'Send "Pause communication" message' },
        description: {
          zh: "一键告诉信任的人你暂时不能说话",
          en: "One tap to tell trusted people you can't talk right now",
        },
        instant: true,
      },
    ],
  },

  // ========== change · 加法：增加可预测性 ==========
  {
    type: "change",
    title: { zh: "先看清接下来会发生什么", en: "See what happens next" },
    direction: { zh: "加法：增加可预测性", en: "Addition: increase predictability" },
    actions: [
      {
        id: "next_2_hours",
        label: { zh: "列出接下来 2 小时会发生什么", en: "List the next 2 hours" },
        description: {
          zh: "把即将发生的事写成短清单，降低未知",
          en: "Write upcoming events as a short list to reduce the unknown",
        },
        duration_minutes: 5,
      },
      {
        id: "today_timeline",
        label: { zh: "可视化今日时间线", en: "Visualize today's timeline" },
        description: {
          zh: "把今天的时间块摆出来，看见全貌更稳",
          en: "Lay out today's time blocks so the whole picture feels steadier",
        },
        duration_minutes: 3,
      },
      {
        id: "find_anchor",
        label: { zh: "确认一个确定的事", en: "Confirm one certain thing" },
        description: {
          zh: "找到一件此刻不变的事，作为锚点",
          en: "Find one thing that won't change right now as an anchor",
        },
        instant: true,
      },
    ],
  },

  // ========== startup · 加法：外部化 + 微启动 ==========
  {
    type: "startup",
    title: { zh: "先把第一步变小", en: "Make the first step smaller" },
    direction: { zh: "加法：外部化 + 微启动", en: "Addition: externalize + micro-start" },
    actions: [
      {
        id: "micro_start",
        label: { zh: "5 分钟微启动：只做第一步", en: "5-minute micro-start: only the first step" },
        description: {
          zh: "把任务缩到最小第一步，计时 5 分钟即可停下",
          en: "Shrink the task to the smallest first step; you may stop after 5 minutes",
        },
        duration_minutes: 5,
      },
      {
        id: "paper_externalize",
        label: { zh: "把脑子里的事先写下来", en: "Write down what's in your head" },
        description: {
          zh: "不整理不排序，全部倒到纸上释放工作记忆",
          en: "No sorting, no ordering—dump it all onto paper to release working memory",
        },
        duration_minutes: 3,
      },
      {
        id: "body_double",
        label: { zh: "找一个人陪我开始 10 分钟", en: "Ask someone to stay for the first 10 minutes" },
        description: {
          zh: "线上或线下都可以；如果陪伴让你更累，就换其他办法",
          en: "Another person's presence adds external structure to offset low startup drive",
        },
        instant: true,
      },
    ],
  },

  // ========== time · 加法：外部化时间结构 ==========
  {
    type: "time",
    title: { zh: "把剩余时间摆到眼前", en: "Put remaining time where you can see it" },
    direction: { zh: "加法：外部化时间结构", en: "Addition: externalize time structure" },
    actions: [
      {
        id: "time_visualize",
        label: { zh: "显示现在到截止还有多久", en: "Show how long until the deadline" },
        description: {
          zh: "把剩余时间摆到眼前，补偿内在时间感缺失",
          en: "Put remaining time in front of you to offset missing inner time sense",
        },
        instant: true,
      },
      {
        id: "anchor_endpoint",
        label: { zh: "先定一个明确的停止时间", en: "Choose a clear stopping time" },
        description: {
          zh: "给任务设一个明确的停点，避免无限延伸",
          en: "Give the task a clear stop point so it doesn't expand endlessly",
        },
        duration_minutes: 2,
      },
      {
        id: "now_only_x",
        label: { zh: '"现在只做 X"：缩小到一个动作', en: '"Now only do X": shrink to one action' },
        description: {
          zh: "把选择缩到当下唯一一个动作，降低决策成本",
          en: "Narrow the choice to one present action to lower decision cost",
        },
        instant: true,
      },
    ],
  },

  // ========== communication · 加法：降低交流摩擦 ==========
  {
    type: "communication",
    title: { zh: "连接", en: "Connection" },
    direction: { zh: "加法：降低交流摩擦", en: "Addition: lower communication friction" },
    actions: [
      {
        id: "resend_last",
        label: { zh: "记住上次的消息，一键再发", en: "Remember last message, one-tap resend" },
        description: {
          zh: "复用上次有效表达，免去重新组织语言",
          en: "Reuse the last effective message without re-composing",
        },
        instant: true,
      },
      {
        id: "need_message",
        label: { zh: '生成一条"我现在需要..."短消息', en: 'Generate a "Right now I need..." short message' },
        description: {
          zh: "模板化表达当前需求，降低开口成本",
          en: "Templatize your current need to lower the cost of speaking up",
        },
        instant: true,
      },
      {
        id: "choose_trusted",
        label: { zh: "选择一个信任的人发送", en: "Choose a trusted person to send to" },
        description: {
          zh: "把消息发给你信得过的人，一次即够",
          en: "Send the message to one person you trust—one is enough",
        },
        instant: true,
      },
    ],
  },
];

// 困难类型显示标签
const DIFFICULTY_LABELS: Record<DifficultyType, LocalText> = {
  sensory: { zh: "声音、光线或触感受不了", en: "Sound, light, or touch feels too much" },
  change: { zh: "计划变了，不知道接下来怎么办", en: "Plans changed and I don't know what's next" },
  startup: { zh: "知道要做，但开始不了", en: "I know what to do but can't start" },
  time: { zh: "忘了时间，或者快来不及了", en: "I lost track of time or I'm running late" },
  communication: { zh: "想说，但现在说不出来", en: "I want to speak but can't right now" },
};

// 按 neuroType 排序困难类型
// ASD 默认 sensory 在前 · ADHD 默认 startup 在前 · HSP 偏 sensory/communication · PTSD 偏 sensory/change
const NEURO_DIFFICULTY_ORDER: Record<NeuroType, DifficultyType[]> = {
  asd: ["sensory", "change", "communication", "startup", "time"],
  adhd: ["startup", "time", "communication", "sensory", "change"],
  hsp: ["sensory", "communication", "change", "time", "startup"],
  ptsd: ["sensory", "change", "communication", "time", "startup"],
  other: ["sensory", "startup", "change", "time", "communication"],
};

// 获取困难类型对应的干预包
export function getDifficultyPack(type: DifficultyType): DifficultyPack {
  const pack = DIFFICULTY_PACKS.find((p) => p.type === type);
  if (!pack) {
    throw new Error(`[difficultyPacks] No pack found for type: ${type}`);
  }
  return pack;
}

// 按 neuroType 排序困难类型（ASD 默认 sensory 在前，ADHD 默认 startup 在前）
export function getOrderedDifficultyTypes(neuroType: NeuroType): DifficultyType[] {
  return NEURO_DIFFICULTY_ORDER[neuroType];
}

// 获取困难类型的显示标签
export function getDifficultyLabel(type: DifficultyType): LocalText {
  return DIFFICULTY_LABELS[type];
}
