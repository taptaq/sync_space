import type { LocalText, NeuroType, Phase, ADHDSubtype } from "@/types";

// 循证低成本疗法库（基于学术文献调研 · 非诊断 · 辅助自我调节）
// 来源标注于每条 therapy 的 evidence 字段
// 每条疗法关联适合的神经特质 + 推荐使用的阶段

export type TherapyCategory = "sensory" | "emotional" | "social" | "executive";

export interface Therapy {
  id: string;
  neuroTypes: NeuroType[]; // 适用的神经特质
  phases: Phase[]; // 推荐使用的阶段
  name: LocalText;
  category: TherapyCategory;
  duration_minutes: number;
  tools: LocalText[];
  steps: LocalText[];
  principle: LocalText;
  evidence: string;
  adhdSubtypes?: ADHDSubtype[]; // ADHD 子类型限定
}

// 分类标签
export const CATEGORY_LABELS: Record<TherapyCategory, { label: LocalText; icon: string }> = {
  sensory: { label: { zh: "感官调节", en: "Sensory regulation" }, icon: "🎧" },
  emotional: { label: { zh: "情绪调节", en: "Emotional regulation" }, icon: "🌊" },
  social: { label: { zh: "社交能量", en: "Social energy" }, icon: "🤝" },
  executive: { label: { zh: "执行功能", en: "Executive function" }, icon: "🎯" },
};

// 精选疗法库（每条含完整步骤+原理+文献 · 覆盖5阶段 · 初期聚焦ASD+ADHD）
// 设计原则：每条至少覆盖3个阶段，主流人群的全阶段均有覆盖
export const THERAPIES: Therapy[] = [
  // ========== ASD ==========
  {
    id: "asd_deep_pressure",
    neuroTypes: ["asd", "hsp"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "深压觉自我拥抱", en: "Deep Pressure Self-Hug" },
    category: "sensory",
    duration_minutes: 5,
    tools: [{ zh: "无需工具（可选加重毯或抱枕）", en: "No tools required (optional weighted blanket or cushion)" }],
    steps: [
      { zh: "找一个安静角落，双臂交叉环抱自己，一手搭对侧肩，另一手搭对侧上臂", en: "Find a quiet corner; cross your arms and hug yourself, one hand on the opposite shoulder, the other on the opposite upper arm" },
      { zh: "持续施加稳定、中等力度的挤压，模拟被拥抱的深压觉", en: "Apply steady, moderate pressure, simulating the deep pressure of being hugged" },
      { zh: "保持 30-60 秒，同时做 3-4 次缓慢深呼吸", en: "Hold for 30-60 seconds while taking 3-4 slow deep breaths" },
      { zh: "松开 10 秒后重复，共 3-5 轮", en: "Release for 10 seconds and repeat for 3-5 rounds" },
    ],
    principle: { zh: "深压觉刺激本体感受器，激活副交感神经，降低皮质醇，缓解感官过载。源于 Temple Grandin 的挤压机研究。", en: "Deep pressure stimulates proprioceptors, activates the parasympathetic nervous system, lowers cortisol, and relieves sensory overload. Originates from Temple Grandin's squeeze machine research." },
    evidence: "Edelson et al., J Autism Dev Disord, 1999; Sylvia et al., J Psychiatr Pract, 2014",
  },
  {
    id: "asd_54321_grounding",
    neuroTypes: ["asd", "adhd", "ptsd"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "5-4-3-2-1 感官接地法", en: "5-4-3-2-1 Sensory Grounding" },
    category: "sensory",
    duration_minutes: 5,
    tools: [{ zh: "无需任何工具", en: "No tools required" }],
    steps: [
      { zh: "停下动作，双脚平踩地面，感受脚底与地面的接触", en: "Stop moving; plant both feet flat on the ground and feel the contact between soles and floor" },
      { zh: "说出 5 个你能看到的东西", en: "Name 5 things you can see" },
      { zh: "说出 4 个你能触摸到的东西，并实际触摸", en: "Name 4 things you can touch, and actually touch them" },
      { zh: "说出 3 个你能听到的声音", en: "Name 3 sounds you can hear" },
      { zh: "说出 2 个你能闻到的气味", en: "Name 2 smells you can sense" },
      { zh: "说出 1 个你能尝到的味道，最后深呼吸确认身处当下", en: "Name 1 taste you can sense; finish with a deep breath to confirm you are in the present" },
    ],
    principle: { zh: "调动五种感官将注意力从内在焦虑转向外部环境，竞争性抑制杏仁核过度激活。", en: "Engaging the five senses shifts attention from internal anxiety to the external environment, competitively inhibiting amygdala hyperactivation." },
    evidence: "Fisher et al., Eur J Psychotraumatol, 2016; CBT/DBT 标准组件",
  },
  {
    id: "asd_box_breathing",
    neuroTypes: ["asd", "adhd", "ptsd"],
    phases: ["accumulating", "warning", "overload"],
    name: { zh: "箱式呼吸 4-4-4-4", en: "Box Breathing 4-4-4-4" },
    category: "emotional",
    duration_minutes: 5,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "坐直，双脚平踩地面，双手放于大腿", en: "Sit up straight; plant both feet flat on the ground and rest your hands on your thighs" },
      { zh: "缓缓吸气 4 秒，感受空气充满腹部", en: "Slowly inhale for 4 seconds, feeling the air fill your abdomen" },
      { zh: "屏住呼吸 4 秒，保持身体放松", en: "Hold your breath for 4 seconds, keeping your body relaxed" },
      { zh: "缓缓呼气 4 秒", en: "Slowly exhale for 4 seconds" },
      { zh: "再屏息 4 秒，完成一个周期", en: "Hold again for 4 seconds to complete one cycle" },
      { zh: "重复 8-10 个循环", en: "Repeat for 8-10 cycles" },
    ],
    principle: { zh: "等长呼吸节律平衡自主神经系统，降低交感唤醒并提升心率变异性。结构化节律本身对 ASD 有调节作用。", en: "Equal-length breathing balances the autonomic nervous system, lowers sympathetic arousal, and raises heart-rate variability. The structured rhythm itself is regulating for ASD." },
    evidence: "Nestor, J Clin Psychol, 2019; DBT 技能组件 (Linehan, 2014)",
  },
  {
    id: "asd_unmasking_break",
    neuroTypes: ["asd"],
    phases: ["accumulating", "warning", "recovery"],
    name: { zh: "伪装卸载微休息", en: "Unmasking Micro-Break" },
    category: "social",
    duration_minutes: 5,
    tools: [{ zh: "可独处的空间（洗手间、楼梯间、车内）", en: "A space where you can be alone (restroom, stairwell, car)" }],
    steps: [
      { zh: "在持续伪装的场合中，每隔 60-90 分钟主动安排 5 分钟微休息", en: "During sustained masking, proactively schedule a 5-minute micro-break every 60-90 minutes" },
      { zh: "离开当前场景，进入无人或低刺激空间", en: "Leave the current scene and enter an unoccupied or low-stimulus space" },
      { zh: "允许自己完全卸下伪装：无需眼神交流、表情控制", en: "Allow yourself to fully drop the mask: no eye contact, no expression management" },
      { zh: "可以做自我刺激行为：晃手、摇摆、按压指尖", en: "You may stim: hand-flapping, rocking, pressing fingertips" },
      { zh: "做 3 次不受控的深呼吸或叹气", en: "Take 3 uncontrolled deep breaths or sighs" },
      { zh: "内在确认：'我刚才的表现已经足够了，现在可以做自己'", en: "Internally affirm: \"What I just did was enough; I can be myself now.\"" },
    ],
    principle: { zh: "社交伪装是 ASD 倦怠的最强预测因子。定期卸载可降低累积成本，预防功能崩溃。", en: "Social masking is the strongest predictor of ASD burnout. Periodic unloading reduces cumulative cost and prevents functional collapse." },
    evidence: "Rebours et al., Autism, 2026; Cage & Troxell-Whitman, RASD, 2019",
  },
  {
    id: "asd_social_budget",
    neuroTypes: ["asd"],
    phases: ["stable", "accumulating"],
    name: { zh: "社交能量预算", en: "Social Energy Budget" },
    category: "social",
    duration_minutes: 10,
    tools: [{ zh: "手机备忘录或纸笔", en: "Phone notes or pen and paper" }],
    steps: [
      { zh: "早晨评估今日社交能量预算（1-10 分）", en: "In the morning, rate today's social energy budget (1-10)" },
      { zh: "标注已知社交消耗项：会议 -2、通话 -1、聚餐 -3", en: "List known social drains: meeting -2, call -1, dinner -3" },
      { zh: "计算剩余能量，若预算 < 消耗总和，削减非必要社交", en: "Calculate remaining energy; if the budget is less than total consumption, cut non-essential social activities" },
      { zh: "为高消耗活动预留前后各 15-30 分钟恢复缓冲", en: "Reserve a 15-30 minute recovery buffer before and after high-drain activities" },
      { zh: "设定硬规则：剩余能量 ≤ 2 时，有权拒绝新请求", en: "Set a hard rule: when remaining energy is ≤ 2, you have the right to decline new requests" },
    ],
    principle: { zh: "基于自闭症倦怠研究，结构化能量预算将隐性消耗显性化，预防慢性过载。", en: "Based on autistic burnout research; structured energy budgeting makes hidden drains visible and prevents chronic overload." },
    evidence: "Raymaker et al., Autism in Adulthood, 2020; Clarey et al., Autism, 2026",
  },
  {
    id: "asd_visual_anchor",
    neuroTypes: ["asd", "adhd"],
    phases: ["stable", "accumulating"],
    name: { zh: "视觉化日程锚点", en: "Visual Schedule Anchor" },
    category: "executive",
    duration_minutes: 10,
    tools: [{ zh: "手机日历或纸笔 + 彩色便利贴", en: "Phone calendar or pen and paper + colored sticky notes" }],
    steps: [
      { zh: "画时间轴，用 3 色标注：蓝=固定锚点，黄=核心任务（限 1-3 件），绿=弹性事项", en: "Draw a timeline and color-code with 3 colors: blue = fixed anchors, yellow = core tasks (limit 1-3), green = flexible items" },
      { zh: "每个任务块旁写 1 个具体'第一步动作'（如'打开文档'而非'写报告'）", en: "Next to each task block, write one concrete \"first-step action\" (e.g., \"open the document\" rather than \"write the report\")" },
      { zh: "任务间预留 15 分钟过渡缓冲", en: "Reserve a 15-minute transition buffer between tasks" },
      { zh: "最难任务安排在精力高峰时段", en: "Schedule the hardest task during your peak-energy window" },
      { zh: "每完成一项即划掉，视觉化完成感本身有奖励效应", en: "Cross off each item as completed; the visual sense of completion is itself rewarding" },
    ],
    principle: { zh: "视觉化日程将抽象时间外化为空间布局，减轻前额叶工作记忆负担。颜色编码利用 ASD 视觉加工优势。", en: "Visual schedules externalize abstract time into spatial layout, reducing prefrontal working-memory load. Color coding leverages ASD's visual processing strength." },
    evidence: "Sullivan et al., Am J Occup Ther, 2026; Kenworthy et al., Neuropsychol Rev, 2014",
  },

  // ========== ADHD ==========
  {
    id: "adhd_2min_rule",
    neuroTypes: ["adhd"],
    phases: ["accumulating", "warning", "overload"],
    name: { zh: "2 分钟启动法则", en: "2-Minute Start Rule" },
    category: "executive",
    duration_minutes: 5,
    tools: [{ zh: "手机计时器（可选）", en: "Phone timer (optional)" }],
    steps: [
      { zh: "选定拖延的任务，拆到极小（如'只写标题''只穿上鞋'）", en: "Pick a procrastinated task and break it down to a tiny step (e.g., \"just write the title,\" \"just put on shoes\")" },
      { zh: "告诉自己：'我只做 2 分钟，2 分钟到可以立刻停下'", en: "Tell yourself: \"I'll only do 2 minutes; when 2 minutes are up, I can stop immediately.\"" },
      { zh: "启动计时器 2 分钟", en: "Start a 2-minute timer" },
      { zh: "开始执行，允许自己做得糟糕", en: "Start executing; allow yourself to do it badly" },
      { zh: "2 分钟到后真实地允许停下；多数情况下动力惯性会让你继续", en: "When 2 minutes are up, genuinely allow yourself to stop; in most cases momentum will carry you forward" },
    ],
    principle: { zh: "ADHD 启动困难源于前额叶行为激活阈值过高。把承诺降到 2 分钟极大降低门槛，行为惯性自然延续。", en: "ADHD initiation difficulty stems from a high behavioral activation threshold in the prefrontal cortex. Lowering the commitment to 2 minutes drastically reduces the threshold; behavioral momentum naturally continues." },
    evidence: "Dimidjian et al., JAMA, 2006（行为激活 RCT）; Gollwitzer, Am Psychol, 1999",
  },
  {
    id: "adhd_dopamine_menu",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating", "recovery"],
    name: { zh: "多巴胺菜单", en: "Dopamine Menu" },
    category: "emotional",
    duration_minutes: 10,
    tools: [{ zh: "手机备忘录", en: "Phone notes" }],
    steps: [
      { zh: "状态好时列出低-中刺激的多巴胺补给清单，分三档", en: "When in good state, list low-to-medium-stimulus dopamine refills, divided into three tiers" },
      { zh: "低档（≤5 分钟）：喝水、看窗外、10 个深蹲、闻柑橘皮", en: "Low tier (≤5 min): drink water, look out the window, 10 squats, smell citrus peel" },
      { zh: "中档（5-15 分钟）：快走、听歌跟唱、整理桌面、给朋友发语音", en: "Mid tier (5-15 min): brisk walk, sing along to a song, tidy the desk, send a voice note to a friend" },
      { zh: "高档（15-20 分钟）：弹琴、做简餐、和宠物玩", en: "High tier (15-20 min): play an instrument, make a simple meal, play with a pet" },
      { zh: "把刷短视频、网购等高刺激但耗尽多巴胺的项目移出菜单", en: "Move high-stimulus but dopamine-depleting items (short videos, online shopping) off the menu" },
      { zh: "疲倦时从菜单选低-中档项目执行，而非打开社交 App", en: "When tired, pick a low- or mid-tier item from the menu rather than opening social apps" },
    ],
    principle: { zh: "ADHD 大脑基础多巴胺偏低，高刺激行为会引发受体下调与进一步耗竭。用中低强度可持续活动替代。", en: "The ADHD brain has low baseline dopamine; high-stimulus behaviors trigger receptor downregulation and further depletion. Replace them with sustainable low-to-medium-intensity activities." },
    evidence: "Lewinsohn, Behav Ther, 1974; Hallowell 临床推广",
  },
  {
    id: "adhd_body_double",
    neuroTypes: ["adhd", "asd"],
    phases: ["stable", "accumulating", "overload"],
    name: { zh: "身体加倍（Body Doubling）", en: "Body Doubling" },
    category: "social",
    duration_minutes: 15,
    tools: [{ zh: "朋友/同事，或线上平台（Focusmate、Flow Club）", en: "A friend/colleague, or an online platform (Focusmate, Flow Club)" }],
    steps: [
      { zh: "预约一位 body double 或登录 Focusmate 匹配", en: "Schedule a body double or log in to Focusmate to match" },
      { zh: "开始前各用 1 分钟说出今天要做什么", en: "Before starting, each take 1 minute to say what you'll work on today" },
      { zh: "静音麦克风，各自工作", en: "Mute the microphone and work separately" },
      { zh: "期间不交流，仅靠'有人在场也在专注'维持行动", en: "Do not communicate during; sustain action solely through \"someone is here and focusing too\"" },
      { zh: "结束时用 1 分钟互相汇报完成情况", en: "At the end, take 1 minute each to report what you completed" },
    ],
    principle: { zh: "基于社会促进效应（Zajonc 1965），他人在场提供外部监督与结构，弥补内在动机不足。", en: "Based on social facilitation (Zajonc, 1965); the presence of others provides external oversight and structure, compensating for insufficient intrinsic motivation." },
    evidence: "Zajonc, Science, 1965; CHADD/ADDitude 推荐",
  },
  {
    id: "adhd_short_aerobic",
    neuroTypes: ["adhd"],
    phases: ["accumulating", "warning", "recovery"],
    name: { zh: "10 分钟短时有氧", en: "10-Minute Short Aerobic" },
    category: "sensory",
    duration_minutes: 10,
    tools: [{ zh: "运动鞋（可选）或仅一双能走路的鞋", en: "Sports shoes (optional) or just a pair of walking shoes" }],
    steps: [
      { zh: "选择能提升心率的运动：快走、跳绳、原地高抬腿、爬楼梯", en: "Choose a heart-rate-raising exercise: brisk walking, jump rope, high knees in place, stair climbing" },
      { zh: "前 2 分钟慢速热身", en: "First 2 minutes: slow warm-up" },
      { zh: "中间 6 分钟保持中等强度（微喘但能说话）", en: "Middle 6 minutes: maintain moderate intensity (slightly breathless but able to speak)" },
      { zh: "最后 2 分钟减速放松", en: "Last 2 minutes: slow down and relax" },
      { zh: "结束后立即回到任务，利用运动后 30-90 分钟执行功能提升窗口期", en: "Return to the task immediately, leveraging the 30-90 minute post-exercise executive-function boost window" },
    ],
    principle: { zh: "急性有氧运动提升前额叶多巴胺和去甲肾上腺素，改善注意和抑制控制，是'非药物类兴奋剂'。", en: "Acute aerobic exercise raises prefrontal dopamine and norepinephrine, improving attention and inhibitory control; it is a \"non-pharmacological stimulant.\"" },
    evidence: "Chang et al., J Pediatrics, 2012; Cerrillo-Urbina et al., J Atten Disord, 2015",
  },
  {
    id: "adhd_pomodoro",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating"],
    name: { zh: "番茄工作法（5 分钟启动版）", en: "Pomodoro (5-Minute Start Edition)" },
    category: "executive",
    duration_minutes: 5,
    tools: [{ zh: "手机计时器", en: "Phone timer" }],
    steps: [
      { zh: "写下可在 15 分钟内推进的小任务", en: "Write down a small task that can be advanced in 15 minutes" },
      { zh: "设定 15 分钟工作 + 5 分钟休息（比标准 25+5 更适合 ADHD）", en: "Set 15 minutes work + 5 minutes rest (better suited for ADHD than the standard 25+5)" },
      { zh: "工作期间关闭通知，仅保留计时器", en: "During work, turn off notifications; keep only the timer" },
      { zh: "休息的 5 分钟必须离开位置：拉伸、看窗外、喝水", en: "The 5-minute rest must involve leaving the seat: stretch, look out the window, drink water" },
      { zh: "每完成 2 个周期安排 10-15 分钟较长休息", en: "After every 2 cycles, schedule a longer 10-15 minute rest" },
    ],
    principle: { zh: "外部时间框架替代 ADHD 缺陷的内在时间感知，降低启动焦虑；固定时长创造可预期终点。", en: "External time framing replaces ADHD's deficient internal time perception, lowering initiation anxiety; fixed durations create a predictable endpoint." },
    evidence: "Cirillo, 2018; Knouse et al., Cogn Behav Pract, 2017",
  },
  {
    id: "asd_stimming_reset",
    neuroTypes: ["asd"],
    phases: ["accumulating", "warning", "overload", "recovery"],
    name: { zh: "主动自我刺激重置", en: "Active Stimming Reset" },
    category: "sensory",
    duration_minutes: 5,
    tools: [{ zh: "无需工具（可选fidget玩具、压力球）", en: "No tools required (optional fidget toy, stress ball)" }],
    steps: [
      { zh: "当感到感官过载信号出现时，主动安排 5 分钟 stimming 时间", en: "When sensory overload signals appear, proactively schedule 5 minutes of stimming" },
      { zh: "选择适合当前环境的刺激方式：指尖按压、指尖搓揉、腿部轻晃、握拳松开", en: "Choose a stim suited to the environment: fingertip pressing, fingertip rubbing, gentle leg swinging, clenching and releasing fists" },
      { zh: "如果环境不允许，可使用隐蔽方式：脚趾在鞋内按压、舌头顶上颚", en: "If the environment doesn't allow it, use covert methods: press toes inside shoes, press tongue to the roof of the mouth" },
      { zh: "不加评判地允许自己重复动作，这是神经系统的自我调节而非失控", en: "Allow yourself to repeat the movement without judgment; this is the nervous system self-regulating, not losing control" },
      { zh: "结束后做两次缓慢深呼吸，感受身体信号是否下降", en: "Afterward, take two slow deep breaths and notice whether body signals have decreased" },
      { zh: "内在确认：'我刚刚在照顾自己，这很正常'", en: "Internally affirm: \"I was just taking care of myself; this is normal.\"" },
    ],
    principle: { zh: "Stimming 是 ASD 神经系统的天然自我调节机制。主动使用而非压抑，可在过载前降低累积负荷，预防功能性崩溃。", en: "Stimming is the ASD nervous system's natural self-regulation mechanism. Using it proactively rather than suppressing it can reduce cumulative load before overload and prevent functional collapse." },
    evidence: "Kapp et al., Autism, 2019; Charlton et al., Qual Health Res, 2021",
  },
  {
    id: "adhd_brain_dump",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating", "warning", "overload"],
    name: { zh: "大脑清空书写", en: "Brain Dump Writing" },
    category: "executive",
    duration_minutes: 10,
    tools: [{ zh: "纸笔或手机备忘录", en: "Pen and paper or phone notes" }],
    steps: [
      { zh: "感到脑中一团乱麻、无法集中时立即使用", en: "Use immediately when your mind feels tangled and you can't focus" },
      { zh: "设定 8 分钟，把所有脑中想法不加筛选地写下来", en: "Set 8 minutes and write down every thought in your head without filtering" },
      { zh: "每条只写关键词，一句话以内，不追求逻辑", en: "Write only keywords for each item, within one sentence; don't pursue logic" },
      { zh: "写完后圈出唯一一件'现在最重要'的事", en: "After finishing, circle the single \"most important right now\" item" },
      { zh: "把其余的放进'待办监狱'清单，允许自己暂时不想它们", en: "Put the rest into a \"to-do prison\" list and allow yourself to not think about them for now" },
      { zh: "只执行圈出的那一件，做 5 分钟就可以停", en: "Execute only the circled item; you can stop after 5 minutes" },
    ],
    principle: { zh: "ADHD 工作记忆有限，未外化的任务持续占用认知资源。外化清空释放工作记忆带宽，让前额叶从监控模式切换到执行模式。", en: "ADHD working memory is limited; un-externalized tasks continuously consume cognitive resources. Externalizing releases working-memory bandwidth, switching the prefrontal cortex from monitoring mode to execution mode." },
    evidence: "Safren et al., J Atten Disord, 2011; Meunier et al., J Atten Disord, 2022",
  },

  // ========== ADHD 子类型专属疗法 ==========
  // 注意力缺陷型 · 侧重注意力维持与工作记忆补偿
  {
    id: "adhd_inattentive_external_working_memory",
    neuroTypes: ["adhd"],
    adhdSubtypes: ["inattentive", "combined"],
    phases: ["stable", "accumulating"],
    name: { zh: "外部工作记忆系统", en: "External Working Memory System" },
    category: "executive",
    duration_minutes: 15,
    tools: [{ zh: "纸笔或数字笔记应用", en: "Paper or digital notes app" }],
    steps: [
      { zh: "选一个固定的位置（桌面或手机首屏）作为唯一外部记忆入口", en: "Choose one fixed location (desktop or phone home screen) as the single external memory entry point" },
      { zh: "每当有想法、任务、待办时立即记录，不依赖脑记", en: "Record immediately whenever a thought, task, or to-do arises; don't rely on memory" },
      { zh: "每天固定时间（如早上）回顾清单，标记今天最重要的 3 件", en: "Review the list at a fixed time daily (e.g., morning) and mark the top 3 for today" },
      { zh: "完成一件即划掉，允许其余暂时搁置", en: "Cross off each completion; allow the rest to wait" },
    ],
    principle: { zh: "注意力缺陷型的核心瓶颈是工作记忆容量。把记忆功能外包给外部系统，释放前额叶用于执行而非储存。", en: "Inattentive type's core bottleneck is working memory capacity. Outsourcing memory to an external system frees the prefrontal cortex for execution rather than storage." },
    evidence: "Brown, A New Understanding of ADHD, 2013; Safren et al., Cognitive-Behavioral Therapy for Adult ADHD, 2017",
  },
  // 多动冲动型 · 侧重冲动控制与能量调节
  {
    id: "adhd_hyperactive_impulse_training",
    neuroTypes: ["adhd"],
    adhdSubtypes: ["hyperactive", "combined"],
    phases: ["stable", "accumulating", "warning"],
    name: { zh: "冲动冲浪练习", en: "Urge Surfing Practice" },
    category: "emotional",
    duration_minutes: 5,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "当强烈冲动出现时（购物、说话、做决定），暂停行动", en: "When a strong urge arises (shopping, speaking, deciding), pause all action" },
      { zh: "闭上眼睛，把注意力放在身体上冲动感的那个位置", en: "Close your eyes and direct attention to where the urge feels in your body" },
      { zh: "想象这个冲动是一波海浪，你在浪上冲浪——感受它升起、达到顶峰、然后自然回落", en: "Imagine the urge as an ocean wave you're surfing—feel it rise, peak, then naturally subside" },
      { zh: "不推开它，也不跟随它行动，只是观察", en: "Don't push it away or act on it; just observe" },
      { zh: "通常 90 秒到 4 分钟后，冲动波会自然衰减", en: "Usually within 90 seconds to 4 minutes, the urge wave naturally fades" },
    ],
    principle: { zh: "多动冲动型的核心困难是抑制控制。冲动冲浪基于正念原则——不压抑也不行动，让冲动的生理波自然衰减。", en: "Hyperactive-impulsive type's core difficulty is inhibitory control. Urge surfing is based on mindfulness—neither suppressing nor acting, allowing the urge's physiological wave to naturally decay." },
    evidence: "Bowen & Marlatt, Mindfulness-Based Relapse Prevention, 2011; Zylowska et al., J Atten Disord, 2008（ADHD 正念干预）",
  },

  // ========== HSP ==========
  {
    id: "hsp_self_compassion",
    neuroTypes: ["hsp", "ptsd"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "自我关怀三步休息", en: "Self-Compassion Three-Step Break" },
    category: "emotional",
    duration_minutes: 5,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "将手轻放胸口或脸颊，感受手掌温度作为身体安抚锚点", en: "Place a hand lightly on your chest or cheek; feel the palm's warmth as a bodily soothing anchor" },
      { zh: "默念第一步——正念：'此刻我感到压力，这是一个痛苦的时刻'", en: "Silently say step one—Mindfulness: \"I am feeling stress right now; this is a difficult moment.\"" },
      { zh: "默念第二步——普遍人性：'痛苦是每个人都会经历的，我不是唯一这样感受的人'", en: "Silently say step two—Common Humanity: \"Suffering is part of everyone's life; I am not the only one who feels this way.\"" },
      { zh: "默念第三步——自我善意：'愿我对自己仁慈，愿我接纳此刻的自己'", en: "Silently say step three—Self-Kindness: \"May I be kind to myself; may I accept myself in this moment.\"" },
      { zh: "保持手部接触与缓慢呼吸，每句重复 2-3 遍", en: "Maintain hand contact and slow breathing; repeat each phrase 2-3 times" },
    ],
    principle: { zh: "自我关怀激活抚触安抚系统（催产素通路），替代自我批判内耗。对 HSP 特别有效，因其自我批判倾向常放大痛苦。", en: "Self-compassion activates the soothing/touch system (oxytocin pathway), replacing self-critical rumination. Particularly effective for HSP, whose self-critical tendencies often amplify suffering." },
    evidence: "Neff, Self Identity, 2003; Neff & Germer, J Clin Psychol, 2013",
  },
  {
    id: "hsp_boundary_script",
    neuroTypes: ["hsp"],
    phases: ["stable", "accumulating"],
    name: { zh: "边界可视化与表达", en: "Boundary Visualization and Expression" },
    category: "social",
    duration_minutes: 10,
    tools: [{ zh: "手机备忘录", en: "Phone notes" }],
    steps: [
      { zh: "写下近期让你感到被侵入的 3 个情境，区分'可让步区'与'不可让步区'", en: "Write down 3 recent situations where you felt intruded upon; distinguish \"negotiable zone\" from \"non-negotiable zone\"" },
      { zh: "对每个边界用清晰陈述句写出，如'我需要每周三晚 8 点后不回复工作消息'", en: "Write each boundary as a clear declarative sentence, e.g., \"I need to not reply to work messages after 8 PM on Wednesdays.\"" },
      { zh: "用 DEAR MAN 结构预演：描述事实→表达感受→提出请求→说明对方获益", en: "Rehearse with the DEAR MAN structure: Describe facts → Express feelings → Assert request → Name the benefit to the other" },
      { zh: "练习以'我需要'而非'你应该'开头的句式", en: "Practice sentences starting with \"I need\" rather than \"you should\"" },
      { zh: "记录预演后的身体感受", en: "Record your bodily sensations after the rehearsal" },
    ],
    principle: { zh: "HSP 高共情倾向常过度让步导致耗竭。结构化表达减少模糊沟通的情绪消耗。", en: "HSP's high empathy often leads to over-accommodation and burnout. Structured expression reduces the emotional cost of ambiguous communication." },
    evidence: "Linehan, DBT Skills Manual, 2014; Aron & Aron, J Pers Soc Psychol, 1997",
  },
  {
    id: "hsp_expressive_writing",
    neuroTypes: ["hsp"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "表达性书写排空", en: "Expressive Writing Release" },
    category: "emotional",
    duration_minutes: 15,
    tools: [
      { zh: "纸笔或手机备忘录", en: "Pen and paper or phone notes" },
      { zh: "计时器", en: "Timer" },
    ],
    steps: [
      { zh: "设定 15 分钟，选择一个情绪过载事件", en: "Set 15 minutes and choose an emotionally overloaded event" },
      { zh: "连续书写不停顿，不修改语法，把所有情绪、身体感受、联想全部倒出", en: "Write continuously without pausing; don't edit grammar; pour out all emotions, bodily sensations, and associations" },
      { zh: "卡住就重复写'我不知道写什么'直到下一句出现", en: "If stuck, repeatedly write \"I don't know what to write\" until the next sentence appears" },
      { zh: "时间到后深呼吸三次，重读一遍", en: "When time is up, take three deep breaths and reread once" },
      { zh: "末尾写'这些情绪经过我，但不属于我'，然后撕掉或删除，象征性排空", en: "End by writing \"These emotions pass through me but are not me,\" then tear up or delete it as a symbolic release" },
    ],
    principle: { zh: "表达性书写将情绪外化为语言，降低杏仁核激活。对 HSP 而言，提供'区分自我与他人情绪'的认知边界。", en: "Expressive writing externalizes emotions into language, lowering amygdala activation. For HSP, it provides the cognitive boundary of \"distinguishing my emotions from others'.\"" },
    evidence: "Pennebaker & Beall, J Abnorm Psychol, 1986; Frattaroli, Psychol Bull, 2006",
  },
  {
    id: "hsp_sensory_diet",
    neuroTypes: ["hsp", "asd"],
    phases: ["stable", "accumulating"],
    name: { zh: "感觉饮食自评", en: "Sensory Diet Self-Assessment" },
    category: "sensory",
    duration_minutes: 15,
    tools: [
      { zh: "手机备忘录", en: "Phone notes" },
      { zh: "计时器", en: "Timer" },
    ],
    steps: [
      { zh: "画 24 小时感觉输入表，分视觉/听觉/触觉/嗅觉/前庭觉/本体觉六列", en: "Draw a 24-hour sensory input table with six columns: visual/auditory/tactile/olfactory/vestibular/proprioceptive" },
      { zh: "标注今日每时段每种感觉的刺激强度（1-5 分），标出超过 4 分的过载点", en: "Mark today's stimulus intensity for each sense in each time slot (1-5); flag overload points above 4" },
      { zh: "针对每个过载点写一个'降刺激'替代方案：降噪耳机、遮光帘、眼罩", en: "For each overload point, write a \"stimulus-reduction\" alternative: noise-canceling headphones, blackout curtains, eye mask" },
      { zh: "标注低于 2 分的'饥渴点'，写一个温和刺激补充：闻精油、温热杯、摇椅", en: "Mark \"craving points\" below 2 and write a gentle stimulus supplement: essential oils, a warm cup, a rocking chair" },
      { zh: "设定手机在最常过载的时段提醒执行 5 分钟降刺激动作", en: "Set phone reminders during your most frequently overloaded time slots to do 5 minutes of stimulus-reduction action" },
    ],
    principle: { zh: "HSP 的感觉加工敏感性使神经系统阈值更低、累积更快。感觉饮食通过个体化输入规划维持最佳唤起区间。", en: "HSP's sensory processing sensitivity makes the nervous system's threshold lower and accumulation faster. A sensory diet maintains the optimal arousal zone through individualized input planning." },
    evidence: "Aron & Aron, 1997; Wilbarger & Wilbarger, 1991",
  },
  {
    id: "hsp_pmr_short",
    neuroTypes: ["hsp", "asd", "adhd"],
    phases: ["warning", "overload", "recovery"],
    name: { zh: "渐进式肌肉放松短版", en: "Short Progressive Muscle Relaxation" },
    category: "sensory",
    duration_minutes: 12,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "找安静处坐或躺，闭眼，做三次深呼吸", en: "Find a quiet place to sit or lie down, close your eyes, and take three deep breaths" },
      { zh: "双手握拳 5 秒→松开 10 秒", en: "Clench both fists for 5s → release for 10s" },
      { zh: "耸肩靠近耳朵 5 秒→放下 10 秒", en: "Shrug shoulders toward ears for 5s → drop for 10s" },
      { zh: "紧闭眼皱鼻 5 秒→放松 10 秒", en: "Squeeze eyes shut and wrinkle nose for 5s → release for 10s" },
      { zh: "深吸气绷紧胸腹 5 秒→呼气放松 10 秒", en: "Inhale deeply and tense chest and abdomen for 5s → exhale and release for 10s" },
      { zh: "脚尖上翘绷紧小腿 5 秒→放松 10 秒", en: "Flex toes upward and tense calves for 5s → release for 10s" },
      { zh: "全身扫描，对仍紧张部位再做一次，缓慢睁眼", en: "Scan the whole body; repeat for any still-tense area; slowly open your eyes" },
    ],
    principle: { zh: "通过先紧张再释放，让身体重新学会区分紧张与松弛，降低交感神经基础唤起，重建松弛参照点。", en: "By tensing first then releasing, the body relearns to distinguish tension from relaxation, lowering baseline sympathetic arousal and re-establishing a relaxation reference point." },
    evidence: "Jacobson, 1938; Bernstein et al., APA, 2000",
  },

  // ========== PTSD ==========
  {
    id: "ptsd_butterfly_hug",
    neuroTypes: ["ptsd"],
    phases: ["warning", "overload"],
    name: { zh: "蝴蝶拥抱", en: "Butterfly Hug" },
    category: "sensory",
    duration_minutes: 5,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "双臂交叉于胸前，右手放左肩上方、左手放右肩上方", en: "Cross your arms over your chest; place your right hand above your left shoulder and your left hand above your right shoulder" },
      { zh: "想象胸前有一只蝴蝶，双手像翅膀", en: "Imagine a butterfly on your chest; your hands are its wings" },
      { zh: "缓慢交替轻拍：左手拍一下→右手拍一下，节奏约每秒 1 拍", en: "Slowly alternate taps: left hand taps once → right hand taps once; rhythm about 1 tap per second" },
      { zh: "边拍边深呼吸，注意力放在双手拍打的身体感觉与胸口起伏上", en: "Tap and breathe deeply; focus on the bodily sensation of the tapping and the rise and fall of your chest" },
      { zh: "可同时默念：'我此刻是安全的，过去已经过去'", en: "You may silently repeat: \"I am safe right now; the past is past.\"" },
      { zh: "持续 2-4 分钟，结束后做三次深呼吸", en: "Continue for 2-4 minutes; finish with three deep breaths" },
    ],
    principle: { zh: "源自 EMDR 疗法，左右交替触觉刺激产生双侧刺激，促进大脑两半球信息整合，降低杏仁核激活。自我拥抱同时释放催产素。", en: "Originating from EMDR therapy, alternating left-right tactile stimulation produces bilateral stimulation, promoting interhemispheric integration and lowering amygdala activation. Self-hugging also releases oxytocin." },
    evidence: "Shapiro, EMDR Therapy, 2018; Jarero et al., J EMDR Pract Res, 2013",
  },
  {
    id: "ptsd_safe_place",
    neuroTypes: ["ptsd", "hsp"],
    phases: ["stable", "accumulating", "recovery"],
    name: { zh: "安全地带可视化", en: "Safe Place Visualization" },
    category: "emotional",
    duration_minutes: 10,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "闭眼，做三次深呼吸", en: "Close your eyes and take three deep breaths" },
      { zh: "想象一个让你完全安全、平静的地方：海边、童年房间、森林小屋", en: "Imagine a place where you feel completely safe and calm: the seaside, a childhood room, a forest cabin" },
      { zh: "详细构建五种感官细节：看到什么颜色、听到什么声音、闻到什么气味、皮肤感到什么温度", en: "Build detailed five-sense imagery: colors you see, sounds you hear, smells you sense, temperature on your skin" },
      { zh: "给自己设定一个安全词或手势（如拇指与食指相捏），与安全感受配对", en: "Set a safe word or gesture (e.g., pinch thumb and index finger together) and pair it with the feeling of safety" },
      { zh: "在场景中停留 3-5 分钟", en: "Stay in the scene for 3-5 minutes" },
      { zh: "返回现实前做手势并默念安全词，把安全感'带出来'", en: "Before returning to reality, make the gesture and silently say the safe word to \"bring out\" the sense of safety" },
    ],
    principle: { zh: "EMDR 标准准备技术，在记忆中建立强烈的安全-放松回路，成为创伤记忆激活时的情绪避难所。配对手势通过条件反射快速唤起安全感。", en: "A standard EMDR preparation technique; builds a strong safety-relaxation circuit in memory to serve as an emotional refuge when traumatic memories are activated. The paired gesture quickly evokes safety through conditioned reflex." },
    evidence: "Shapiro, 2018; Leeds, Resources in EMDR, 2009",
  },
  {
    id: "ptsd_orienting",
    neuroTypes: ["ptsd"],
    phases: ["warning", "overload"],
    name: { zh: "定向与环境确认", en: "Orienting and Environment Confirmation" },
    category: "sensory",
    duration_minutes: 5,
    tools: [{ zh: "无需工具", en: "No tools required" }],
    steps: [
      { zh: "停下动作，坐稳，双脚着地，缓慢环顾整个房间", en: "Stop moving; sit steady with feet on the floor; slowly look around the entire room" },
      { zh: "让头和眼睛一起转动，逐一看房间四个角落，速度要慢", en: "Turn your head and eyes together; look at each of the four corners of the room, slowly" },
      { zh: "每看到一处，默念'这里没有危险'或'我现在在____'", en: "As you look at each spot, silently say \"There is no danger here\" or \"I am now in ____.\"" },
      { zh: "找到房间里的出口（门、窗），确认它们的位置", en: "Locate the room's exits (door, windows); confirm their positions" },
      { zh: "看一遍能让你感到安全的物品（家人照片、熟悉摆设）", en: "Look once at items that make you feel safe (family photos, familiar decorations)" },
      { zh: "把目光落在一个舒适物体上，深呼吸三次", en: "Rest your gaze on a comfortable object and take three deep breaths" },
    ],
    principle: { zh: "基于多迷走神经理论，PTSD 常处于冻结或过度警觉状态。主动定向行为激活腹侧迷走通路，发送'环境已评估、无威胁'信号。", en: "Based on polyvagal theory; PTSD often involves freeze or hyperarousal states. Active orienting activates the ventral vagal pathway, signaling \"environment assessed; no threat.\"" },
    evidence: "Porges, The Polyvagal Theory, 2011; Dana, 2018",
  },
  {
    id: "ptsd_flashback_card",
    neuroTypes: ["ptsd"],
    phases: ["overload"],
    name: { zh: "闪回应对卡", en: "Flashback Coping Card" },
    category: "sensory",
    duration_minutes: 5,
    tools: [
      { zh: "预制卡片或手机壁纸", en: "Pre-made card or phone wallpaper" },
      { zh: "强感官物品（薄荷糖、风油精）", en: "Strong-sensory items (mint, essential oil)" },
    ],
    steps: [
      { zh: "提前制作卡片：'这是闪回，是记忆，不是现在。今天是____年，我在____'", en: "Pre-make the card: \"This is a flashback; it is a memory, not now. Today is ____, and I am in ____.\"" },
      { zh: "察觉闪回开始时立即拿出卡片阅读这句话", en: "When you notice a flashback starting, take out the card immediately and read the sentence" },
      { zh: "大声或默读三遍，同时用脚用力踩地，感受地面支撑", en: "Read aloud or silently three times; press your foot firmly into the floor and feel the ground's support" },
      { zh: "用强感官刺激拉回：含薄荷糖感受凉意，或闻风油精", en: "Use strong sensory stimulation to pull back: suck a mint and feel the coolness, or smell essential oil" },
      { zh: "环顾四周，说出三个当前物品的名称", en: "Look around and name three current objects" },
      { zh: "缓慢吸气 4 秒、呼气 6 秒，重复 5 次", en: "Slowly inhale for 4s, exhale for 6s; repeat 5 times" },
    ],
    principle: { zh: "闪回是创伤记忆以感觉碎片侵入当下。应对卡提供认知重评脚本，强感官刺激打断记忆回放，三通道同步把大脑拉回现在。", en: "Flashbacks are traumatic memories intruding into the present as sensory fragments. The coping card provides a cognitive reappraisal script; strong sensory stimulation interrupts memory playback; three channels synced pull the brain back to now." },
    evidence: "Najavits, Seeking Safety, 2002; Ehlers & Clark, Behav Res Ther, 2000",
  },
  {
    id: "ptsd_cold_water",
    neuroTypes: ["ptsd", "asd", "adhd"],
    phases: ["overload"],
    name: { zh: "TIPP 冷水降速", en: "TIPP Cold Water Slow-Down" },
    category: "sensory",
    duration_minutes: 5,
    tools: [
      { zh: "冷水（10-15℃）", en: "Cold water (10-15°C)" },
      { zh: "盆或毛巾", en: "Basin or towel" },
    ],
    steps: [
      { zh: "情绪极度过载、恐慌时立即使用", en: "Use immediately during extreme emotional overload or panic" },
      { zh: "屏住呼吸，将面部（尤其眼睛上方与双颊）浸入或泼冷水 15-30 秒", en: "Hold your breath and immerse or splash cold water on your face (especially above the eyes and on both cheeks) for 15-30 seconds" },
      { zh: "或用冰袋/冷湿毛巾敷于双眼与双颊 60 秒", en: "Or apply an ice pack/cold damp towel over both eyes and cheeks for 60 seconds" },
      { zh: "保持屏息状态，结束后正常呼吸", en: "Maintain breath-holding; resume normal breathing afterward" },
      { zh: "等待 30-60 秒，感受心率明显减慢", en: "Wait 30-60 seconds and feel your heart rate slow noticeably" },
      { zh: "配合 3 次缓慢深呼吸", en: "Combine with 3 slow deep breaths" },
      { zh: "注意：心脏病患者、孕妇慎用", en: "Caution: those with heart disease or who are pregnant should use with care" },
    ],
    principle: { zh: "面部接触冷水触发哺乳动物潜水反射，通过三叉神经-迷走神经通路使心率在 15-30 秒内下降 10-25%，快速打断情绪风暴。", en: "Cold water on the face triggers the mammalian diving reflex; via the trigeminal-vagal pathway, heart rate drops 10-25% within 15-30 seconds, rapidly interrupting an emotional storm." },
    evidence: "Linehan, DBT Manual, 2014; Hurwitz et al., Psychophysiology, 1993",
  },
  {
    id: "ptsd_activation",
    neuroTypes: ["ptsd"],
    phases: ["recovery"],
    name: { zh: "低唤起激活", en: "Low-Arousal Activation" },
    category: "sensory",
    duration_minutes: 10,
    tools: [
      { zh: "无需工具", en: "No tools required" },
      { zh: "可选快节奏音乐", en: "Optional upbeat music" },
    ],
    steps: [
      { zh: "评估唤起度，若处于麻木、解离、低能量状态（<4 分）则执行", en: "Assess arousal; if you are numb, dissociated, or low-energy (<4), execute this" },
      { zh: "站立，用力跺脚 10 次，每次感受震动", en: "Stand and stomp your feet forcefully 10 times; feel the vibration each time" },
      { zh: "双手用力摩擦双臂与双颊，直到皮肤发热", en: "Rub your arms and cheeks firmly with both hands until the skin warms" },
      { zh: "做 20 秒原地高抬腿或开合跳", en: "Do 20 seconds of high knees or jumping jacks in place" },
      { zh: "用冷水洗手或泼脸（温和版）", en: "Wash your hands with cold water or splash your face (gentle version)" },
      { zh: "闻刺激性气味（薄荷、柑橘、咖啡豆）10 秒", en: "Smell a stimulating scent (mint, citrus, coffee beans) for 10 seconds" },
      { zh: "播放 120bpm 以上音乐，跟着节奏小幅摆动 1 分钟", en: "Play music above 120bpm and move slightly to the rhythm for 1 minute" },
    ],
    principle: { zh: "PTSD 低唤起对应背侧迷走冻结状态。通过强力本体觉、前庭觉、嗅觉与听觉刺激激活交感神经，拉回功能运作的中间唤起区。", en: "PTSD low arousal corresponds to the dorsal vagal freeze state. Strong proprioceptive, vestibular, olfactory, and auditory stimulation activates the sympathetic nervous system, pulling back to the functional middle arousal zone." },
    evidence: "Porges, 2011; van der Kolk, The Body Keeps the Score, 2014",
  },
];

// 按神经特质过滤（严格隔离 · ASD 只看 ASD 专属 · ADHD 只看 ADHD 专属）
// "other"返回全库作为通用池 · 确保不确定用户也有参考
// ADHD 子类型过滤：如果有 adhdSubtypes 限定，则只在用户子类型匹配时展示
export function getTherapiesByNeuroType(
  neuroType: NeuroType,
  adhdSubtype?: ADHDSubtype,
): Therapy[] {
  if (neuroType === "other") return THERAPIES;
  const otherPrimary: NeuroType | null =
    neuroType === "asd" ? "adhd" : neuroType === "adhd" ? "asd" : null;
  return THERAPIES.filter((t) => {
    if (!t.neuroTypes.includes(neuroType)) return false;
    // 排除同时标记了另一种主要特质的共享条目 · 实现严格隔离
    if (otherPrimary && t.neuroTypes.includes(otherPrimary)) return false;
    // ADHD 子类型过滤
    if (neuroType === "adhd" && t.adhdSubtypes && adhdSubtype) {
      if (adhdSubtype === "unknown") return true; // 不确定时展示全部
      if (!t.adhdSubtypes.includes(adhdSubtype)) return false;
    }
    return true;
  });
}

// 按阶段优先级排序（当前阶段匹配的优先）
export function sortTherapiesByPhase(
  therapies: Therapy[],
  currentPhase: Phase,
): Therapy[] {
  return [...therapies].sort((a, b) => {
    const aMatch = a.phases.includes(currentPhase) ? 0 : 1;
    const bMatch = b.phases.includes(currentPhase) ? 0 : 1;
    return aMatch - bMatch;
  });
}
