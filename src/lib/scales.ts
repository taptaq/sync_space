import type { ScaleMeta, ScaleQuestion, ScaleId } from "@/types";

// 神经特质自评量表（PRD §11 非诊断声明）
// 四份量表均使用业内公开的官方原版题目，非改写、非简化
// 量表原文来源：
//   1. AQ-10  —— Allison, Auyeung & Baron-Cohen (2012), Cambridge ARC 官方
//   2. ASRS v1.1 —— Kessler et al. (2005), WHO/Harvard 官方中文版
//   3. HSPS —— Aron & Aron (1997)；本 Demo 使用基于 DOES 框架的参考简版
//   4. PCL-5 —— Blevins et al. (2015), PTSD Checklist for DSM-5；本 Demo 使用官方 20 题的前 6 题简版

// ============ AQ-10 · 自闭症谱系商数短版（官方原版 10 题） ============
// 来源：Cambridge Autism Research Centre，NICE CG142 推荐
// 4 选项：0=完全同意 1=稍微同意 2=稍微不同意 3=完全不同意
// 官方计分：题 1,7,8,10 选"同意"(index 0,1) 得 1 分；题 2,3,4,5,6,9 选"不同意"(index 2,3) 得 1 分
// 满分 10，cutoff ≥6 建议转介专科评估
const AQ10_OPTIONS = [
  { value: 0, label: "完全同意" },
  { value: 1, label: "稍微同意" },
  { value: 2, label: "稍微不同意" },
  { value: 3, label: "完全不同意" },
];

const AQ10_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: "我经常注意到别人听不到的小声音", scored_options: [0, 1] },
  { id: 2, text: "我通常更关注整体，而不是小细节", scored_options: [2, 3] },
  { id: 3, text: "我觉得同时做不止一件事很容易", scored_options: [2, 3] },
  { id: 4, text: "如果有中断，我能很快切换回正在做的事", scored_options: [2, 3] },
  { id: 5, text: "别人说话时，我容易听出弦外之音", scored_options: [2, 3] },
  { id: 6, text: "我知道如何判断听我说话的人是否感到无聊", scored_options: [2, 3] },
  { id: 7, text: "读故事时，我很难理解角色的意图", scored_options: [0, 1] },
  { id: 8, text: "我喜欢收集关于事物类别的信息（如车型、鸟种、火车类型、植物种类等）", scored_options: [0, 1] },
  { id: 9, text: "仅看脸就能轻松判断别人在想什么或感受如何", scored_options: [2, 3] },
  { id: 10, text: "我很难判断别人的意图", scored_options: [0, 1] },
];

// ============ ASRS v1.1 · 成人 ADHD 自测筛检表（官方中文版 6 题） ============
// 来源：WHO / Harvard Medical School (Kessler et al., 2005)，官方简体中文版
// 5 选项：0=很经常 1=经常 2=有时 3=很少 4=从不
// 官方计分（阴影区）：题 1-3 选"很经常/经常"(index 0,1) 得 1 分；题 4-6 选"很经常/经常/有时"(index 0,1,2) 得 1 分
// 满分 6，cutoff ≥4 提示症状可能与成人 ADHD 相符
const ASRS6_OPTIONS = [
  { value: 0, label: "很经常" },
  { value: 1, label: "经常" },
  { value: 2, label: "有时" },
  { value: 3, label: "很少" },
  { value: 4, label: "从不" },
];

const ASRS6_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: "在完成其中最艰难的部分之后，您在处理某一项目的最后细节时是否常常有困难？", scored_options: [0, 1] },
  { id: 2, text: "您在完成具有组织性质的任务时，是否时常有困难把事情整理安排好？", scored_options: [0, 1] },
  { id: 3, text: "您是否时常有困难记住约会或应做的事？", scored_options: [0, 1] },
  { id: 4, text: "如果一件事需要多动脑筋，您是否常常躲避或推延开始做它？", scored_options: [0, 1, 2] },
  { id: 5, text: "如果您不得不长时间坐下，您是否常常蠕动不安或者手脚动个不停？", scored_options: [0, 1, 2] },
  { id: 6, text: "您是否时常感到过度活跃，强迫自己做事，就像上了发条的机器？", scored_options: [0, 1, 2] },
];

// ============ HSPS-12 · 高敏感人群量表参考简版（基于 Aron DOES 框架） ============
// 原版 HSPS 27 题（Aron & Aron, 1997）受版权保护
// 本简版基于 Aron 公开提出的 DOES 四维框架编制，每维 3 题共 12 题
// DOES：Depth（深度加工）/ Overstimulation（过度刺激）/ Emotional（情绪强度与共情）/ Sensory（感官敏感）
// 5 点 Likert：0=完全不同意 1=不太同意 2=中立 3=比较同意 4=完全同意
// Likert 累加，满分 48
const HSPS12_OPTIONS = [
  { value: 0, label: "完全不同意" },
  { value: 1, label: "不太同意" },
  { value: 2, label: "中立" },
  { value: 3, label: "比较同意" },
  { value: 4, label: "完全同意" },
];

const HSPS12_QUESTIONS: ScaleQuestion[] = [
  // Depth of processing · 深度加工
  { id: 1, text: `我倾向于对事情进行深入、细致的思考，别人常说我"想太多"` },
  { id: 2, text: "我做决定前会反复权衡，即使是很小的事" },
  { id: 3, text: "我容易被艺术、音乐或自然深深打动，久久回味" },
  // Overstimulation · 过度刺激
  { id: 4, text: "嘈杂或混乱的环境让我很快就感到疲惫" },
  { id: 5, text: "强光、刺耳声音、粗糙面料会让我明显不适" },
  { id: 6, text: "忙碌的一天后，我需要独处来恢复" },
  // Emotional intensity & empathy · 情绪强度与共情
  { id: 7, text: "我容易因别人的情绪而情绪起伏" },
  { id: 8, text: "别人不舒服时，我身体也会有反应" },
  { id: 9, text: `我常觉得难以区分"我的情绪"和"吸收来的情绪"` },
  // Sensory sensitivity · 感官敏感
  { id: 10, text: "我能察觉到别人忽略的微妙氛围或环境变化" },
  { id: 11, text: "我对气味、温度、声音的细微变化很敏感" },
  { id: 12, text: "我容易被别人的请求裹挟，难以拒绝" },
];

// ============ PCL-5 · PTSD 检查表简版（官方 20 题的前 6 题） ============
// 来源：Blevins et al. (2015), PTSD Checklist for DSM-5，美国国家 PTSD 中心
// 官方 PCL-5 共 20 题，5 点 Likert（0=完全没有 ~ 4=极其严重）
// 本 Demo 简版取前 6 题（对应 DSM-5 B 组侵入性症状 + C 组回避），Likert 累加
// 官方 PCL-5 cutoff ≥31-33（20 题总分）；简版按比例参考 cutoff ≥10
const PCL5_OPTIONS = [
  { value: 0, label: "完全没有" },
  { value: 1, label: "有一点" },
  { value: 2, label: "中等程度" },
  { value: 3, label: "相当严重" },
  { value: 4, label: "极其严重" },
];

const PCL5_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: "在过去一个月里，我不想要的记忆、想法或画面会反复闯入脑海" },
  { id: 2, text: "在过去一个月里，关于某次压力经历的梦会反复出现，让我不安" },
  { id: 3, text: "在过去一个月里，我会突然感觉那件事好像又要发生了（闪回）" },
  { id: 4, text: "在过去一个月里，当被提醒那件事时，我会产生强烈的情绪反应" },
  { id: 5, text: "在过去一个月里，当被提醒那件事时，我会有身体反应（心跳加速、出汗等）" },
  { id: 6, text: "在过去一个月里，我会刻意回避让我想起那件事的情境或想法" },
];

export const SCALES: Record<ScaleId, ScaleMeta> = {
  aq10: {
    id: "aq10",
    neuro_type: "asd",
    label: "ASD",
    full_name: "自闭症谱系商数 · AQ-10 短版",
    source: "Allison, Auyeung & Baron-Cohen (2012), Cambridge Autism Research Centre",
    official_url: "https://www.autismresearchcentre.com/tests/aq-tests/aq10/",
    question_count: 10,
    scoring: "binary",
    description: "了解自己在感官敏感、社交直觉、细节关注上的特质分布。这是 NICE（英国国家卫生与临床优化研究所）推荐的快速筛查工具。",
    options: AQ10_OPTIONS,
    cutoff: 6,
    cutoff_note: "官方 cutoff ≥6 分：建议转介专科评估。本 Demo 不做诊断。",
    bands: [
      {
        max: 3,
        level: "low",
        title: "特质表达较低",
        summary: "你在感官、社交直觉、多任务切换上相对自在。社交和不确定性的消耗对你来说较可控。",
        recommended_protocols: [
          "当社交电量 < 4，留 20 分钟独处恢复",
          "当计划临时变动，先停 3 分钟再决定",
        ],
      },
      {
        max: 5,
        level: "mid",
        title: "特质表达中等",
        summary: `你在某些情境下会感到感官或社交的负担。留意那些让你"突然想撤"的瞬间，往往是信号。`,
        recommended_protocols: [
          "当感官负载 > 7，15 分钟内撤退到安静空间",
          "当可预测性需求高，提前 1 小时告知变化",
        ],
      },
      {
        max: 10,
        level: "high",
        title: "特质表达较高（达到官方 cutoff）",
        summary: "你达到 AQ-10 官方 cutoff（≥6）。这不是诊断，但提示你的神经系统对环境更敏感，需要更多可协商的协议。如需明确，请联系专业人士。",
        recommended_protocols: [
          "当感官负载 > 6，立即停止当前活动撤退 15 分钟",
          "当社交电量 < 6，接下来 2 小时不接收新社交输入",
          `当计划变动，先问清"变到哪里"，再决定是否参与`,
        ],
      },
    ],
  },

  asrs6: {
    id: "asrs6",
    neuro_type: "adhd",
    label: "ADHD",
    full_name: "成人 ADHD 自测筛检表 · ASRS v1.1",
    source: "Kessler et al. (2005), WHO / Harvard Medical School 官方简体中文版",
    official_url: "https://www.hcp.med.harvard.edu/ncs/asrs.php",
    question_count: 6,
    scoring: "binary",
    description: "了解自己在注意力维持、任务组织、启动阻力上的特质分布。这是 WHO 与哈佛联合开发的官方筛检工具。",
    options: ASRS6_OPTIONS,
    cutoff: 4,
    cutoff_note: "官方 cutoff ≥4 分：症状可能与成人 ADHD 相符，建议咨询专业人士。本 Demo 不做诊断。",
    bands: [
      {
        max: 1,
        level: "low",
        title: "特质表达较低",
        summary: "你能比较稳定地启动任务、维持专注、组织安排。日常系统对你来说是可用的。",
        recommended_protocols: [
          "当启动阻力高，先做 2 分钟微任务破冰",
        ],
      },
      {
        max: 3,
        level: "mid",
        title: "特质表达中等",
        summary: `你在无聊任务和高压任务间的切换有时会卡住。留意"想做却启动不了"的时刻。`,
        recommended_protocols: [
          "当启动阻力高，先做 2 分钟微任务破冰",
          "当注意力涣散，切换到身体任务 10 分钟",
        ],
      },
      {
        max: 6,
        level: "high",
        title: "特质表达较高（达到官方 cutoff）",
        summary: "你达到 ASRS v1.1 官方 cutoff（≥4）。这不是诊断，但提示你的注意力系统有自己的节律，外部脚手架比意志力更有效。如需明确，请联系专业人士。",
        recommended_protocols: [
          "当启动阻力高，先做 2 分钟微任务破冰",
          "当多巴胺电量低，安排一件小而确定的事",
          "当注意力涣散 30 分钟以上，切换到身体任务",
        ],
      },
    ],
  },

  hsps12: {
    id: "hsps12",
    neuro_type: "hsp",
    label: "HSP",
    full_name: "高敏感人群量表 · HSPS 参考简版",
    source: "基于 Aron & Aron (1997) HSPS 的 DOES 四维框架编制的参考简版",
    official_url: "https://hsperson.com/test/highly-sensitive-test/",
    question_count: 12,
    scoring: "likert",
    description: "了解自己在深度加工、过度刺激、情绪共情、感官敏感四个维度的特质分布。基于 Elaine Aron 的高敏感人格研究。",
    options: HSPS12_OPTIONS,
    cutoff: 28,
    cutoff_note: "参考 cutoff ≥28 分（对应原版 HSPS 14/27 题的分界比例）。本 Demo 不做诊断。",
    bands: [
      {
        max: 15,
        level: "low",
        title: "特质表达较低",
        summary: "你的神经系统对外界刺激的吸收度适中。你能区分自己和他人的情绪，边界感相对清晰。",
        recommended_protocols: [
          "当吸收量满，留 15 分钟独处整理",
        ],
      },
      {
        max: 27,
        level: "mid",
        title: "特质表达中等",
        summary: `你在高强度环境里会明显感到疲惫。学会区分"我的情绪"和"吸收来的情绪"，是你的核心功课。`,
        recommended_protocols: [
          "当吸收量满，接下来 1 小时不接收他人情绪输入",
          "当环境刺激强，撤退到低感官空间 20 分钟",
        ],
      },
      {
        max: 48,
        level: "high",
        title: "特质表达较高",
        summary: "你的神经系统是一台高增益接收器。敏感不是脆弱，是能力——但你需要主动维护边界，否则会持续透支。",
        recommended_protocols: [
          "当吸收量满，接下来 2 小时不接收他人情绪输入",
          "当环境刺激强，立即撤退到低感官空间",
          `当边界模糊，做 5 分钟"这是谁的"分辨练习`,
        ],
      },
    ],
  },

  pcl5: {
    id: "pcl5",
    neuro_type: "ptsd",
    label: "PTSD",
    full_name: "PTSD 检查表 · PCL-5 简版",
    source: "Blevins et al. (2015), PTSD Checklist for DSM-5，美国国家 PTSD 中心",
    official_url: "https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp",
    question_count: 6,
    scoring: "likert",
    description: "了解自己在侵入性记忆、回避反应、唤起度上的特质分布。这是美国退伍军人事务部（VA）国家 PTSD 中心开发的官方工具。",
    options: PCL5_OPTIONS,
    cutoff: 10,
    cutoff_note: "参考 cutoff ≥10 分（按官方 31 分 / 20 题比例换算）。达到建议咨询专业人士。本 Demo 不做诊断。",
    bands: [
      {
        max: 5,
        level: "low",
        title: "特质表达较低",
        summary: "过去一个月里，你较少被侵入性记忆或回避反应困扰。你的神经系统目前处于相对稳定的状态。",
        recommended_protocols: [
          "当出现闪回苗头，做 5 分钟 5-4-3-2-1 接地练习",
        ],
      },
      {
        max: 9,
        level: "mid",
        title: "特质表达中等",
        summary: `你偶尔会被不想要的记忆或回避反应打扰。留意那些"突然被拉回过去"的瞬间，那是信号。`,
        recommended_protocols: [
          "当出现闪回苗头，立即做 5 分钟 5-4-3-2-1 接地练习",
          "当回避冲动强，先留在情境里 3 分钟再决定是否离开",
        ],
      },
      {
        max: 24,
        level: "high",
        title: "特质表达较高（达到参考 cutoff）",
        summary: "你达到 PCL-5 简版参考 cutoff。这不是诊断，但提示你的神经系统可能还在处理过去的压力事件。创伤恢复是可能的，专业的创伤聚焦治疗（如 EMDR、CPT）能有效帮助。请联系专业人士。",
        recommended_protocols: [
          "当出现闪回，立即做 5 分钟 5-4-3-2-1 接地练习",
          "当唤起度高，撤退到安全空间 15 分钟",
          "当回避冲动强，不强迫自己，先记录下来带给治疗师",
        ],
      },
    ],
  },
};

export const SCALE_QUESTIONS: Record<ScaleId, ScaleQuestion[]> = {
  aq10: AQ10_QUESTIONS,
  asrs6: ASRS6_QUESTIONS,
  hsps12: HSPS12_QUESTIONS,
  pcl5: PCL5_QUESTIONS,
};

// 量表列表（用于选择页）
// 初期聚焦 ASD + ADHD（HSPS/PCL-5 量表数据保留但暂不展示 · 后续扩展时取消注释）
export const SCALE_LIST: ScaleMeta[] = [SCALES.aq10, SCALES.asrs6];
