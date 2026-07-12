import type { NeuroType, Phase, ProtocolTrigger, ProtocolAction } from "@/types";

// 循证协议模板库（基于学术文献调研 · 非诊断 · 辅助自我调节）
// 来源标注于每条 template 的 evidence 字段
// 每条模板关联适合的神经特质 + 推荐使用的阶段

export interface ProtocolTemplate {
  id: string;
  neuroTypes: NeuroType[]; // 适用的神经特质
  phases: Phase[]; // 推荐使用的阶段
  name: string; // 协议名称
  category: "grounding" | "breathing" | "sensory" | "executive" | "boundary" | "social";
  trigger: {
    description: string; // 自然语言描述，如"感官负荷 > 7"
    type: "threshold" | "time" | "behavior";
  };
  action: {
    description: string; // 执行动作描述
    duration_minutes: number;
    timer: boolean;
  };
  why: string; // 为什么这个协议有效（一句话原理）
  evidence: string; // 学术来源
}

// 分类标签
export const TEMPLATE_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  grounding: { label: "回到当下", icon: "🌿" },
  breathing: { label: "呼吸调节", icon: "🌬️" },
  sensory: { label: "感官调节", icon: "🎧" },
  executive: { label: "执行支持", icon: "🎯" },
  boundary: { label: "边界与退出", icon: "🚪" },
  social: { label: "社交能量", icon: "🤝" },
};

// 精选协议模板库（覆盖六大类 · 不同特质与阶段）
export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  // ========== Grounding（回到当下）· PTSD/ASD 优先 ==========
  {
    id: "grounding_54321",
    neuroTypes: ["ptsd", "asd", "adhd"],
    phases: ["warning", "overload"],
    name: "5-4-3-2-1 感官接地法",
    category: "grounding",
    trigger: {
      description: "感官负荷 > 7 或感到解离/闪回",
      type: "threshold",
    },
    action: {
      description:
        "依次说出 5 个看到的、4 个可触摸的、3 个听到的、2 个闻到的、1 个尝到的，把注意力锚定在当下",
      duration_minutes: 5,
      timer: true,
    },
    why: "调动五种感官将注意力从内在创伤/焦虑转向外部环境，竞争性抑制杏仁核过度激活。",
    evidence:
      "Mind, Grounding techniques for anxiety, 2023; NHS, Grounding techniques, 2024; Fisher et al., Eur J Psychotraumatol, 2016",
  },
  {
    id: "grounding_safe_object",
    neuroTypes: ["ptsd", "asd", "hsp"],
    phases: ["warning", "overload", "recovery"],
    name: "安全物品触摸",
    category: "grounding",
    trigger: {
      description: "感到不安全或被触发时",
      type: "behavior",
    },
    action: {
      description:
        "触摸随身携带的安全物品（光滑石头、布偶、手链），专注感受其质地、温度、重量约 3 分钟",
      duration_minutes: 3,
      timer: true,
    },
    why: "触觉锚点提供稳定的安全信号，通过本体感觉输入把注意力拉回身体当下，降低威胁感。",
    evidence: "Mind, Safety cues & grounding objects, 2023; NHS trauma self-help guidance",
  },
  {
    id: "grounding_safe_phrase",
    neuroTypes: ["ptsd", "asd"],
    phases: ["warning", "overload"],
    name: '"我现在安全"默念',
    category: "grounding",
    trigger: {
      description: "感到威胁感或闪回征兆",
      type: "behavior",
    },
    action: {
      description:
        '提前写下属于自己的安全话语（如"我现在在__年__地，过去已经过去"），被触发时缓慢默念 3-5 遍',
      duration_minutes: 2,
      timer: false,
    },
    why: "提前准备的安全话语在应激时可绕过认知负荷，通过语言重复激活安全回路。",
    evidence: "Mind, Safety statements for trauma, 2023; Najavits, Seeking Safety, 2002",
  },

  // ========== Breathing（呼吸调节）· 全人群 ==========
  {
    id: "breathing_box_4444",
    neuroTypes: ["asd", "adhd", "hsp", "ptsd"],
    phases: ["accumulating", "warning", "overload"],
    name: "箱式呼吸 4-4-4-4",
    category: "breathing",
    trigger: {
      description: "焦虑上升或心率加快",
      type: "threshold",
    },
    action: {
      description: "吸气 4 秒 → 屏息 4 秒 → 呼气 4 秒 → 屏息 4 秒，循环 8-10 次",
      duration_minutes: 5,
      timer: true,
    },
    why: "等长呼吸节律平衡自主神经系统，降低交感唤醒并提升心率变异性，快速稳定情绪。",
    evidence: "NHS, Stress breathing exercise, 2024; Linehan, DBT Skills Manual, 2014",
  },
  {
    id: "breathing_478",
    neuroTypes: ["asd", "adhd", "hsp", "ptsd"],
    phases: ["warning", "overload", "recovery"],
    name: "4-7-8 呼吸法",
    category: "breathing",
    trigger: {
      description: "入睡前焦虑或情绪激动",
      type: "behavior",
    },
    action: {
      description: "吸气 4 秒 → 屏息 7 秒 → 呼气 8 秒，循环 4 次，呼气长于吸气以激活副交感",
      duration_minutes: 4,
      timer: true,
    },
    why: "延长呼气激活迷走神经反射，快速降低心率和皮质醇，是天然的镇静剂。",
    evidence: "Weil, A., Breathing: The Master Key to Self-Healing, 2011; NHS 放松呼吸指南",
  },

  // ========== Sensory（感官调节）· ASD/HSP 优先 ==========
  {
    id: "sensory_deep_pressure",
    neuroTypes: ["asd", "hsp"],
    phases: ["warning", "overload"],
    name: "深压觉自我拥抱",
    category: "sensory",
    trigger: {
      description: "感官负荷 > 7 或身体紧张",
      type: "threshold",
    },
    action: {
      description:
        "双臂交叉环抱自己，施加稳定中等力度挤压 30-60 秒，松开 10 秒后重复，共 3-5 轮",
      duration_minutes: 5,
      timer: true,
    },
    why: "深压觉刺激本体感受器，激活副交感神经，降低皮质醇，缓解感官过载。",
    evidence:
      "Edelson et al., J Autism Dev Disord, 1999（Temple Grandin 挤压机研究）; Sylvia et al., J Psychiatr Pract, 2014",
  },
  {
    id: "sensory_retreat",
    neuroTypes: ["asd", "hsp"],
    phases: ["overload"],
    name: "感官退避",
    category: "sensory",
    trigger: {
      description: "感官负荷 > 8 或接近崩溃",
      type: "threshold",
    },
    action: {
      description: "立即离开当前环境，进入低刺激空间（暗光、安静、无人），静坐或躺下 10 分钟",
      duration_minutes: 10,
      timer: true,
    },
    why: "移除感官输入源是过载期最有效的干预，给神经系统降载窗口期。",
    evidence:
      "NAS (National Autistic Society), Sensory safe spaces, 2024; ASD 感官环境调整指南",
  },
  {
    id: "sensory_noise_cancel",
    neuroTypes: ["asd", "hsp", "adhd"],
    phases: ["accumulating", "warning"],
    name: "降噪耳机时间",
    category: "sensory",
    trigger: {
      description: "环境噪音开始累积或注意力被干扰",
      type: "threshold",
    },
    action: {
      description: "戴上降噪耳机（可不播放音乐），隔离环境声音 15 分钟，专注呼吸或手头任务",
      duration_minutes: 15,
      timer: true,
    },
    why: "听觉是 ASD/HSP 最易过载的通道之一，主动降噪减少听觉输入累积，保护感官预算。",
    evidence: "NAS, Sensory toolkit for autistic people, 2024; ASD 感官工具包推荐",
  },

  // ========== Executive（执行支持）· ADHD 优先 ==========
  {
    id: "executive_5min_start",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating"],
    name: "5 分钟启动法",
    category: "executive",
    trigger: {
      description: "对某任务反复拖延或启动困难",
      type: "behavior",
    },
    action: {
      description: '告诉自己"只做 5 分钟，随时可以停"，设定 5 分钟计时器后开始最小第一步',
      duration_minutes: 5,
      timer: true,
    },
    why: "ADHD 启动困难源于前额叶行为激活阈值过高，把承诺降到 5 分钟极大降低门槛，行为惯性自然延续。",
    evidence:
      "ADDitude Magazine, Getting started with ADHD, 2023; Dimidjian et al., JAMA, 2006（行为激活）",
  },
  {
    id: "executive_dopamine_brake",
    neuroTypes: ["adhd"],
    phases: ["warning", "overload"],
    name: "多巴胺紧急制动",
    category: "executive",
    trigger: {
      description: "多巴胺电量见底或冲动行为加剧",
      type: "threshold",
    },
    action: {
      description:
        "立即停止手头一切任务，关闭所有屏幕，躺下或坐着不动 10 分钟。不看手机、不做决定、不要求自己「有用」。允许发呆或闭眼。",
      duration_minutes: 10,
      timer: true,
    },
    why: "ADHD 过载期多巴胺耗竭，继续任务只会加剧崩溃。完全停止输入让前额叶从超载中冷却，类似感官撤退但针对执行功能。",
    evidence:
      "Barkley, ADHD and the Nature of Self-Regulation, 2023; ADDitude, ADHD burnout recovery, 2024",
  },
  {
    id: "executive_body_reset",
    neuroTypes: ["adhd"],
    phases: ["overload", "recovery"],
    name: "身体重置（高强度运动）",
    category: "executive",
    trigger: {
      description: "过载期坐立不安或冲动难以控制",
      type: "behavior",
    },
    action: {
      description:
        "做 5-10 分钟高强度身体活动：原地跑步、深蹲、跳跃或快走。让积压的冲动能量通过身体释放，给多巴胺系统一个物理出口。",
      duration_minutes: 7,
      timer: true,
    },
    why: "ADHD 过载常伴随高水平的身体冲动能量，高强度运动快速消耗肾上腺素并释放内啡肽，比静坐更有效地重置执行功能。",
    evidence:
      "Ratey, Spark: The Revolutionary New Science of Exercise and the Brain, 2013; Halasz et al., J Atten Disord, 2019",
  },
  {
    id: "executive_externalize_brain",
    neuroTypes: ["adhd"],
    phases: ["warning", "overload"],
    name: "大脑外化（清空纸张）",
    category: "executive",
    trigger: {
      description: "脑内任务循环加剧或无法停止思考",
      type: "behavior",
    },
    action: {
      description:
        "拿出一张纸，把脑中所有盘旋的任务、想法、冲动全部写下来，不整理不排序。写完后告诉自己「现在它们在纸上，不用记在脑里了」。",
      duration_minutes: 5,
      timer: false,
    },
    why: "ADHD 工作记忆容量有限，过载期脑内任务循环加剧焦虑。外化到纸面释放工作记忆负荷，降低前额叶认知负担。",
    evidence:
      "Barkley, Taking Charge of ADHD, 2020（外部化策略）; ADDitude, ADHD brain dumps, 2023",
  },
  {
    id: "executive_body_double",
    neuroTypes: ["adhd", "asd"],
    phases: ["stable", "accumulating"],
    name: "body doubling 邀请",
    category: "executive",
    trigger: {
      description: "需要完成重要任务但缺乏动力",
      type: "behavior",
    },
    action: {
      description:
        "约朋友/同事一起做事，或登录 Focusmate 匹配陌生人，各自工作互不打扰，靠他人在场维持专注",
      duration_minutes: 15,
      timer: false,
    },
    why: "基于社会促进效应，他人在场提供外部监督与结构，弥补内在动机不足。",
    evidence:
      "ADDitude, Body doubling for ADHD, 2023; Zajonc, Science, 1965（社会促进效应）",
  },
  {
    id: "executive_task_breakdown",
    neuroTypes: ["adhd", "asd"],
    phases: ["stable", "accumulating"],
    name: "任务拆解清单",
    category: "executive",
    trigger: {
      description: "面对大任务感到无从下手",
      type: "behavior",
    },
    action: {
      description:
        '把一个大任务拆成 3 个最小可执行步骤，每步写具体动作（如"打开文档"而非"写报告"），完成即划掉',
      duration_minutes: 5,
      timer: false,
    },
    why: "拆解降低任务认知负荷，每完成一小步获得成就奖励，形成正向循环。",
    evidence:
      "Goldstein & Brooks, Raising Resilient Children, 2019（小成就原则）; ADHD 执行功能支持文献",
  },

  // ========== Boundary（边界与退出）· HSP/PTSD 优先 ==========
  {
    id: "boundary_decline_script",
    neuroTypes: ["hsp", "ptsd"],
    phases: ["stable", "accumulating"],
    name: '"这对我来说不合适"练习',
    category: "boundary",
    trigger: {
      description: "被请求做不想做的事时",
      type: "time",
    },
    action: {
      description: '练习用一句话拒绝："这对我来说不合适"，不解释、不道歉、不补偿，重复直到自然',
      duration_minutes: 3,
      timer: false,
    },
    why: "HSP 高共情倾向常过度让步导致耗竭，结构化拒绝脚本降低边界设定的情绪成本。",
    evidence:
      "Aron, The Highly Sensitive Person, 1996; Aron & Aron, J Pers Soc Psychol, 1997",
  },
  {
    id: "boundary_exit_signal",
    neuroTypes: ["hsp", "ptsd", "asd"],
    phases: ["accumulating", "warning"],
    name: "社交退出信号",
    category: "boundary",
    trigger: {
      description: "社交电量 < 3 或预感即将过载",
      type: "threshold",
    },
    action: {
      description: "提前与信任的人约定离场暗号（手势、暗语），触发时无需解释即可退出社交场合",
      duration_minutes: 2,
      timer: false,
    },
    why: "提前约定的退出机制减少临场决策负担，避免硬撑到崩溃。",
    evidence: "Aron, 1996; HSP 社交耗竭应对策略文献",
  },
  {
    id: "boundary_budget_check",
    neuroTypes: ["hsp", "asd"],
    phases: ["stable", "accumulating"],
    name: "感官预算检查",
    category: "boundary",
    trigger: {
      description: "每日早晨或重大活动前",
      type: "time",
    },
    action: {
      description:
        "评估今日剩余感官/社交能量（1-10 分），若预算 < 消耗总和则削减非必要安排，为高消耗活动预留恢复缓冲",
      duration_minutes: 5,
      timer: false,
    },
    why: "将隐性消耗显性化，结构化能量预算预防慢性过载。",
    evidence:
      "Aron, 1996（感官预算概念）; Raymaker et al., Autism in Adulthood, 2020",
  },

  // ========== Social（社交能量）· ASD/ADHD 优先 ==========
  {
    id: "social_transition_preview",
    neuroTypes: ["asd", "adhd"],
    phases: ["stable", "accumulating"],
    name: "社交接班前预告",
    category: "social",
    trigger: {
      description: "有即将到来的社交活动",
      type: "time",
    },
    action: {
      description:
        "社交活动前 30 分钟：查看议程/参与人、准备 2 个安全话题、设定离场时间和方式，降低不确定性",
      duration_minutes: 10,
      timer: false,
    },
    why: "预告与过渡为 ASD 大脑提供结构化预期，降低切换成本和社交焦虑。",
    evidence: "NAS, Transitions & predictability for autistic people, 2024; ASD 过渡支持指南",
  },
  {
    id: "social_recovery_window",
    neuroTypes: ["asd", "adhd", "hsp"],
    phases: ["warning", "overload", "recovery"],
    name: "社交后恢复窗口",
    category: "social",
    trigger: {
      description: "社交电量 < 4 或社交活动结束后",
      type: "threshold",
    },
    action: {
      description:
        "社交结束后独处 20 分钟，低刺激环境（暗光、安静），不做任何社交互动，允许自我刺激或发呆",
      duration_minutes: 20,
      timer: true,
    },
    why: "社交消耗后的恢复窗口让神经系统从高唤起回归基线，预防累积性社交耗竭。",
    evidence:
      "Aron, 1996; Aron, The Highly Sensitive Person's Workbook, 1999（社交恢复）",
  },
];

// 按神经特质过滤模板（严格隔离 · ASD 只看 ASD 专属 · ADHD 只看 ADHD 专属）
// "other"返回全库作为通用池
export function getTemplatesByNeuroType(neuroType: NeuroType): ProtocolTemplate[] {
  if (neuroType === "other") return PROTOCOL_TEMPLATES;
  const otherPrimary: NeuroType | null =
    neuroType === "asd" ? "adhd" : neuroType === "adhd" ? "asd" : null;
  return PROTOCOL_TEMPLATES.filter((t) => {
    if (!t.neuroTypes.includes(neuroType)) return false;
    if (otherPrimary && t.neuroTypes.includes(otherPrimary)) return false;
    return true;
  });
}

// 按阶段排序模板（当前阶段命中的排前面）
export function sortTemplatesByPhase(
  templates: ProtocolTemplate[],
  phase: Phase,
): ProtocolTemplate[] {
  return [...templates].sort((a, b) => {
    const aMatch = a.phases.includes(phase) ? 0 : 1;
    const bMatch = b.phases.includes(phase) ? 0 : 1;
    return aMatch - bMatch;
  });
}

// 把模板转为可添加的协议格式（匹配 store.addProtocol 的入参）
export function templateToProtocol(template: ProtocolTemplate): {
  trigger: ProtocolTrigger;
  action: ProtocolAction;
  source: "ai_suggestion";
  status: "candidate";
  phases: Phase[];
} {
  return {
    trigger: {
      type: template.trigger.type,
      description: template.trigger.description,
    },
    action: {
      description: template.action.description,
      duration_minutes: template.action.duration_minutes,
      timer: template.action.timer,
    },
    source: "ai_suggestion",
    status: "candidate",
    phases: template.phases,
  };
}
