import type { LocalText, NeuroType, Phase, ProtocolTrigger, ProtocolAction, ADHDSubtype } from "@/types";

// 循证协议模板库（基于学术文献调研 · 非诊断 · 辅助自我调节）
// 来源标注于每条 template 的 evidence 字段
// 每条模板关联适合的神经特质 + 推荐使用的阶段

export interface ProtocolTemplate {
  id: string;
  neuroTypes: NeuroType[]; // 适用的神经特质
  phases: Phase[]; // 推荐使用的阶段
  name: LocalText; // 协议名称
  category: "grounding" | "breathing" | "sensory" | "executive" | "boundary" | "social";
  trigger: {
    description: LocalText; // 自然语言描述，如"感官负荷 > 7"
    type: "threshold" | "time" | "behavior";
  };
  action: {
    description: LocalText; // 执行动作描述
    duration_minutes: number;
    timer: boolean;
  };
  why: LocalText; // 为什么这个协议有效（一句话原理）
  evidence: string; // 学术来源
  adhdSubtypes?: ADHDSubtype[]; // ADHD 子类型限定（仅 neuroTypes 含 adhd 时有意义）
}

// 分类标签
export const TEMPLATE_CATEGORY_LABELS: Record<string, { label: LocalText; icon: string }> = {
  grounding: { label: { zh: "回到当下", en: "Grounding" }, icon: "🌿" },
  breathing: { label: { zh: "呼吸调节", en: "Breathing" }, icon: "🌬️" },
  sensory: { label: { zh: "感官调节", en: "Sensory regulation" }, icon: "🎧" },
  executive: { label: { zh: "执行支持", en: "Executive support" }, icon: "🎯" },
  boundary: { label: { zh: "边界与退出", en: "Boundary & exit" }, icon: "🚪" },
  social: { label: { zh: "社交能量", en: "Social energy" }, icon: "🤝" },
};

// 精选协议模板库（覆盖六大类 · 不同特质与阶段）
export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  // ========== Grounding（回到当下）· PTSD/ASD 优先 ==========
  {
    id: "grounding_54321",
    neuroTypes: ["ptsd", "asd", "adhd"],
    phases: ["warning", "overload"],
    name: { zh: "5-4-3-2-1 感官接地法", en: "5-4-3-2-1 Sensory Grounding" },
    category: "grounding",
    trigger: {
      description: { zh: "感官负荷 > 7 或感到解离/闪回", en: "Sensory load > 7 or feeling dissociation/flashbacks" },
      type: "threshold",
    },
    action: {
      description: {
        zh: "依次说出 5 个看到的、4 个可触摸的、3 个听到的、2 个闻到的、1 个尝到的，把注意力锚定在当下",
        en: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste to anchor attention in the present",
      },
      duration_minutes: 5,
      timer: true,
    },
    why: { zh: "调动五种感官将注意力从内在创伤/焦虑转向外部环境，竞争性抑制杏仁核过度激活。", en: "Engaging the five senses shifts attention from internal trauma/anxiety to the external environment, competitively inhibiting amygdala hyperactivation." },
    evidence:
      "Mind, Grounding techniques for anxiety, 2023; NHS, Grounding techniques, 2024; Fisher et al., Eur J Psychotraumatol, 2016",
  },
  {
    id: "grounding_safe_object",
    neuroTypes: ["ptsd", "asd", "hsp"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "安全物品触摸", en: "Safe Object Touch" },
    category: "grounding",
    trigger: {
      description: { zh: "感到不安全或被触发时", en: "Feeling unsafe or triggered" },
      type: "behavior",
    },
    action: {
      description: {
        zh: "触摸随身携带的安全物品（光滑石头、布偶、手链），专注感受其质地、温度、重量约 3 分钟",
        en: "Touch a carried safe object (smooth stone, plush, bracelet); focus on its texture, temperature, and weight for about 3 minutes",
      },
      duration_minutes: 3,
      timer: true,
    },
    why: { zh: "触觉锚点提供稳定的安全信号，通过本体感觉输入把注意力拉回身体当下，降低威胁感。", en: "A tactile anchor provides a steady safety signal; proprioceptive input pulls attention back to the body in the present, reducing the sense of threat." },
    evidence: "Mind, Safety cues & grounding objects, 2023; NHS trauma self-help guidance",
  },
  {
    id: "grounding_safe_phrase",
    neuroTypes: ["ptsd", "asd"],
    phases: ["warning", "overload"],
    name: { zh: '"我现在安全"默念', en: '"I am safe now" Silent Repetition' },
    category: "grounding",
    trigger: {
      description: { zh: "感到威胁感或闪回征兆", en: "Feeling a sense of threat or signs of flashback" },
      type: "behavior",
    },
    action: {
      description: {
        zh: '提前写下属于自己的安全话语（如"我现在在__年__地，过去已经过去"），被触发时缓慢默念 3-5 遍',
        en: 'Write a personal safety statement in advance (e.g., "I am in __ place in __ year; the past is past"); silently repeat it 3-5 times when triggered',
      },
      duration_minutes: 2,
      timer: false,
    },
    why: { zh: "提前准备的安全话语在应激时可绕过认知负荷，通过语言重复激活安全回路。", en: "A pre-prepared safety statement bypasses cognitive load during stress; verbal repetition activates safety circuits." },
    evidence: "Mind, Safety statements for trauma, 2023; Najavits, Seeking Safety, 2002",
  },

  // ========== Breathing（呼吸调节）· 全人群 ==========
  {
    id: "breathing_box_4444",
    neuroTypes: ["asd", "adhd", "hsp", "ptsd"],
    phases: ["accumulating", "warning", "overload"],
    name: { zh: "箱式呼吸 4-4-4-4", en: "Box Breathing 4-4-4-4" },
    category: "breathing",
    trigger: {
      description: { zh: "焦虑上升或心率加快", en: "Rising anxiety or heart rate" },
      type: "threshold",
    },
    action: {
      description: { zh: "吸气 4 秒 → 屏息 4 秒 → 呼气 4 秒 → 屏息 4 秒，循环 8-10 次", en: "Inhale 4s → hold 4s → exhale 4s → hold 4s; repeat 8-10 cycles" },
      duration_minutes: 5,
      timer: true,
    },
    why: { zh: "等长呼吸节律平衡自主神经系统，降低交感唤醒并提升心率变异性，快速稳定情绪。", en: "Equal-length breathing balances the autonomic nervous system, lowers sympathetic arousal, and raises heart-rate variability, quickly stabilizing mood." },
    evidence: "NHS, Stress breathing exercise, 2024; Linehan, DBT Skills Manual, 2014",
  },
  {
    id: "breathing_478",
    neuroTypes: ["asd", "adhd", "hsp", "ptsd"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "4-7-8 呼吸法", en: "4-7-8 Breathing" },
    category: "breathing",
    trigger: {
      description: { zh: "入睡前焦虑或情绪激动", en: "Pre-sleep anxiety or emotional agitation" },
      type: "behavior",
    },
    action: {
      description: { zh: "吸气 4 秒 → 屏息 7 秒 → 呼气 8 秒，循环 4 次，呼气长于吸气以激活副交感", en: "Inhale 4s → hold 7s → exhale 8s; repeat 4 cycles. Exhalation longer than inhalation activates the parasympathetic system" },
      duration_minutes: 4,
      timer: true,
    },
    why: { zh: "延长呼气激活迷走神经反射，快速降低心率和皮质醇，是天然的镇静剂。", en: "Extended exhalation activates the vagal reflex, rapidly lowering heart rate and cortisol—a natural sedative." },
    evidence: "Weil, A., Breathing: The Master Key to Self-Healing, 2011; NHS relaxation breathing guidance",
  },

  // ========== Sensory（感官调节）· ASD/HSP 优先 ==========
  {
    id: "sensory_deep_pressure",
    neuroTypes: ["asd", "hsp"],
    phases: ["warning", "overload"],
    name: { zh: "深压觉自我拥抱", en: "Deep Pressure Self-Hug" },
    category: "sensory",
    trigger: {
      description: { zh: "感官负荷 > 7 或身体紧张", en: "Sensory load > 7 or physical tension" },
      type: "threshold",
    },
    action: {
      description: {
        zh: "双臂交叉环抱自己，施加稳定中等力度挤压 30-60 秒，松开 10 秒后重复，共 3-5 轮",
        en: "Cross your arms and hug yourself, applying steady moderate pressure for 30-60s; release for 10s and repeat for 3-5 rounds",
      },
      duration_minutes: 5,
      timer: true,
    },
    why: { zh: "深压觉刺激本体感受器，激活副交感神经，降低皮质醇，缓解感官过载。", en: "Deep pressure stimulates proprioceptors, activates the parasympathetic nervous system, lowers cortisol, and relieves sensory overload." },
    evidence:
      "Edelson et al., J Autism Dev Disord, 1999（Temple Grandin 挤压机研究）; Sylvia et al., J Psychiatr Pract, 2014",
  },
  {
    id: "sensory_retreat",
    neuroTypes: ["asd", "hsp"],
    phases: ["overload"],
    name: { zh: "感官退避", en: "Sensory Retreat" },
    category: "sensory",
    trigger: {
      description: { zh: "感官负荷 > 8 或接近崩溃", en: "Sensory load > 8 or near meltdown" },
      type: "threshold",
    },
    action: {
      description: { zh: "立即离开当前环境，进入低刺激空间（暗光、安静、无人），静坐或躺下 10 分钟", en: "Leave the current environment immediately; enter a low-stimulus space (dim light, quiet, no people) and sit or lie down for 10 minutes" },
      duration_minutes: 10,
      timer: true,
    },
    why: { zh: "移除感官输入源是过载期最有效的干预，给神经系统降载窗口期。", en: "Removing sensory input is the most effective intervention during overload; it gives the nervous system a de-loading window." },
    evidence:
      "NAS (National Autistic Society), Sensory safe spaces, 2024; ASD sensory environment adjustment guidelines",
  },
  {
    id: "sensory_noise_cancel",
    neuroTypes: ["asd", "hsp", "adhd"],
    phases: ["accumulating", "warning"],
    name: { zh: "降噪耳机时间", en: "Noise-Canceling Headphone Time" },
    category: "sensory",
    trigger: {
      description: { zh: "环境噪音开始累积或注意力被干扰", en: "Environmental noise starts accumulating or attention is disrupted" },
      type: "threshold",
    },
    action: {
      description: { zh: "戴上降噪耳机（可不播放音乐），隔离环境声音 15 分钟，专注呼吸或手头任务", en: "Put on noise-canceling headphones (music optional); isolate environmental sound for 15 minutes and focus on breathing or the task at hand" },
      duration_minutes: 15,
      timer: true,
    },
    why: { zh: "听觉是 ASD/HSP 最易过载的通道之一，主动降噪减少听觉输入累积，保护感官预算。", en: "Hearing is one of the most easily overloaded channels for ASD/HSP; active noise reduction reduces auditory accumulation and protects the sensory budget." },
    evidence: "NAS, Sensory toolkit for autistic people, 2024; ASD sensory toolkit recommendations",
  },

  // ========== Executive（执行支持）· ADHD 优先 ==========
  {
    id: "executive_5min_start",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating"],
    name: { zh: "5 分钟启动法", en: "5-Minute Start Method" },
    category: "executive",
    trigger: {
      description: { zh: "对某任务反复拖延或启动困难", en: "Repeated procrastination or difficulty starting a task" },
      type: "behavior",
    },
    action: {
      description: { zh: '告诉自己"只做 5 分钟，随时可以停"，设定 5 分钟计时器后开始最小第一步', en: 'Tell yourself "just 5 minutes, I can stop anytime"; set a 5-minute timer and start the smallest first step' },
      duration_minutes: 5,
      timer: true,
    },
    why: { zh: "ADHD 启动困难源于前额叶行为激活阈值过高，把承诺降到 5 分钟极大降低门槛，行为惯性自然延续。", en: "ADHD initiation difficulty stems from a high behavioral activation threshold in the prefrontal cortex; lowering the commitment to 5 minutes drastically reduces the threshold and behavioral momentum carries on." },
    evidence:
      "ADDitude Magazine, Getting started with ADHD, 2023; Dimidjian et al., JAMA, 2006（行为激活）",
  },
  {
    id: "executive_dopamine_brake",
    neuroTypes: ["adhd"],
    phases: ["warning", "overload"],
    name: { zh: "多巴胺紧急制动", en: "Dopamine Emergency Brake" },
    category: "executive",
    trigger: {
      description: { zh: "多巴胺电量见底或冲动行为加剧", en: "Dopamine battery bottoming out or impulsive behavior escalating" },
      type: "threshold",
    },
    action: {
      description: {
        zh: "立即停止手头一切任务，关闭所有屏幕，躺下或坐着不动 10 分钟。不看手机、不做决定、不要求自己「有用」。允许发呆或闭眼。",
        en: "Stop all tasks immediately, turn off all screens, and lie or sit still for 10 minutes. No phone, no decisions, no demands to be \"useful\". Mind-wandering or closing eyes is allowed.",
      },
      duration_minutes: 10,
      timer: true,
    },
    why: { zh: "ADHD 过载期多巴胺耗竭，继续任务只会加剧崩溃。完全停止输入让前额叶从超载中冷却，类似感官撤退但针对执行功能。", en: "During ADHD overload dopamine is depleted; continuing tasks only worsens collapse. Stopping all input lets the prefrontal cortex cool down from overload—like sensory retreat but for executive function." },
    evidence:
      "Barkley, ADHD and the Nature of Self-Regulation, 2023; ADDitude, ADHD burnout recovery, 2024",
  },
  {
    id: "executive_body_reset",
    neuroTypes: ["adhd"],
    phases: ["overload", "recovery"],
    name: { zh: "身体重置（高强度运动）", en: "Body Reset (High-Intensity Movement)" },
    category: "executive",
    trigger: {
      description: { zh: "过载期坐立不安或冲动难以控制", en: "Restlessness during overload or impulses hard to control" },
      type: "behavior",
    },
    action: {
      description: {
        zh: "做 5-10 分钟高强度身体活动：原地跑步、深蹲、跳跃或快走。让积压的冲动能量通过身体释放，给多巴胺系统一个物理出口。",
        en: "Do 5-10 minutes of high-intensity physical activity: run in place, squats, jumps, or brisk walking. Release pent-up impulsive energy through the body and give the dopamine system a physical outlet.",
      },
      duration_minutes: 7,
      timer: true,
    },
    why: { zh: "ADHD 过载常伴随高水平的身体冲动能量，高强度运动快速消耗肾上腺素并释放内啡肽，比静坐更有效地重置执行功能。", en: "ADHD overload often comes with high levels of physical impulsive energy; high-intensity exercise rapidly consumes adrenaline and releases endorphins, resetting executive function more effectively than sitting still." },
    evidence:
      "Ratey, Spark: The Revolutionary New Science of Exercise and the Brain, 2013; Halasz et al., J Atten Disord, 2019",
  },
  {
    id: "executive_externalize_brain",
    neuroTypes: ["adhd"],
    phases: ["warning", "overload"],
    name: { zh: "大脑外化（清空纸张）", en: "Externalize the Brain (Paper Brain Dump)" },
    category: "executive",
    trigger: {
      description: { zh: "脑内任务循环加剧或无法停止思考", en: "Mental task loop escalating or unable to stop thinking" },
      type: "behavior",
    },
    action: {
      description: {
        zh: "拿出一张纸，把脑中所有盘旋的任务、想法、冲动全部写下来，不整理不排序。写完后告诉自己「现在它们在纸上，不用记在脑里了」。",
        en: "Take a sheet of paper and write down every task, thought, and impulse circling in your head—no organizing or sorting. When done, tell yourself: \"They are on paper now; I don't need to hold them in my head.\"",
      },
      duration_minutes: 5,
      timer: false,
    },
    why: { zh: "ADHD 工作记忆容量有限，过载期脑内任务循环加剧焦虑。外化到纸面释放工作记忆负荷，降低前额叶认知负担。", en: "ADHD working memory is limited; mental task loops in overload intensify anxiety. Externalizing to paper releases working memory load and reduces prefrontal cognitive burden." },
    evidence:
      "Barkley, Taking Charge of ADHD, 2020（外部化策略）; ADDitude, ADHD brain dumps, 2023",
  },
  {
    id: "executive_body_double",
    neuroTypes: ["adhd", "asd"],
    phases: ["stable", "accumulating"],
    name: { zh: "body doubling 邀请", en: "Body Doubling Invitation" },
    category: "executive",
    trigger: {
      description: { zh: "需要完成重要任务但缺乏动力", en: "Need to complete an important task but lack motivation" },
      type: "behavior",
    },
    action: {
      description: {
        zh: "约朋友/同事一起做事，或登录 Focusmate 匹配陌生人，各自工作互不打扰，靠他人在场维持专注",
        en: "Invite a friend/colleague to work alongside, or log in to Focusmate to match with a stranger; each works independently without interruption, sustaining focus through the presence of another",
      },
      duration_minutes: 15,
      timer: false,
    },
    why: { zh: "基于社会促进效应，他人在场提供外部监督与结构，弥补内在动机不足。", en: "Based on social facilitation; the presence of others provides external oversight and structure, compensating for insufficient intrinsic motivation." },
    evidence:
      "ADDitude, Body doubling for ADHD, 2023; Zajonc, Science, 1965（社会促进效应）",
  },
  {
    id: "executive_task_breakdown",
    neuroTypes: ["adhd", "asd"],
    phases: ["stable", "accumulating"],
    name: { zh: "任务拆解清单", en: "Task Breakdown Checklist" },
    category: "executive",
    trigger: {
      description: { zh: "面对大任务感到无从下手", en: "Feeling overwhelmed by a large task and unsure where to start" },
      type: "behavior",
    },
    action: {
      description: {
        zh: '把一个大任务拆成 3 个最小可执行步骤，每步写具体动作（如"打开文档"而非"写报告"），完成即划掉',
        en: 'Break a large task into 3 smallest executable steps; write a concrete action for each (e.g., "open the document" rather than "write the report"); cross off each as completed',
      },
      duration_minutes: 5,
      timer: false,
    },
    why: { zh: "拆解降低任务认知负荷，每完成一小步获得成就奖励，形成正向循环。", en: "Breakdown reduces cognitive load; each small completion delivers an achievement reward, creating a positive loop." },
    evidence:
      "Goldstein & Brooks, Raising Resilient Children, 2019（小成就原则）; ADHD 执行功能支持文献",
  },

  // ========== ADHD 子类型专属协议 ==========
  // 注意力缺陷型 · 侧重注意力锚定与外部结构
  {
    id: "executive_attention_anchor",
    neuroTypes: ["adhd"],
    adhdSubtypes: ["inattentive", "combined"],
    phases: ["stable", "accumulating"],
    name: { zh: "注意力锚定（可视计时器）", en: "Attention Anchor (Visual Timer)" },
    category: "executive",
    trigger: {
      description: { zh: "做任务时频繁走神或遗漏步骤", en: "Frequently zoning out or missing steps during tasks" },
      type: "behavior",
    },
    action: {
      description: { zh: "在视线内放一个可视计时器（沙漏/番茄钟），把任务拆成 10 分钟小段。每段开始前说出「这 10 分钟只做 X」，结束后口头确认完成。", en: "Place a visual timer (hourglass/Pomodoro) in view; break tasks into 10-minute segments. Say \"these 10 minutes are only for X\" before each segment, and confirm completion afterward." },
      duration_minutes: 10,
      timer: true,
    },
    why: { zh: "注意力缺陷型的核心困难是维持注意力和工作记忆。外部可视锚点补偿内在时间感缺失，口头确认强化完成回路。", en: "Inattentive type's core difficulty is sustaining attention and working memory. External visual anchors compensate for internal time blindness; verbal confirmation reinforces completion circuits." },
    evidence: "Brown, A New Understanding of ADHD in Children and Adults, 2013; Barkley, ADHD executive function interventions",
  },
  {
    id: "executive_external_structure",
    neuroTypes: ["adhd"],
    adhdSubtypes: ["inattentive", "combined"],
    phases: ["stable", "accumulating", "warning"],
    name: { zh: "外部结构清单（每日三件事）", en: "External Structure (Daily Top 3)" },
    category: "executive",
    trigger: {
      description: { zh: "一天结束发现重要的事没做", en: "Day ends and important things weren't done" },
      type: "behavior",
    },
    action: {
      description: { zh: "每天早上用纸笔写下今天最重要的 3 件事，贴在显眼处。完成一件划掉一件。不列超过 3 件。", en: "Each morning write the top 3 most important things on paper, place it visibly. Cross off each completion. Never list more than 3." },
      duration_minutes: 3,
      timer: false,
    },
    why: { zh: "注意力缺陷型容易被即时刺激拉走，外部清单把优先级从脑内移到眼前，限制 3 件防止清单本身变成负担。", en: "Inattentive type gets pulled by immediate stimuli; external lists move priorities from mind to sight, limiting to 3 prevents the list itself from becoming a burden." },
    evidence: "Ratey & Hallowell, Delivered from Distraction, 2005; ADHD external structure literature",
  },
  // 多动冲动型 · 侧重能量释放与冲动缓冲
  {
    id: "executive_impulse_buffer",
    neuroTypes: ["adhd"],
    adhdSubtypes: ["hyperactive", "combined"],
    phases: ["warning", "overload"],
    name: { zh: "冲动缓冲（10 秒法则）", en: "Impulse Buffer (10-Second Rule)" },
    category: "executive",
    trigger: {
      description: { zh: "想冲动说话、买东西或做决定时", en: "Urge to speak impulsively, buy something, or make a decision" },
      type: "behavior",
    },
    action: {
      description: { zh: "在行动前默数 10 秒。问自己「这件事 1 小时后还重要吗」。如果答案是否，就先不做。", en: "Count to 10 silently before acting. Ask: \"Will this still matter in 1 hour?\" If no, don't do it yet." },
      duration_minutes: 1,
      timer: true,
    },
    why: { zh: "多动冲动型的核心困难是抑制控制。10 秒延迟让前额叶有机会介入，打断杏仁核驱动的即时反应。", en: "Hyperactive-impulsive type's core difficulty is inhibitory control. A 10-second delay allows the prefrontal cortex to intervene, interrupting amygdala-driven immediate reactions." },
    evidence: "Barkley, ADHD and the Nature of Self-Regulation, 2023; Barkley, inhibitory control research",
  },
  {
    id: "executive_energy_release",
    neuroTypes: ["adhd"],
    adhdSubtypes: ["hyperactive", "combined"],
    phases: ["accumulating", "warning"],
    name: { zh: "能量释放通道（微运动）", en: "Energy Channel (Micro-Movement)" },
    category: "executive",
    trigger: {
      description: { zh: "坐不住但需要继续当前任务", en: "Restless but need to continue current task" },
      type: "behavior",
    },
    action: {
      description: { zh: "在不离开当前场景的前提下做微运动：捏减压球、脚下踩弹力带、站立办公、椅子上晃腿。给身体一个不干扰注意力的出口。", en: "Do micro-movements without leaving the current setting: squeeze a stress ball, step on a resistance band, stand at desk, bounce leg in chair. Give the body an outlet that doesn't disrupt attention." },
      duration_minutes: 0,
      timer: false,
    },
    why: { zh: "多动冲动型身体的运动需求是生理性的，不是意志力问题。提供不干扰的微运动出口比强行静止更有效。", en: "Hyperactive-impulsive type's need for movement is physiological, not a willpower issue. Providing non-disruptive micro-movement outlets is more effective than forcing stillness." },
    evidence: "Ratey, Spark, 2013; Halasz et al., J Atten Disord, 2019; ADHD movement-based interventions",
  },

  // ========== Boundary（边界与退出）· HSP/PTSD 优先 ==========
  {
    id: "boundary_decline_script",
    neuroTypes: ["hsp", "ptsd"],
    phases: ["stable", "accumulating"],
    name: { zh: '"这对我来说不合适"练习', en: '"This isn\'t right for me" Practice' },
    category: "boundary",
    trigger: {
      description: { zh: "被请求做不想做的事时", en: "When asked to do something you don't want to do" },
      type: "time",
    },
    action: {
      description: { zh: '练习用一句话拒绝："这对我来说不合适"，不解释、不道歉、不补偿，重复直到自然', en: 'Practice refusing in one sentence: "This isn\'t right for me"—no explaining, no apologizing, no compensating; repeat until it feels natural' },
      duration_minutes: 3,
      timer: false,
    },
    why: { zh: "HSP 高共情倾向常过度让步导致耗竭，结构化拒绝脚本降低边界设定的情绪成本。", en: "HSP's high empathy often leads to over-accommodation and burnout; a structured refusal script lowers the emotional cost of setting boundaries." },
    evidence:
      "Aron, The Highly Sensitive Person, 1996; Aron & Aron, J Pers Soc Psychol, 1997",
  },
  {
    id: "boundary_exit_signal",
    neuroTypes: ["hsp", "ptsd", "asd"],
    phases: ["accumulating", "warning"],
    name: { zh: "社交退出信号", en: "Social Exit Signal" },
    category: "boundary",
    trigger: {
      description: { zh: "社交电量 < 3 或预感即将过载", en: "Social battery < 3 or sensing approaching overload" },
      type: "threshold",
    },
    action: {
      description: { zh: "提前与信任的人约定离场暗号（手势、暗语），触发时无需解释即可退出社交场合", en: "Pre-arrange a departure cue (gesture, code word) with a trusted person; when triggered, exit the social setting without explanation" },
      duration_minutes: 2,
      timer: false,
    },
    why: { zh: "提前约定的退出机制减少临场决策负担，避免硬撑到崩溃。", en: "A pre-agreed exit mechanism reduces in-the-moment decision load and avoids pushing through to collapse." },
    evidence: "Aron, 1996; HSP social burnout coping literature",
  },
  {
    id: "boundary_budget_check",
    neuroTypes: ["hsp", "asd"],
    phases: ["stable", "accumulating"],
    name: { zh: "感官预算检查", en: "Sensory Budget Check" },
    category: "boundary",
    trigger: {
      description: { zh: "每日早晨或重大活动前", en: "Every morning or before major events" },
      type: "time",
    },
    action: {
      description: {
        zh: "评估今日剩余感官/社交能量（1-10 分），若预算 < 消耗总和则削减非必要安排，为高消耗活动预留恢复缓冲",
        en: "Rate today's remaining sensory/social energy (1-10); if the budget is less than total consumption, cut non-essential commitments and reserve a recovery buffer around high-drain activities",
      },
      duration_minutes: 5,
      timer: false,
    },
    why: { zh: "将隐性消耗显性化，结构化能量预算预防慢性过载。", en: "Makes hidden drains visible; structured energy budgeting prevents chronic overload." },
    evidence:
      "Aron, 1996（感官预算概念）; Raymaker et al., Autism in Adulthood, 2020",
  },

  // ========== Social（社交能量）· ASD/ADHD 优先 ==========
  {
    id: "social_transition_preview",
    neuroTypes: ["asd", "adhd"],
    phases: ["stable", "accumulating"],
    name: { zh: "社交接班前预告", en: "Pre-Social Transition Preview" },
    category: "social",
    trigger: {
      description: { zh: "有即将到来的社交活动", en: "An upcoming social event" },
      type: "time",
    },
    action: {
      description: {
        zh: "社交活动前 30 分钟：查看议程/参与人、准备 2 个安全话题、设定离场时间和方式，降低不确定性",
        en: "30 minutes before the social event: review the agenda/attendees, prepare 2 safe topics, and set a departure time and method to reduce uncertainty",
      },
      duration_minutes: 10,
      timer: false,
    },
    why: { zh: "预告与过渡为 ASD 大脑提供结构化预期，降低切换成本和社交焦虑。", en: "Preview and transition provide structured expectations for the ASD brain, reducing switching cost and social anxiety." },
    evidence: "NAS, Transitions & predictability for autistic people, 2024; ASD transition support guidelines",
  },
  {
    id: "social_recovery_window",
    neuroTypes: ["asd", "adhd", "hsp"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "社交后恢复窗口", en: "Post-Social Recovery Window" },
    category: "social",
    trigger: {
      description: { zh: "社交电量 < 4 或社交活动结束后", en: "Social battery < 4 or after a social event ends" },
      type: "threshold",
    },
    action: {
      description: {
        zh: "社交结束后独处 20 分钟，低刺激环境（暗光、安静），不做任何社交互动，允许自我刺激或发呆",
        en: "After the social event, spend 20 minutes alone in a low-stimulus environment (dim light, quiet); no social interaction; stimming or zoning out is allowed",
      },
      duration_minutes: 20,
      timer: true,
    },
    why: { zh: "社交消耗后的恢复窗口让神经系统从高唤起回归基线，预防累积性社交耗竭。", en: "A recovery window after social drain lets the nervous system return from high arousal to baseline, preventing cumulative social burnout." },
    evidence:
      "Aron, 1996; Aron, The Highly Sensitive Person's Workbook, 1999（社交恢复）",
  },
];

// 按神经特质过滤模板（严格隔离 · ASD 只看 ASD 专属 · ADHD 只看 ADHD 专属）
// "other"返回全库作为通用池
// ADHD 子类型过滤：如果模板有 adhdSubtypes 限定，则只在用户子类型匹配时展示
export function getTemplatesByNeuroType(
  neuroType: NeuroType,
  adhdSubtype?: ADHDSubtype,
): ProtocolTemplate[] {
  if (neuroType === "other") return PROTOCOL_TEMPLATES;
  const otherPrimary: NeuroType | null =
    neuroType === "asd" ? "adhd" : neuroType === "adhd" ? "asd" : null;
  return PROTOCOL_TEMPLATES.filter((t) => {
    if (!t.neuroTypes.includes(neuroType)) return false;
    if (otherPrimary && t.neuroTypes.includes(otherPrimary)) return false;
    // ADHD 子类型过滤
    if (neuroType === "adhd" && t.adhdSubtypes && adhdSubtype) {
      if (adhdSubtype === "unknown") return true; // 不确定时展示全部
      if (!t.adhdSubtypes.includes(adhdSubtype)) return false;
    }
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
