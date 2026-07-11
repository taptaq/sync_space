import type { NeuroType, Phase } from "@/types";

// 循证低成本疗法库（基于学术文献调研 · 非诊断 · 辅助自我调节）
// 来源标注于每条 therapy 的 evidence 字段
// 每条疗法关联适合的神经特质 + 推荐使用的阶段

export type TherapyCategory = "sensory" | "emotional" | "social" | "executive";

export interface Therapy {
  id: string;
  neuroTypes: NeuroType[]; // 适用的神经特质
  phases: Phase[]; // 推荐使用的阶段
  name: string;
  category: TherapyCategory;
  duration_minutes: number;
  tools: string[];
  steps: string[];
  principle: string;
  evidence: string;
}

// 分类标签
export const CATEGORY_LABELS: Record<TherapyCategory, { label: string; icon: string }> = {
  sensory: { label: "感官调节", icon: "🎧" },
  emotional: { label: "情绪调节", icon: "🌊" },
  social: { label: "社交能量", icon: "🤝" },
  executive: { label: "执行功能", icon: "🎯" },
};

// 精选疗法库（每个特质 5-6 条 · 覆盖不同阶段和类别）
export const THERAPIES: Therapy[] = [
  // ========== ASD ==========
  {
    id: "asd_deep_pressure",
    neuroTypes: ["asd", "hsp"],
    phases: ["warning", "overload"],
    name: "深压觉自我拥抱",
    category: "sensory",
    duration_minutes: 5,
    tools: ["无需工具（可选加重毯或抱枕）"],
    steps: [
      "找一个安静角落，双臂交叉环抱自己，一手搭对侧肩，另一手搭对侧上臂",
      "持续施加稳定、中等力度的挤压，模拟被拥抱的深压觉",
      "保持 30-60 秒，同时做 3-4 次缓慢深呼吸",
      "松开 10 秒后重复，共 3-5 轮",
    ],
    principle: "深压觉刺激本体感受器，激活副交感神经，降低皮质醇，缓解感官过载。源于 Temple Grandin 的挤压机研究。",
    evidence: "Edelson et al., J Autism Dev Disord, 1999; Sylvia et al., J Psychiatr Pract, 2014",
  },
  {
    id: "asd_54321_grounding",
    neuroTypes: ["asd", "adhd", "ptsd"],
    phases: ["warning", "overload"],
    name: "5-4-3-2-1 感官接地法",
    category: "sensory",
    duration_minutes: 5,
    tools: ["无需任何工具"],
    steps: [
      "停下动作，双脚平踩地面，感受脚底与地面的接触",
      "说出 5 个你能看到的东西",
      "说出 4 个你能触摸到的东西，并实际触摸",
      "说出 3 个你能听到的声音",
      "说出 2 个你能闻到的气味",
      "说出 1 个你能尝到的味道，最后深呼吸确认身处当下",
    ],
    principle: "调动五种感官将注意力从内在焦虑转向外部环境，竞争性抑制杏仁核过度激活。",
    evidence: "Fisher et al., Eur J Psychotraumatol, 2016; CBT/DBT 标准组件",
  },
  {
    id: "asd_box_breathing",
    neuroTypes: ["asd", "adhd", "ptsd"],
    phases: ["accumulating", "warning", "overload"],
    name: "箱式呼吸 4-4-4-4",
    category: "emotional",
    duration_minutes: 5,
    tools: ["无需工具"],
    steps: [
      "坐直，双脚平踩地面，双手放于大腿",
      "缓缓吸气 4 秒，感受空气充满腹部",
      "屏住呼吸 4 秒，保持身体放松",
      "缓缓呼气 4 秒",
      "再屏息 4 秒，完成一个周期",
      "重复 8-10 个循环",
    ],
    principle: "等长呼吸节律平衡自主神经系统，降低交感唤醒并提升心率变异性。结构化节律本身对 ASD 有调节作用。",
    evidence: "Nestor, J Clin Psychol, 2019; DBT 技能组件 (Linehan, 2014)",
  },
  {
    id: "asd_unmasking_break",
    neuroTypes: ["asd"],
    phases: ["accumulating", "warning"],
    name: "伪装卸载微休息",
    category: "social",
    duration_minutes: 5,
    tools: ["可独处的空间（洗手间、楼梯间、车内）"],
    steps: [
      "在持续伪装的场合中，每隔 60-90 分钟主动安排 5 分钟微休息",
      "离开当前场景，进入无人或低刺激空间",
      "允许自己完全卸下伪装：无需眼神交流、表情控制",
      "可以做自我刺激行为：晃手、摇摆、按压指尖",
      "做 3 次不受控的深呼吸或叹气",
      "内在确认：'我刚才的表现已经足够了，现在可以做自己'",
    ],
    principle: "社交伪装是 ASD 倦怠的最强预测因子。定期卸载可降低累积成本，预防功能崩溃。",
    evidence: "Rebours et al., Autism, 2026; Cage & Troxell-Whitman, RASD, 2019",
  },
  {
    id: "asd_social_budget",
    neuroTypes: ["asd"],
    phases: ["stable", "accumulating"],
    name: "社交能量预算",
    category: "social",
    duration_minutes: 10,
    tools: ["手机备忘录或纸笔"],
    steps: [
      "早晨评估今日社交能量预算（1-10 分）",
      "标注已知社交消耗项：会议 -2、通话 -1、聚餐 -3",
      "计算剩余能量，若预算 < 消耗总和，削减非必要社交",
      "为高消耗活动预留前后各 15-30 分钟恢复缓冲",
      "设定硬规则：剩余能量 ≤ 2 时，有权拒绝新请求",
    ],
    principle: "基于自闭症倦怠研究，结构化能量预算将隐性消耗显性化，预防慢性过载。",
    evidence: "Raymaker et al., Autism in Adulthood, 2020; Clarey et al., Autism, 2026",
  },
  {
    id: "asd_visual_anchor",
    neuroTypes: ["asd", "adhd"],
    phases: ["stable", "accumulating"],
    name: "视觉化日程锚点",
    category: "executive",
    duration_minutes: 10,
    tools: ["手机日历或纸笔 + 彩色便利贴"],
    steps: [
      "画时间轴，用 3 色标注：蓝=固定锚点，黄=核心任务（限 1-3 件），绿=弹性事项",
      "每个任务块旁写 1 个具体'第一步动作'（如'打开文档'而非'写报告'）",
      "任务间预留 15 分钟过渡缓冲",
      "最难任务安排在精力高峰时段",
      "每完成一项即划掉，视觉化完成感本身有奖励效应",
    ],
    principle: "视觉化日程将抽象时间外化为空间布局，减轻前额叶工作记忆负担。颜色编码利用 ASD 视觉加工优势。",
    evidence: "Sullivan et al., Am J Occup Ther, 2026; Kenworthy et al., Neuropsychol Rev, 2014",
  },

  // ========== ADHD ==========
  {
    id: "adhd_2min_rule",
    neuroTypes: ["adhd"],
    phases: ["accumulating", "warning"],
    name: "2 分钟启动法则",
    category: "executive",
    duration_minutes: 5,
    tools: ["手机计时器（可选）"],
    steps: [
      "选定拖延的任务，拆到极小（如'只写标题''只穿上鞋'）",
      "告诉自己：'我只做 2 分钟，2 分钟到可以立刻停下'",
      "启动计时器 2 分钟",
      "开始执行，允许自己做得糟糕",
      "2 分钟到后真实地允许停下；多数情况下动力惯性会让你继续",
    ],
    principle: "ADHD 启动困难源于前额叶行为激活阈值过高。把承诺降到 2 分钟极大降低门槛，行为惯性自然延续。",
    evidence: "Dimidjian et al., JAMA, 2006（行为激活 RCT）; Gollwitzer, Am Psychol, 1999",
  },
  {
    id: "adhd_dopamine_menu",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating", "recovery"],
    name: "多巴胺菜单",
    category: "emotional",
    duration_minutes: 10,
    tools: ["手机备忘录"],
    steps: [
      "状态好时列出低-中刺激的多巴胺补给清单，分三档",
      "低档（≤5 分钟）：喝水、看窗外、10 个深蹲、闻柑橘皮",
      "中档（5-15 分钟）：快走、听歌跟唱、整理桌面、给朋友发语音",
      "高档（15-20 分钟）：弹琴、做简餐、和宠物玩",
      "把刷短视频、网购等高刺激但耗尽多巴胺的项目移出菜单",
      "疲倦时从菜单选低-中档项目执行，而非打开社交 App",
    ],
    principle: "ADHD 大脑基础多巴胺偏低，高刺激行为会引发受体下调与进一步耗竭。用中低强度可持续活动替代。",
    evidence: "Lewinsohn, Behav Ther, 1974; Hallowell 临床推广",
  },
  {
    id: "adhd_body_double",
    neuroTypes: ["adhd", "asd"],
    phases: ["stable", "accumulating"],
    name: "身体加倍（Body Doubling）",
    category: "social",
    duration_minutes: 15,
    tools: ["朋友/同事，或线上平台（Focusmate、Flow Club）"],
    steps: [
      "预约一位 body double 或登录 Focusmate 匹配",
      "开始前各用 1 分钟说出今天要做什么",
      "静音麦克风，各自工作",
      "期间不交流，仅靠'有人在场也在专注'维持行动",
      "结束时用 1 分钟互相汇报完成情况",
    ],
    principle: "基于社会促进效应（Zajonc 1965），他人在场提供外部监督与结构，弥补内在动机不足。",
    evidence: "Zajonc, Science, 1965; CHADD/ADDitude 推荐",
  },
  {
    id: "adhd_short_aerobic",
    neuroTypes: ["adhd"],
    phases: ["accumulating", "warning", "recovery"],
    name: "10 分钟短时有氧",
    category: "sensory",
    duration_minutes: 10,
    tools: ["运动鞋（可选）或仅一双能走路的鞋"],
    steps: [
      "选择能提升心率的运动：快走、跳绳、原地高抬腿、爬楼梯",
      "前 2 分钟慢速热身",
      "中间 6 分钟保持中等强度（微喘但能说话）",
      "最后 2 分钟减速放松",
      "结束后立即回到任务，利用运动后 30-90 分钟执行功能提升窗口期",
    ],
    principle: "急性有氧运动提升前额叶多巴胺和去甲肾上腺素，改善注意和抑制控制，是'非药物类兴奋剂'。",
    evidence: "Chang et al., J Pediatrics, 2012; Cerrillo-Urbina et al., J Atten Disord, 2015",
  },
  {
    id: "adhd_pomodoro",
    neuroTypes: ["adhd"],
    phases: ["stable", "accumulating"],
    name: "番茄工作法（5 分钟启动版）",
    category: "executive",
    duration_minutes: 5,
    tools: ["手机计时器"],
    steps: [
      "写下可在 15 分钟内推进的小任务",
      "设定 15 分钟工作 + 5 分钟休息（比标准 25+5 更适合 ADHD）",
      "工作期间关闭通知，仅保留计时器",
      "休息的 5 分钟必须离开位置：拉伸、看窗外、喝水",
      "每完成 2 个周期安排 10-15 分钟较长休息",
    ],
    principle: "外部时间框架替代 ADHD 缺陷的内在时间感知，降低启动焦虑；固定时长创造可预期终点。",
    evidence: "Cirillo, 2018; Knouse et al., Cogn Behav Pract, 2017",
  },

  // ========== HSP ==========
  {
    id: "hsp_self_compassion",
    neuroTypes: ["hsp", "ptsd"],
    phases: ["warning", "overload", "recovery"],
    name: "自我关怀三步休息",
    category: "emotional",
    duration_minutes: 5,
    tools: ["无需工具"],
    steps: [
      "将手轻放胸口或脸颊，感受手掌温度作为身体安抚锚点",
      "默念第一步——正念：'此刻我感到压力，这是一个痛苦的时刻'",
      "默念第二步——普遍人性：'痛苦是每个人都会经历的，我不是唯一这样感受的人'",
      "默念第三步——自我善意：'愿我对自己仁慈，愿我接纳此刻的自己'",
      "保持手部接触与缓慢呼吸，每句重复 2-3 遍",
    ],
    principle: "自我关怀激活抚触安抚系统（催产素通路），替代自我批判内耗。对 HSP 特别有效，因其自我批判倾向常放大痛苦。",
    evidence: "Neff, Self Identity, 2003; Neff & Germer, J Clin Psychol, 2013",
  },
  {
    id: "hsp_boundary_script",
    neuroTypes: ["hsp"],
    phases: ["stable", "accumulating"],
    name: "边界可视化与表达",
    category: "social",
    duration_minutes: 10,
    tools: ["手机备忘录"],
    steps: [
      "写下近期让你感到被侵入的 3 个情境，区分'可让步区'与'不可让步区'",
      "对每个边界用清晰陈述句写出，如'我需要每周三晚 8 点后不回复工作消息'",
      "用 DEAR MAN 结构预演：描述事实→表达感受→提出请求→说明对方获益",
      "练习以'我需要'而非'你应该'开头的句式",
      "记录预演后的身体感受",
    ],
    principle: "HSP 高共情倾向常过度让步导致耗竭。结构化表达减少模糊沟通的情绪消耗。",
    evidence: "Linehan, DBT Skills Manual, 2014; Aron & Aron, J Pers Soc Psychol, 1997",
  },
  {
    id: "hsp_expressive_writing",
    neuroTypes: ["hsp"],
    phases: ["warning", "overload", "recovery"],
    name: "表达性书写排空",
    category: "emotional",
    duration_minutes: 15,
    tools: ["纸笔或手机备忘录", "计时器"],
    steps: [
      "设定 15 分钟，选择一个情绪过载事件",
      "连续书写不停顿，不修改语法，把所有情绪、身体感受、联想全部倒出",
      "卡住就重复写'我不知道写什么'直到下一句出现",
      "时间到后深呼吸三次，重读一遍",
      "末尾写'这些情绪经过我，但不属于我'，然后撕掉或删除，象征性排空",
    ],
    principle: "表达性书写将情绪外化为语言，降低杏仁核激活。对 HSP 而言，提供'区分自我与他人情绪'的认知边界。",
    evidence: "Pennebaker & Beall, J Abnorm Psychol, 1986; Frattaroli, Psychol Bull, 2006",
  },
  {
    id: "hsp_sensory_diet",
    neuroTypes: ["hsp", "asd"],
    phases: ["stable", "accumulating"],
    name: "感觉饮食自评",
    category: "sensory",
    duration_minutes: 15,
    tools: ["手机备忘录", "计时器"],
    steps: [
      "画 24 小时感觉输入表，分视觉/听觉/触觉/嗅觉/前庭觉/本体觉六列",
      "标注今日每时段每种感觉的刺激强度（1-5 分），标出超过 4 分的过载点",
      "针对每个过载点写一个'降刺激'替代方案：降噪耳机、遮光帘、眼罩",
      "标注低于 2 分的'饥渴点'，写一个温和刺激补充：闻精油、温热杯、摇椅",
      "设定手机在最常过载的时段提醒执行 5 分钟降刺激动作",
    ],
    principle: "HSP 的感觉加工敏感性使神经系统阈值更低、累积更快。感觉饮食通过个体化输入规划维持最佳唤起区间。",
    evidence: "Aron & Aron, 1997; Wilbarger & Wilbarger, 1991",
  },
  {
    id: "hsp_pmr_short",
    neuroTypes: ["hsp", "asd", "adhd"],
    phases: ["warning", "overload", "recovery"],
    name: "渐进式肌肉放松短版",
    category: "sensory",
    duration_minutes: 12,
    tools: ["无需工具"],
    steps: [
      "找安静处坐或躺，闭眼，做三次深呼吸",
      "双手握拳 5 秒→松开 10 秒",
      "耸肩靠近耳朵 5 秒→放下 10 秒",
      "紧闭眼皱鼻 5 秒→放松 10 秒",
      "深吸气绷紧胸腹 5 秒→呼气放松 10 秒",
      "脚尖上翘绷紧小腿 5 秒→放松 10 秒",
      "全身扫描，对仍紧张部位再做一次，缓慢睁眼",
    ],
    principle: "通过先紧张再释放，让身体重新学会区分紧张与松弛，降低交感神经基础唤起，重建松弛参照点。",
    evidence: "Jacobson, 1938; Bernstein et al., APA, 2000",
  },

  // ========== PTSD ==========
  {
    id: "ptsd_butterfly_hug",
    neuroTypes: ["ptsd"],
    phases: ["warning", "overload"],
    name: "蝴蝶拥抱",
    category: "sensory",
    duration_minutes: 5,
    tools: ["无需工具"],
    steps: [
      "双臂交叉于胸前，右手放左肩上方、左手放右肩上方",
      "想象胸前有一只蝴蝶，双手像翅膀",
      "缓慢交替轻拍：左手拍一下→右手拍一下，节奏约每秒 1 拍",
      "边拍边深呼吸，注意力放在双手拍打的身体感觉与胸口起伏上",
      "可同时默念：'我此刻是安全的，过去已经过去'",
      "持续 2-4 分钟，结束后做三次深呼吸",
    ],
    principle: "源自 EMDR 疗法，左右交替触觉刺激产生双侧刺激，促进大脑两半球信息整合，降低杏仁核激活。自我拥抱同时释放催产素。",
    evidence: "Shapiro, EMDR Therapy, 2018; Jarero et al., J EMDR Pract Res, 2013",
  },
  {
    id: "ptsd_safe_place",
    neuroTypes: ["ptsd", "hsp"],
    phases: ["stable", "accumulating", "recovery"],
    name: "安全地带可视化",
    category: "emotional",
    duration_minutes: 10,
    tools: ["无需工具"],
    steps: [
      "闭眼，做三次深呼吸",
      "想象一个让你完全安全、平静的地方：海边、童年房间、森林小屋",
      "详细构建五种感官细节：看到什么颜色、听到什么声音、闻到什么气味、皮肤感到什么温度",
      "给自己设定一个安全词或手势（如拇指与食指相捏），与安全感受配对",
      "在场景中停留 3-5 分钟",
      "返回现实前做手势并默念安全词，把安全感'带出来'",
    ],
    principle: "EMDR 标准准备技术，在记忆中建立强烈的安全-放松回路，成为创伤记忆激活时的情绪避难所。配对手势通过条件反射快速唤起安全感。",
    evidence: "Shapiro, 2018; Leeds, Resources in EMDR, 2009",
  },
  {
    id: "ptsd_orienting",
    neuroTypes: ["ptsd"],
    phases: ["warning", "overload"],
    name: "定向与环境确认",
    category: "sensory",
    duration_minutes: 5,
    tools: ["无需工具"],
    steps: [
      "停下动作，坐稳，双脚着地，缓慢环顾整个房间",
      "让头和眼睛一起转动，逐一看房间四个角落，速度要慢",
      "每看到一处，默念'这里没有危险'或'我现在在____'",
      "找到房间里的出口（门、窗），确认它们的位置",
      "看一遍能让你感到安全的物品（家人照片、熟悉摆设）",
      "把目光落在一个舒适物体上，深呼吸三次",
    ],
    principle: "基于多迷走神经理论，PTSD 常处于冻结或过度警觉状态。主动定向行为激活腹侧迷走通路，发送'环境已评估、无威胁'信号。",
    evidence: "Porges, The Polyvagal Theory, 2011; Dana, 2018",
  },
  {
    id: "ptsd_flashback_card",
    neuroTypes: ["ptsd"],
    phases: ["overload"],
    name: "闪回应对卡",
    category: "sensory",
    duration_minutes: 5,
    tools: ["预制卡片或手机壁纸", "强感官物品（薄荷糖、风油精）"],
    steps: [
      "提前制作卡片：'这是闪回，是记忆，不是现在。今天是____年，我在____'",
      "察觉闪回开始时立即拿出卡片阅读这句话",
      "大声或默读三遍，同时用脚用力踩地，感受地面支撑",
      "用强感官刺激拉回：含薄荷糖感受凉意，或闻风油精",
      "环顾四周，说出三个当前物品的名称",
      "缓慢吸气 4 秒、呼气 6 秒，重复 5 次",
    ],
    principle: "闪回是创伤记忆以感觉碎片侵入当下。应对卡提供认知重评脚本，强感官刺激打断记忆回放，三通道同步把大脑拉回现在。",
    evidence: "Najavits, Seeking Safety, 2002; Ehlers & Clark, Behav Res Ther, 2000",
  },
  {
    id: "ptsd_cold_water",
    neuroTypes: ["ptsd", "asd", "adhd"],
    phases: ["overload"],
    name: "TIPP 冷水降速",
    category: "sensory",
    duration_minutes: 5,
    tools: ["冷水（10-15℃）", "盆或毛巾"],
    steps: [
      "情绪极度过载、恐慌时立即使用",
      "屏住呼吸，将面部（尤其眼睛上方与双颊）浸入或泼冷水 15-30 秒",
      "或用冰袋/冷湿毛巾敷于双眼与双颊 60 秒",
      "保持屏息状态，结束后正常呼吸",
      "等待 30-60 秒，感受心率明显减慢",
      "配合 3 次缓慢深呼吸",
      "注意：心脏病患者、孕妇慎用",
    ],
    principle: "面部接触冷水触发哺乳动物潜水反射，通过三叉神经-迷走神经通路使心率在 15-30 秒内下降 10-25%，快速打断情绪风暴。",
    evidence: "Linehan, DBT Manual, 2014; Hurwitz et al., Psychophysiology, 1993",
  },
  {
    id: "ptsd_activation",
    neuroTypes: ["ptsd"],
    phases: ["recovery"],
    name: "低唤起激活",
    category: "sensory",
    duration_minutes: 10,
    tools: ["无需工具", "可选快节奏音乐"],
    steps: [
      "评估唤起度，若处于麻木、解离、低能量状态（<4 分）则执行",
      "站立，用力跺脚 10 次，每次感受震动",
      "双手用力摩擦双臂与双颊，直到皮肤发热",
      "做 20 秒原地高抬腿或开合跳",
      "用冷水洗手或泼脸（温和版）",
      "闻刺激性气味（薄荷、柑橘、咖啡豆）10 秒",
      "播放 120bpm 以上音乐，跟着节奏小幅摆动 1 分钟",
    ],
    principle: "PTSD 低唤起对应背侧迷走冻结状态。通过强力本体觉、前庭觉、嗅觉与听觉刺激激活交感神经，拉回功能运作的中间唤起区。",
    evidence: "Porges, 2011; van der Kolk, The Body Keeps the Score, 2014",
  },
];

// 按神经特质过滤
export function getTherapiesByNeuroType(neuroType: NeuroType): Therapy[] {
  return THERAPIES.filter((t) => t.neuroTypes.includes(neuroType));
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
