import type { ParentGuidancePack, Phase } from "@/types";

// 家长引导话术库 · 五阶段 × 四类建议
// 四类：措施卡片 / 话术卡片（可以这样说）/ 不要做清单 / 环境调整建议
// 内容原则：温柔 · 非评判 · 可操作 · 保护亲子连接 · 不替代专业评估
// 紧急情况（自伤/伤人）一律引导联系专业人士

export const PARENT_GUIDANCE: Record<Phase, ParentGuidancePack> = {
  // ============ 平稳期 · 建设 ============
  stable: {
    phase: "stable",
    phaseLabel: { zh: "平稳期", en: "Stable" },
    measures: [
      { text: { zh: "这是充电的好时候。可以一起做需要专注的事，也鼓励孩子尝试新东西。", en: "This is a good time to recharge. You can do focused things together and encourage the child to try new things." } },
      { text: { zh: "巩固能带来安定感的小仪式（固定的睡前流程、专属安静角落）。", en: "Consolidate small rituals that bring a sense of security (a fixed bedtime routine, a dedicated quiet corner)." } },
      { text: { zh: "记录下此刻什么有用，过载时可以复用。", en: "Record what works right now so it can be reused during overload." } },
    ],
    scripts: [
      { text: { zh: "「我注意到你今天很自在，想做点什么？」", en: "\"I notice you're comfortable today; what would you like to do?\"" } },
      { text: { zh: "「你现在的样子真好，不需要变成别的。」", en: "\"You look great just as you are; you don't need to be anything else.\"" } },
      { text: { zh: "「我们一起把这个舒服的感觉记住好不好？」", en: "\"Shall we remember this comfortable feeling together?\"" } },
    ],
    avoidList: [
      { text: { zh: "不要在平稳期塞满安排——留白本身就是储备。", en: "Don't pack the stable phase with schedules—white space itself is a reserve." } },
      { text: { zh: "不要把平稳当成「正常」，把过载当成「异常」。都是同一根曲线。", en: "Don't treat stable as \"normal\" and overload as \"abnormal.\" They are the same curve." } },
    ],
    environment: [
      { text: { zh: "光线柔和，噪音可控，留一个随时能撤退的角落。", en: "Soft lighting, controllable noise, and a corner to retreat to at any time." } },
      { text: { zh: "可以适当引入新刺激（新玩具/新活动），但准备退路。", en: "You may introduce new stimuli (new toys/activities), but prepare an exit." } },
    ],
  },

  // ============ 累积期 · 预防 ============
  accumulating: {
    phase: "accumulating",
    phaseLabel: { zh: "累积期", en: "Accumulating" },
    measures: [
      { text: { zh: "提前减负比事后修复轻松得多。现在取消非必要安排是划算的。", en: "Offloading proactively is much easier than repairing afterward. Canceling non-essential commitments now is worth it." } },
      { text: { zh: "降低感官输入：关掉背景音、调暗光线、减少人多场合。", en: "Reduce sensory input: turn off background sound, dim the lights, reduce crowded situations." } },
      { text: { zh: "给一个可预测的接下来：告诉孩子「接下来会怎样」，减少未知。", en: "Provide a predictable next step: tell the child \"what happens next\" to reduce the unknown." } },
    ],
    scripts: [
      { text: { zh: "「我看到你有点满了，我们停一下好吗？」", en: "\"I can see you're a bit full; can we pause for a moment?\"" } },
      { text: { zh: "「接下来我们先回家 / 去安静的地方，不用一直待在这。」", en: "\"Next we'll go home / to a quiet place; we don't have to stay here.\"" } },
      { text: { zh: "「你不需要现在解释，我陪你就好。」", en: "\"You don't need to explain right now; I'm just here with you.\"" } },
    ],
    avoidList: [
      { text: { zh: "不要追问「你怎么了」——孩子可能说不出，追问本身就是压力。", en: "Don't press \"what's wrong\"—the child may not be able to say; pressing itself is pressure." } },
      { text: { zh: "不要说「再坚持一下就好」——累积期硬撑会直接掉进过载。", en: "Don't say \"just hold on a bit longer\"—pushing through the accumulating phase leads straight into overload." } },
      { text: { zh: "不要在这时提要求或纠正行为。", en: "Don't make demands or correct behavior at this point." } },
    ],
    environment: [
      { text: { zh: "主动降噪音、调暗光线、减少视觉杂乱。", en: "Actively lower noise, dim lights, and reduce visual clutter." } },
      { text: { zh: "准备孩子熟悉的安抚物（毯子/玩具/耳机）。", en: "Prepare the child's familiar comfort items (blanket/toy/headphones)." } },
      { text: { zh: "如果要换地方，提前告诉孩子路线和到达后做什么。", en: "If you're changing locations, tell the child the route and what to do on arrival in advance." } },
    ],
  },

  // ============ 预警期 · 应急 ============
  warning: {
    phase: "warning",
    phaseLabel: { zh: "预警期", en: "Warning" },
    measures: [
      { text: { zh: "离过载还有一步。现在执行预案，比硬撑过去省力得多。", en: "One step from overload. Running the plan now takes far less effort than pushing through." } },
      { text: { zh: "最小化决策：不要问「你想怎样」，直接给一个明确的下一步。", en: "Minimize decisions: don't ask \"what do you want\"; just give one clear next step." } },
      { text: { zh: "能撤就撤——从当前环境撤出来是最有效的干预。", en: "Withdraw when you can—pulling out of the current environment is the most effective intervention." } },
    ],
    scripts: [
      { text: { zh: "「我们现在走，去车里 / 去外面一会儿。」（短句，不解释）", en: "\"We're leaving now, to the car / outside for a bit.\" (Short sentence, no explanation)" } },
      { text: { zh: "「跟我来。」（伸手，不追问）", en: "\"Come with me.\" (Reach out, don't question)" } },
      { text: { zh: "「你不用说话，我带你去找个安静的地方。」", en: "\"You don't need to talk; I'll take you somewhere quiet.\"" } },
    ],
    avoidList: [
      { text: { zh: "不要讲道理、不要解释「为什么」——预警期大脑已处理不了语言逻辑。", en: "Don't reason or explain \"why\"—the brain in the warning phase can no longer process verbal logic." } },
      { text: { zh: "不要要求情绪表达（「你告诉妈妈你怎么了」）。", en: "Don't demand emotional expression (\"tell mom what's wrong\")." } },
      { text: { zh: "不要在人多/嘈杂的地方停留试图「哄好」。", en: "Don't linger in crowded/noisy places trying to \"soothe it away.\"" } },
      { text: { zh: "不要威胁后果（「再这样我们就回家」）——这只会加速崩溃。", en: "Don't threaten consequences (\"if you keep this up we'll go home\")—it only accelerates the collapse." } },
    ],
    environment: [
      { text: { zh: "立即撤离高刺激环境，找最安静的角落或室外。", en: "Leave the high-stimulus environment immediately; find the quietest corner or go outdoors." } },
      { text: { zh: "降低语言输入，多用肢体（牵手、轻拍、并肩走）。", en: "Reduce verbal input; use body language more (hold hands, light taps, walk side by side)." } },
      { text: { zh: "准备好撤退包：耳机、安抚物、水。", en: "Prepare a retreat pack: headphones, comfort items, water." } },
    ],
  },

  // ============ 过载期 · 保命 ============
  overload: {
    phase: "overload",
    phaseLabel: { zh: "过载期", en: "Overload" },
    measures: [
      { text: { zh: "已经过载。此刻不需要「应该」，只需要保护动作。", en: "Already overloaded. Right now you don't need \"should\"; you only need protective action." } },
      { text: { zh: "保证安全第一：移开危险物品，确保孩子不会伤到自己或他人。", en: "Safety first: remove dangerous objects and ensure the child won't hurt themselves or others." } },
      { text: { zh: "降低一切输入到最低：不说话、不触碰（除非安全需要）、不眼神对视。", en: "Minimize all input: no talking, no touching (unless safety requires), no eye contact." } },
    ],
    scripts: [
      { text: { zh: "「我在这里。」（低声、重复、不要求回应）", en: "\"I'm here.\" (Low voice, repeated, no response required)" } },
      { text: { zh: "「你很安全。」（只说这一句，反复）", en: "\"You're safe.\" (Just this one sentence, repeated)" } },
      { text: { zh: "（很多时候沉默陪伴比任何话都好——只是在那里）", en: "(Often silent presence is better than any words—just being there)" } },
    ],
    avoidList: [
      { text: { zh: "不要说话太多——过载期语言是额外的刺激。", en: "Don't talk too much—language is extra stimulus during overload." } },
      { text: { zh: "不要强行拥抱或触碰——可能加重过载，除非孩子主动靠近。", en: "Don't force hugs or touch—it may worsen overload, unless the child actively approaches." } },
      { text: { zh: "不要要求立刻冷静、不要要求道歉、不要复盘。", en: "Don't demand immediate calming, apology, or review." } },
      { text: { zh: "不要在孩子面前表现恐慌或愤怒——你的状态会传染。", en: "Don't show panic or anger in front of the child—your state is contagious." } },
      { text: { zh: "如果出现自伤或伤人倾向，保护安全并联系专业人士。", en: "If self-harm or harm-to-others tendencies appear, secure safety and contact a professional." } },
    ],
    environment: [
      { text: { zh: "最安静、最暗、最少人的空间。关灯/拉窗帘都可以。", en: "The quietest, darkest, least-occupied space. Turning off lights / drawing curtains is fine." } },
      { text: { zh: "移开尖锐物品和易碎品。", en: "Remove sharp objects and fragile items." } },
      { text: { zh: "给孩子一个可以蜷缩的角落（帐篷、被子、角落）。", en: "Give the child a corner to curl up in (tent, blanket, corner)." } },
      { text: { zh: "你自己也深呼吸——家长的状态是孩子最重要的环境。", en: "Take deep breaths yourself—the parent's state is the child's most important environment." } },
    ],
  },

  // ============ 恢复期 · 温柔 ============
  recovery: {
    phase: "recovery",
    phaseLabel: { zh: "恢复期", en: "Recovery" },
    measures: [
      { text: { zh: "刚经历过过载。电量低是正常的，别急着回到「平时的孩子」。", en: "Just came through overload. Low battery is normal; don't rush back to \"the usual child.\"" } },
      { text: { zh: "允许低电量：可以发呆、可以少做、可以慢。", en: "Allow low battery: zoning out is okay, doing less is okay, going slow is okay." } },
      { text: { zh: "不复盘、不分析、不「趁机教育」。等完全恢复后再谈（如果需要谈）。", en: "No review, no analysis, no \"teaching moment.\" Wait until fully recovered to talk (if talking is needed)." } },
    ],
    scripts: [
      { text: { zh: "「你刚才很辛苦，现在慢慢来。」", en: "\"That was hard just now; take it slowly.\"" } },
      { text: { zh: "「想喝水吗？想吃点什么？」（具体的、小步骤的关心）", en: "\"Want some water? Want something to eat?\" (Concrete, small-step care)" } },
      { text: { zh: "「不用说话，我陪你坐一会儿。」", en: "\"You don't need to talk; I'll sit with you for a while.\"" } },
    ],
    avoidList: [
      { text: { zh: "不要追问「刚才怎么了」「为什么那样」。", en: "Don't press \"what just happened\" or \"why you were like that.\"" } },
      { text: { zh: "不要说「下次你要……」——恢复期没有学习窗口。", en: "Don't say \"next time you should…\"—there is no learning window in recovery." } },
      { text: { zh: "不要表现出失望或心疼过度——孩子会接收到「我让大人难过」的信号。", en: "Don't show disappointment or excessive heartache—the child will pick up the signal \"I made the adult sad.\"" } },
      { text: { zh: "不要急着恢复正常日程，给恢复留时间。", en: "Don't rush back to the normal schedule; leave time for recovery." } },
    ],
    environment: [
      { text: { zh: "保持低刺激：柔和光线、安静、熟悉的人。", en: "Keep stimuli low: soft lighting, quiet, familiar people." } },
      { text: { zh: "准备孩子喜欢的、容易消化的食物和水。", en: "Prepare the child's favorite, easy-to-digest food and water." } },
      { text: { zh: "可以放熟悉的、重复的、低音量的内容（白噪音、熟悉的音乐）。", en: "You may play familiar, repetitive, low-volume content (white noise, familiar music)." } },
      { text: { zh: "接下来 24-48 小时尽量减少安排，留出大量留白。", en: "Minimize arrangements over the next 24-48 hours and leave plenty of white space." } },
    ],
  },
};

// 取某阶段的家长引导包（带兜底 · 防止非法 stage 导致 undefined）
export function getParentGuidance(phase: Phase): ParentGuidancePack {
  const pack = PARENT_GUIDANCE[phase];
  if (!pack) {
    return {
      phase,
      phaseLabel: { zh: "观察期", en: "Observation" },
      measures: [],
      scripts: [],
      avoidList: [],
      environment: [],
    };
  }
  return pack;
}
