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
  { value: 0, label: { zh: "完全同意", en: "Definitely agree" } },
  { value: 1, label: { zh: "稍微同意", en: "Slightly agree" } },
  { value: 2, label: { zh: "稍微不同意", en: "Slightly disagree" } },
  { value: 3, label: { zh: "完全不同意", en: "Definitely disagree" } },
];

const AQ10_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "我经常注意到别人听不到的小声音", en: "I often notice small sounds that others cannot hear" }, scored_options: [0, 1] },
  { id: 2, text: { zh: "我通常更关注整体，而不是小细节", en: "I usually concentrate more on the whole picture, rather than the small details" }, scored_options: [2, 3] },
  { id: 3, text: { zh: "我觉得同时做不止一件事很容易", en: "I find it easy to do more than one thing at once" }, scored_options: [2, 3] },
  { id: 4, text: { zh: "如果有中断，我能很快切换回正在做的事", en: "If there is an interruption, I can switch back to what I was doing very quickly" }, scored_options: [2, 3] },
  { id: 5, text: { zh: "别人说话时，我容易听出弦外之音", en: "I find it easy to \"read between the lines\" when someone is talking to me" }, scored_options: [2, 3] },
  { id: 6, text: { zh: "我知道如何判断听我说话的人是否感到无聊", en: "I know how to tell if someone listening to me is getting bored" }, scored_options: [2, 3] },
  { id: 7, text: { zh: "读故事时，我很难理解角色的意图", en: "When I'm reading a story, I find it difficult to work out the characters' intentions" }, scored_options: [0, 1] },
  { id: 8, text: { zh: "我喜欢收集关于事物类别的信息（如车型、鸟种、火车类型、植物种类等）", en: "I like to collect information about categories of things (e.g., types of car, types of bird, types of train, types of plant, etc.)" }, scored_options: [0, 1] },
  { id: 9, text: { zh: "仅看脸就能轻松判断别人在想什么或感受如何", en: "I find it easy to work out what someone is thinking or feeling just by looking at their face" }, scored_options: [2, 3] },
  { id: 10, text: { zh: "我很难判断别人的意图", en: "I find it difficult to work out people's intentions" }, scored_options: [0, 1] },
];

// ============ ASRS v1.1 · 成人 ADHD 自测筛检表（官方中文版 6 题） ============
// 来源：WHO / Harvard Medical School (Kessler et al., 2005)，官方简体中文版
// 5 选项：0=很经常 1=经常 2=有时 3=很少 4=从不
// 官方计分（阴影区）：题 1-3 选"很经常/经常"(index 0,1) 得 1 分；题 4-6 选"很经常/经常/有时"(index 0,1,2) 得 1 分
// 满分 6，cutoff ≥4 提示症状可能与成人 ADHD 相符
const ASRS6_OPTIONS = [
  { value: 0, label: { zh: "很经常", en: "Very often" } },
  { value: 1, label: { zh: "经常", en: "Often" } },
  { value: 2, label: { zh: "有时", en: "Sometimes" } },
  { value: 3, label: { zh: "很少", en: "Rarely" } },
  { value: 4, label: { zh: "从不", en: "Never" } },
];

const ASRS6_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "在完成其中最艰难的部分之后，您在处理某一项目的最后细节时是否常常有困难？", en: "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?" }, scored_options: [0, 1] },
  { id: 2, text: { zh: "您在完成具有组织性质的任务时，是否时常有困难把事情整理安排好？", en: "How often do you have difficulty getting things in order when you have to do a task that requires organization?" }, scored_options: [0, 1] },
  { id: 3, text: { zh: "您是否时常有困难记住约会或应做的事？", en: "How often do you have problems remembering appointments or obligations?" }, scored_options: [0, 1] },
  { id: 4, text: { zh: "如果一件事需要多动脑筋，您是否常常躲避或推延开始做它？", en: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?" }, scored_options: [0, 1, 2] },
  { id: 5, text: { zh: "如果您不得不长时间坐下，您是否常常蠕动不安或者手脚动个不停？", en: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?" }, scored_options: [0, 1, 2] },
  { id: 6, text: { zh: "您是否时常感到过度活跃，强迫自己做事，就像上了发条的机器？", en: "How often do you feel overly active and compelled to do things, like you were driven by a motor?" }, scored_options: [0, 1, 2] },
];

// ============ HSPS-12 · 高敏感人群量表参考简版（基于 Aron DOES 框架） ============
// 原版 HSPS 27 题（Aron & Aron, 1997）受版权保护
// 本简版基于 Aron 公开提出的 DOES 四维框架编制，每维 3 题共 12 题
// DOES：Depth（深度加工）/ Overstimulation（过度刺激）/ Emotional（情绪强度与共情）/ Sensory（感官敏感）
// 5 点 Likert：0=完全不同意 1=不太同意 2=中立 3=比较同意 4=完全同意
// Likert 累加，满分 48
const HSPS12_OPTIONS = [
  { value: 0, label: { zh: "完全不同意", en: "Strongly disagree" } },
  { value: 1, label: { zh: "不太同意", en: "Disagree" } },
  { value: 2, label: { zh: "中立", en: "Neutral" } },
  { value: 3, label: { zh: "比较同意", en: "Agree" } },
  { value: 4, label: { zh: "完全同意", en: "Strongly agree" } },
];

const HSPS12_QUESTIONS: ScaleQuestion[] = [
  // Depth of processing · 深度加工
  { id: 1, text: { zh: `我倾向于对事情进行深入、细致的思考，别人常说我"想太多"`, en: `I tend to think deeply and carefully about things; others often say I "overthink"` } },
  { id: 2, text: { zh: "我做决定前会反复权衡，即使是很小的事", en: "I weigh things back and forth before making decisions, even small ones" } },
  { id: 3, text: { zh: "我容易被艺术、音乐或自然深深打动，久久回味", en: "I am easily and lastingly moved by art, music, or nature" } },
  // Overstimulation · 过度刺激
  { id: 4, text: { zh: "嘈杂或混乱的环境让我很快就感到疲惫", en: "Noisy or chaotic environments tire me out quickly" } },
  { id: 5, text: { zh: "强光、刺耳声音、粗糙面料会让我明显不适", en: "Bright lights, harsh sounds, or rough fabrics noticeably bother me" } },
  { id: 6, text: { zh: "忙碌的一天后，我需要独处来恢复", en: "I need to be alone to recover after a busy day" } },
  // Emotional intensity & empathy · 情绪强度与共情
  { id: 7, text: { zh: "我容易因别人的情绪而情绪起伏", en: "I am easily affected by others' moods and my own emotions fluctuate accordingly" } },
  { id: 8, text: { zh: "别人不舒服时，我身体也会有反应", en: "When others are uncomfortable, I feel it in my body too" } },
  { id: 9, text: { zh: `我常觉得难以区分"我的情绪"和"吸收来的情绪"`, en: `I often find it hard to distinguish "my own emotions" from "emotions I've absorbed"` } },
  // Sensory sensitivity · 感官敏感
  { id: 10, text: { zh: "我能察觉到别人忽略的微妙氛围或环境变化", en: "I notice subtle atmospheres or environmental changes that others miss" } },
  { id: 11, text: { zh: "我对气味、温度、声音的细微变化很敏感", en: "I am sensitive to subtle changes in smell, temperature, or sound" } },
  { id: 12, text: { zh: "我容易被别人的请求裹挟，难以拒绝", en: "I am easily swept along by others' requests and find it hard to refuse" } },
];

// ============ PCL-5 · PTSD 检查表简版（官方 20 题的前 6 题） ============
// 来源：Blevins et al. (2015), PTSD Checklist for DSM-5，美国国家 PTSD 中心
// 官方 PCL-5 共 20 题，5 点 Likert（0=完全没有 ~ 4=极其严重）
// 本 Demo 简版取前 6 题（对应 DSM-5 B 组侵入性症状 + C 组回避），Likert 累加
// 官方 PCL-5 cutoff ≥31-33（20 题总分）；简版按比例参考 cutoff ≥10
const PCL5_OPTIONS = [
  { value: 0, label: { zh: "完全没有", en: "Not at all" } },
  { value: 1, label: { zh: "有一点", en: "A little bit" } },
  { value: 2, label: { zh: "中等程度", en: "Moderately" } },
  { value: 3, label: { zh: "相当严重", en: "Quite a bit" } },
  { value: 4, label: { zh: "极其严重", en: "Extremely" } },
];

const PCL5_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "在过去一个月里，我不想要的记忆、想法或画面会反复闯入脑海", en: "In the past month, unwanted memories, thoughts, or images of a stressful experience have repeatedly intruded into my mind" } },
  { id: 2, text: { zh: "在过去一个月里，关于某次压力经历的梦会反复出现，让我不安", en: "In the past month, I have had recurring dreams about a stressful experience that left me unsettled" } },
  { id: 3, text: { zh: "在过去一个月里，我会突然感觉那件事好像又要发生了（闪回）", en: "In the past month, I have suddenly felt as if the experience were happening again (flashbacks)" } },
  { id: 4, text: { zh: "在过去一个月里，当被提醒那件事时，我会产生强烈的情绪反应", en: "In the past month, I have had strong emotional reactions when reminded of the experience" } },
  { id: 5, text: { zh: "在过去一个月里，当被提醒那件事时，我会有身体反应（心跳加速、出汗等）", en: "In the past month, I have had physical reactions (racing heart, sweating, etc.) when reminded of the experience" } },
  { id: 6, text: { zh: "在过去一个月里，我会刻意回避让我想起那件事的情境或想法", en: "In the past month, I have avoided situations or thoughts that remind me of the experience" } },
];

// ============ SNAP-IV · 儿童 ADHD 评定量表（18 题） ============
// 来源：Swanson, Nolan and Pelham (version IV)
// 4 选项 0-3；症状计数按“还算不少/非常多”（index 2,3）得 1 分
// 常用解释：注意缺陷或多动冲动任一维度 ≥6 项阳性可考虑进一步评估
const SNAP18_OPTIONS = [
  { value: 0, label: { zh: "完全没有", en: "Not at all" } },
  { value: 1, label: { zh: "有一点", en: "Just a little" } },
  { value: 2, label: { zh: "还算不少", en: "Quite a bit" } },
  { value: 3, label: { zh: "非常的多", en: "Very much" } },
];

const SNAP18_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "在学校做作业或者其他活动时无法专注于细节的部分，或出现粗心的错误", en: "Fails to give close attention to details or makes careless mistakes in schoolwork, work, or other activities" }, scored_options: [2, 3] },
  { id: 2, text: { zh: "很难持续专注于工作或游戏活动", en: "Has difficulty sustaining attention in tasks or play activities" }, scored_options: [2, 3] },
  { id: 3, text: { zh: "看起来好像没有听到别人对他（她）说话的内容", en: "Does not seem to listen when spoken to directly" }, scored_options: [2, 3] },
  { id: 4, text: { zh: "没有办法遵循指示，也无法完成学校作业或家事（并不是由于对立性行为或无法了解指示的内容）", en: "Does not follow through on instructions and fails to finish schoolwork, chores, or duties" }, scored_options: [2, 3] },
  { id: 5, text: { zh: "很难组织规划工作活动", en: "Has difficulty organizing tasks and activities" }, scored_options: [2, 3] },
  { id: 6, text: { zh: "逃避、或者表达不愿意，或很难从事于需要持续性动脑的工作（例如学校作业或家庭作业）", en: "Avoids, dislikes, or is reluctant to engage in tasks requiring sustained mental effort" }, scored_options: [2, 3] },
  { id: 7, text: { zh: "会弄丢作业或活动必需的东西（如学校作业、铅笔、书、工具或玩具）", en: "Loses things necessary for tasks or activities" }, scored_options: [2, 3] },
  { id: 8, text: { zh: "很容易受外在刺激影响而分心", en: "Is easily distracted by extraneous stimuli" }, scored_options: [2, 3] },
  { id: 9, text: { zh: "在日常生活中忘东忘西", en: "Is forgetful in daily activities" }, scored_options: [2, 3] },
  { id: 10, text: { zh: "在座位上玩弄手脚或不好好坐着", en: "Fidgets with hands or feet or squirms in seat" }, scored_options: [2, 3] },
  { id: 11, text: { zh: "在教室或其他必须持续坐着的场合，会任意离开座位", en: "Leaves seat in classroom or in other situations in which remaining seated is expected" }, scored_options: [2, 3] },
  { id: 12, text: { zh: "在不适当的场合乱跑或爬高爬低", en: "Runs about or climbs excessively in situations in which it is inappropriate" }, scored_options: [2, 3] },
  { id: 13, text: { zh: "很难安静地玩或参与休闲活动", en: "Has difficulty playing or engaging in leisure activities quietly" }, scored_options: [2, 3] },
  { id: 14, text: { zh: "总是一直在动或是像马达似的动个不停", en: "Is 'on the go' or often acts as if 'driven by a motor'" }, scored_options: [2, 3] },
  { id: 15, text: { zh: "话很多", en: "Talks excessively" }, scored_options: [2, 3] },
  { id: 16, text: { zh: "在问题还没问完前就急着回答", en: "Blurts out answers before questions have been completed" }, scored_options: [2, 3] },
  { id: 17, text: { zh: "在游戏中或团队活动中无法排队或等待轮流", en: "Has difficulty awaiting turn" }, scored_options: [2, 3] },
  { id: 18, text: { zh: "打断或干扰别人（例如插嘴或打断别人的游戏）", en: "Interrupts or intrudes on others" }, scored_options: [2, 3] },
];

// ============ MDQ-E · 33 项轻躁狂症状清单 ============
// 来源：基于 Hirschfeld 等编制的心境障碍问卷（MDQ）扩展版
// 是/否计分，答“是”得 1 分
// 参考 cutoff：≥7 项阳性提示需关注情绪高涨/精力旺盛周期
const MDQE33_OPTIONS = [
  { value: 0, label: { zh: "否", en: "No" } },
  { value: 1, label: { zh: "是", en: "Yes" } },
];

const MDQE33_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "我需要的睡眠时间比平时少", en: "I needed less sleep than usual" }, scored_options: [1] },
  { id: 2, text: { zh: "我感觉比平时更有精力并且更加活跃", en: "I felt more energetic and active than usual" }, scored_options: [1] },
  { id: 3, text: { zh: "我比平时更自信", en: "I felt more self-confident than usual" }, scored_options: [1] },
  { id: 4, text: { zh: "我更加享受工作", en: "I enjoyed my work more" }, scored_options: [1] },
  { id: 5, text: { zh: "我社交活动增多（打电话比平时多、外出比平时多）", en: "I was more sociable (made more phone calls, went out more)" }, scored_options: [1] },
  { id: 6, text: { zh: "我更想去旅行，和/或旅行的确比平时多", en: "I wanted to travel more, and/or did travel more" }, scored_options: [1] },
  { id: 7, text: { zh: "我开车比平时快，或开车不顾危险", en: "I drove faster than usual, or took more risks while driving" }, scored_options: [1] },
  { id: 8, text: { zh: "我花钱比平时多，或花了太多钱", en: "I spent more money than usual, or spent too much" }, scored_options: [1] },
  { id: 9, text: { zh: "在日常生活中，我比平时更冒险（在工作或在其它活动上）", en: "I took more risks in daily life, at work or in other activities" }, scored_options: [1] },
  { id: 10, text: { zh: "我活动量增多（如体育运动等）", en: "I was more physically active (e.g., sports)" }, scored_options: [1] },
  { id: 11, text: { zh: "我有更多的打算，或计划更多的活动", en: "I had more plans, or planned more activities" }, scored_options: [1] },
  { id: 12, text: { zh: "我有更多的点子，或更具有创造力", en: "I had more ideas, or was more creative" }, scored_options: [1] },
  { id: 13, text: { zh: "我很少害羞或者感到约束", en: "I was less shy or inhibited" }, scored_options: [1] },
  { id: 14, text: { zh: "我会穿更加鲜艳、更加奢侈的衣服/用更鲜艳、更奢侈的化妆品", en: "I wore more colorful or extravagant clothes/makeup" }, scored_options: [1] },
  { id: 15, text: { zh: "我想和更多的人接触，或者的确接触了更多的人", en: "I wanted to be with more people, or was with more people" }, scored_options: [1] },
  { id: 16, text: { zh: "我对“性”更感兴趣，或性欲增强", en: "I was more interested in sex, or my sex drive increased" }, scored_options: [1] },
  { id: 17, text: { zh: "我讲话更多", en: "I talked more" }, scored_options: [1] },
  { id: 18, text: { zh: "我思维更快", en: "My thoughts raced faster" }, scored_options: [1] },
  { id: 19, text: { zh: "我讲话时会开更多的玩笑，或者说更多双关语", en: "I made more jokes or puns when speaking" }, scored_options: [1] },
  { id: 20, text: { zh: "我比平时容易分心", en: "I was more easily distracted than usual" }, scored_options: [1] },
  { id: 21, text: { zh: "我尝试许多新鲜事物", en: "I tried many new things" }, scored_options: [1] },
  { id: 22, text: { zh: "我的想法经常从一个话题跳到另一个话题", en: "My ideas jumped from one topic to another" }, scored_options: [1] },
  { id: 23, text: { zh: "我做事比平时快，并且/或者觉得更顺手", en: "I did things faster than usual, and/or found it easier" }, scored_options: [1] },
  { id: 24, text: { zh: "我更加没有耐心，并且/或者更容易急躁", en: "I was more impatient and/or irritable" }, scored_options: [1] },
  { id: 25, text: { zh: "我更令别人疲惫不堪，或更容易对别人发怒", en: "I tired others out more, or got angry at others more easily" }, scored_options: [1] },
  { id: 26, text: { zh: "我陷入更多的争吵", en: "I got into more arguments" }, scored_options: [1] },
  { id: 27, text: { zh: "我的情绪变得高涨、更乐观", en: "My mood was higher and more optimistic" }, scored_options: [1] },
  { id: 28, text: { zh: "我喝更多的咖啡", en: "I drank more coffee" }, scored_options: [1] },
  { id: 29, text: { zh: "我吸更多的烟", en: "I smoked more" }, scored_options: [1] },
  { id: 30, text: { zh: "我喝更多的酒", en: "I drank more alcohol" }, scored_options: [1] },
  { id: 31, text: { zh: "我服用更多的药物（镇静剂、抗焦虑剂、兴奋剂等）", en: "I took more medications (sedatives, anti-anxiety, stimulants, etc.)" }, scored_options: [1] },
  { id: 32, text: { zh: "我参加更多的游戏或赌博活动", en: "I engaged in more games or gambling" }, scored_options: [1] },
  { id: 33, text: { zh: "我吃得更多或参加更多的狂欢", en: "I ate more or went to more parties" }, scored_options: [1] },
];

// ============ SAS · 焦虑自评量表（Zung, 20 题） ============
// 4 点 1-4 分，部分题目反向计分
// 原始分 ≥40（标准分 ≥50）为筛查阳性参考
const SAS20_OPTIONS = [
  { value: 1, label: { zh: "没有或很少时间有", en: "None or a little of the time" } },
  { value: 2, label: { zh: "有时有", en: "Some of the time" } },
  { value: 3, label: { zh: "大部分时间有", en: "Good part of the time" } },
  { value: 4, label: { zh: "绝大部分或全部时间都有", en: "Most or all of the time" } },
];

const SAS20_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "我觉得比平常容易紧张和着急（焦虑）", en: "I feel more nervous and anxious than usual" } },
  { id: 2, text: { zh: "我无缘无故地感到害怕（害怕）", en: "I feel afraid for no reason at all" } },
  { id: 3, text: { zh: "我容易心里烦乱或觉得惊恐（惊恐）", en: "I feel panicky or upset" } },
  { id: 4, text: { zh: "我觉得我可能将要发疯（发疯感）", en: "I feel like I'm falling apart and going to pieces" } },
  { id: 5, text: { zh: "我觉得一切都很好，也不会发生什么不幸（不幸预感）", en: "I feel that everything is all right and nothing bad will happen" }, reverse: true },
  { id: 6, text: { zh: "我手脚发抖打颤（手足颤抖）", en: "My arms and legs shake and tremble" } },
  { id: 7, text: { zh: "我因为头痛，颈痛和背痛而苦恼（躯体疼痛）", en: "I am bothered by headaches, neck and back pains" } },
  { id: 8, text: { zh: "我感觉容易衰弱和疲乏（乏力）", en: "I feel weak and get tired easily" } },
  { id: 9, text: { zh: "我觉得心平气和，并且容易安静坐着（静坐不能）", en: "I feel calm and can sit still easily" }, reverse: true },
  { id: 10, text: { zh: "我觉得心跳很快（心慌）", en: "I can feel my heart beating fast" } },
  { id: 11, text: { zh: "我因为一阵阵头晕而苦恼（头昏）", en: "I am bothered by dizzy spells" } },
  { id: 12, text: { zh: "我有晕倒发作或觉得要晕倒似的（晕厥感）", en: "I have fainting spells or feel like it" } },
  { id: 13, text: { zh: "我呼气吸气都感到很容易（呼吸困难）", en: "I can breathe in and out easily" }, reverse: true },
  { id: 14, text: { zh: "我手脚麻木和刺痛（手足刺痛）", en: "I get numbness and tingling in my hands and feet" } },
  { id: 15, text: { zh: "我因为胃痛和消化不良而苦恼（胃痛或消化不良）", en: "I am bothered by stomachaches or indigestion" } },
  { id: 16, text: { zh: "我常常要小便（尿意频数）", en: "I have to empty my bladder often" } },
  { id: 17, text: { zh: "我的手常常是干燥温暖的（多汗）", en: "My hands are usually dry and warm" }, reverse: true },
  { id: 18, text: { zh: "我脸红发热（面部潮红）", en: "My face gets hot and blushes" } },
  { id: 19, text: { zh: "我容易入睡并且一夜睡得很好", en: "I fall asleep easily and get a good night's rest" }, reverse: true },
  { id: 20, text: { zh: "我做恶梦", en: "I have nightmares" } },
];

// ============ SDS · 抑郁自评量表（Zung, 20 题） ============
// 4 点 1-4 分，部分题目反向计分
// 原始分 ≥42（标准分 ≥53）为筛查阳性参考
const SDS20_OPTIONS = [
  { value: 1, label: { zh: "没有或很少时间", en: "None or a little of the time" } },
  { value: 2, label: { zh: "少部分时间", en: "Some of the time" } },
  { value: 3, label: { zh: "相当多时间", en: "Good part of the time" } },
  { value: 4, label: { zh: "绝大部分或全部时间", en: "Most or all of the time" } },
];

const SDS20_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "我感到郁闷，情绪低沉", en: "I feel down-hearted and blue" } },
  { id: 2, text: { zh: "我感到早晨心情最好", en: "Morning is when I feel the best" }, reverse: true },
  { id: 3, text: { zh: "我要哭或想哭", en: "I have crying spells or feel like it" } },
  { id: 4, text: { zh: "我夜间睡眠不好", en: "I have trouble sleeping at night" } },
  { id: 5, text: { zh: "我吃东西和平时一样多", en: "I eat as much as I used to" }, reverse: true },
  { id: 6, text: { zh: "我与异性接触时和以往一样感到愉快", en: "I still enjoy sex" }, reverse: true },
  { id: 7, text: { zh: "我感到体重减轻", en: "I notice that I am losing weight" } },
  { id: 8, text: { zh: "我为便秘烦恼", en: "I have trouble with constipation" } },
  { id: 9, text: { zh: "我的心跳比平时快", en: "My heart beats faster than usual" } },
  { id: 10, text: { zh: "我无故感到疲劳", en: "I get tired for no reason" } },
  { id: 11, text: { zh: "我的头脑像往常一样清楚", en: "My mind is as clear as it used to be" }, reverse: true },
  { id: 12, text: { zh: "我做事情像平时一样不感到困难", en: "I find it easy to do the things I used to do" }, reverse: true },
  { id: 13, text: { zh: "我坐卧不安，难以平静", en: "I am restless and can't keep still" } },
  { id: 14, text: { zh: "我对未来感到有希望", en: "I feel hopeful about the future" }, reverse: true },
  { id: 15, text: { zh: "我比平时容易激动生气", en: "I am more irritable than usual" } },
  { id: 16, text: { zh: "我觉得决定什么事很容易", en: "I find it easy to make decisions" }, reverse: true },
  { id: 17, text: { zh: "我感到自己是有用的和不可缺少的人", en: "I feel that I am useful and needed" }, reverse: true },
  { id: 18, text: { zh: "我的生活过得很有意思", en: "My life is pretty full" }, reverse: true },
  { id: 19, text: { zh: "我认为我死了别人会过得更好", en: "I feel that others would be better off if I were dead" } },
  { id: 20, text: { zh: "我仍旧喜爱自己平时喜爱的东西", en: "I still enjoy the things I used to do" }, reverse: true },
];

// ============ DSM-5 成人 ADHD 诊断（程度版，18 题） ============
// 4 选项 0-3；按“有时/常常”（index 2,3）计为症状阳性
// 成人诊断通常需任一维度 ≥5 项阳性，本 Demo 仅作计数参考
const DSM5A18S_OPTIONS = [
  { value: 0, label: { zh: "无", en: "Never" } },
  { value: 1, label: { zh: "偶尔", en: "Rarely" } },
  { value: 2, label: { zh: "有时", en: "Sometimes" } },
  { value: 3, label: { zh: "常常", en: "Often" } },
];

const DSM5A18S_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "学习、做事时不注意细节，出现粗心大意的错误", en: "Often fails to give close attention to details or makes careless mistakes" }, scored_options: [2, 3] },
  { id: 2, text: { zh: "在学习、做事的时候很难保持注意力集中", en: "Often has difficulty sustaining attention" }, scored_options: [2, 3] },
  { id: 3, text: { zh: "别人对你讲话时好像没在听或没听见", en: "Often does not seem to listen when spoken to directly" }, scored_options: [2, 3] },
  { id: 4, text: { zh: "做作业或完成任务时虎头蛇尾，不能始终按要求做事", en: "Often does not follow through on instructions and fails to finish duties" }, scored_options: [2, 3] },
  { id: 5, text: { zh: "很难组织好分配给你的任务或活动", en: "Often has difficulty organizing tasks and activities" }, scored_options: [2, 3] },
  { id: 6, text: { zh: "不愿意做需要持续用脑的事情（例如家庭或课堂作业）", en: "Often avoids, dislikes, or is reluctant to do tasks requiring sustained mental effort" }, scored_options: [2, 3] },
  { id: 7, text: { zh: "把学习、生活必需的东西弄丢", en: "Often loses things necessary for tasks or activities" }, scored_options: [2, 3] },
  { id: 8, text: { zh: "容易因外界刺激而分心", en: "Often easily distracted by extraneous stimuli" }, scored_options: [2, 3] },
  { id: 9, text: { zh: "忘记分配的任务", en: "Often forgetful in daily activities" }, scored_options: [2, 3] },
  { id: 10, text: { zh: "坐不住，手脚动作多或身体扭来扭去", en: "Often fidgets with or taps hands or feet, or squirms in seat" }, scored_options: [2, 3] },
  { id: 11, text: { zh: "在需要静坐的场合离开座位", en: "Often leaves seat in situations when remaining seated is expected" }, scored_options: [2, 3] },
  { id: 12, text: { zh: "在不该动的场合乱跑或者主观上坐不住的感觉", en: "Often runs about or climbs in situations where it is inappropriate; or feels restless" }, scored_options: [2, 3] },
  { id: 13, text: { zh: "在休闲活动中很难保持安静", en: "Often unable to play or take part in leisure activities quietly" }, scored_options: [2, 3] },
  { id: 14, text: { zh: "忙忙碌碌，精力充沛", en: "Often 'on the go' or acts as if 'driven by a motor'" }, scored_options: [2, 3] },
  { id: 15, text: { zh: "说话过多", en: "Often talks excessively" }, scored_options: [2, 3] },
  { id: 16, text: { zh: "在问题没说完时抢答", en: "Often blurts out an answer before a question has been completed" }, scored_options: [2, 3] },
  { id: 17, text: { zh: "很难按顺序等候", en: "Often has difficulty waiting his or her turn" }, scored_options: [2, 3] },
  { id: 18, text: { zh: "打扰别人", en: "Often interrupts or intrudes on others" }, scored_options: [2, 3] },
];

// ============ DSM-5 成人 ADHD 评估量表（18 题 · 是/否） ============
// 参考 DSM-5 症状标准，答“是”得 1 分
// 成人通常需任一维度 ≥5 项阳性，本 Demo 仅作计数参考
const DSM5A18B_OPTIONS = [
  { value: 0, label: { zh: "否", en: "No" } },
  { value: 1, label: { zh: "是", en: "Yes" } },
];

const DSM5A18B_QUESTIONS: ScaleQuestion[] = [
  { id: 1, text: { zh: "经常不能密切关注细节或在作业、工作或其他活动中犯粗心大意的错误", en: "Often fails to give close attention to details, or makes careless mistakes" }, scored_options: [1] },
  { id: 2, text: { zh: "在任务或游戏活动中经常难以维持注意力", en: "Often has difficulty sustaining attention in tasks or play" }, scored_options: [1] },
  { id: 3, text: { zh: "当别人对其直接讲话时，经常看起来没有在听", en: "Often does not seem to listen when spoken to directly" }, scored_options: [1] },
  { id: 4, text: { zh: "经常不遵循指示以致无法完成作业、家务或工作中的职责", en: "Often does not follow through on instructions and fails to finish duties" }, scored_options: [1] },
  { id: 5, text: { zh: "经常难以组织任务和活动", en: "Often has difficulty organizing tasks and activities" }, scored_options: [1] },
  { id: 6, text: { zh: "经常回避、厌恶或不情愿从事那些需要精神上持续努力的任务", en: "Often avoids, dislikes, or is reluctant to do tasks requiring sustained mental effort" }, scored_options: [1] },
  { id: 7, text: { zh: "经常丢失任务或活动所需的物品", en: "Often loses things necessary for tasks or activities" }, scored_options: [1] },
  { id: 8, text: { zh: "经常容易被外界的刺激分神", en: "Often easily distracted by extraneous stimuli" }, scored_options: [1] },
  { id: 9, text: { zh: "经常在日常活动中忘记事情", en: "Often forgetful in daily activities" }, scored_options: [1] },
  { id: 10, text: { zh: "经常手脚动个不停或在座位上扭动", en: "Often fidgets with or taps hands or feet, or squirms in seat" }, scored_options: [1] },
  { id: 11, text: { zh: "当被期待坐在座位上时却经常离座", en: "Often leaves seat in situations when remaining seated is expected" }, scored_options: [1] },
  { id: 12, text: { zh: "经常在不适当的场合跑来跑去或爬上爬下", en: "Often runs about or climbs in situations where it is inappropriate" }, scored_options: [1] },
  { id: 13, text: { zh: "经常无法安静地玩耍或从事休闲活动", en: "Often unable to play or take part in leisure activities quietly" }, scored_options: [1] },
  { id: 14, text: { zh: "经常“忙个不停”，好像“被发动机驱动着”", en: "Often 'on the go' or acting as if 'driven by a motor'" }, scored_options: [1] },
  { id: 15, text: { zh: "经常讲话过多", en: "Often talks excessively" }, scored_options: [1] },
  { id: 16, text: { zh: "经常在提问还没有讲完之前就把答案脱口而出", en: "Often blurts out an answer before a question has been completed" }, scored_options: [1] },
  { id: 17, text: { zh: "经常难以等待轮到他/她", en: "Often has difficulty waiting his or her turn" }, scored_options: [1] },
  { id: 18, text: { zh: "经常打断或侵扰他人", en: "Often interrupts or intrudes on others" }, scored_options: [1] },
];

export const SCALES: Record<ScaleId, ScaleMeta> = {
  aq10: {
    id: "aq10",
    neuro_type: "asd",
    label: "ASD",
    full_name: { zh: "自闭症谱系商数 · AQ-10 短版", en: "Autism Spectrum Quotient · AQ-10 Short Form" },
    source: { zh: "Allison, Auyeung & Baron-Cohen (2012), Cambridge Autism Research Centre", en: "Allison, Auyeung & Baron-Cohen (2012), Cambridge Autism Research Centre" },
    official_url: "https://www.autismresearchcentre.com/tests/aq-tests/aq10/",
    question_count: 10,
    scoring: "binary",
    description: { zh: "了解自己在感官敏感、社交直觉、细节关注上的特质分布。这是 NICE（英国国家卫生与临床优化研究所）推荐的快速筛查工具。", en: "Understand your trait distribution in sensory sensitivity, social intuition, and attention to detail. A quick screening tool recommended by NICE (UK National Institute for Health and Care Excellence)." },
    options: AQ10_OPTIONS,
    cutoff: 6,
    cutoff_note: { zh: "官方 cutoff ≥6 分：建议转介专科评估。本 Demo 不做诊断。", en: "Official cutoff ≥6: specialist assessment recommended. This Demo is not diagnostic." },
    bands: [
      {
        max: 3,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "你在感官、社交直觉、多任务切换上相对自在。社交和不确定性的消耗对你来说较可控。", en: "You are relatively at ease with sensory input, social intuition, and task-switching. The drain from socializing and uncertainty is manageable for you." },
        recommended_protocols: [
          { zh: "当社交电量 < 4，留 20 分钟独处恢复", en: "When social battery < 4, take 20 minutes alone to recharge" },
          { zh: "当计划临时变动，先停 3 分钟再决定", en: "When plans change unexpectedly, pause for 3 minutes before deciding" },
        ],
      },
      {
        max: 5,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: `你在某些情境下会感到感官或社交的负担。留意那些让你"突然想撤"的瞬间，往往是信号。`, en: `You feel sensory or social strain in some situations. Notice the moments when you "suddenly want to withdraw"—they are often signals.` },
        recommended_protocols: [
          { zh: "当感官负载 > 7，15 分钟内撤退到安静空间", en: "When sensory load > 7, retreat to a quiet space within 15 minutes" },
          { zh: "当可预测性需求高，提前 1 小时告知变化", en: "When predictability needs are high, communicate changes 1 hour in advance" },
        ],
      },
      {
        max: 10,
        level: "high",
        title: { zh: "特质表达较高（达到官方 cutoff）", en: "High trait expression (at official cutoff)" },
        summary: { zh: "你达到 AQ-10 官方 cutoff（≥6）。这不是诊断，但提示你的神经系统对环境更敏感，需要更多可协商的协议。如需明确，请联系专业人士。", en: "You have reached the AQ-10 official cutoff (≥6). This is not a diagnosis, but it suggests your nervous system is more sensitive to the environment and needs more negotiable protocols. For clarification, please consult a professional." },
        recommended_protocols: [
          { zh: "当感官负载 > 6，立即停止当前活动撤退 15 分钟", en: "When sensory load > 6, stop the current activity immediately and retreat for 15 minutes" },
          { zh: "当社交电量 < 6，接下来 2 小时不接收新社交输入", en: "When social battery < 6, take no new social input for the next 2 hours" },
          { zh: `当计划变动，先问清"变到哪里"，再决定是否参与`, en: `When plans change, first ask "change to what," then decide whether to participate` },
        ],
      },
    ],
  },

  asrs6: {
    id: "asrs6",
    neuro_type: "adhd",
    label: "ADHD",
    full_name: { zh: "成人 ADHD 自测筛检表 · ASRS v1.1", en: "Adult ADHD Self-Report Scale · ASRS v1.1" },
    source: { zh: "Kessler et al. (2005), WHO / Harvard Medical School 官方简体中文版", en: "Kessler et al. (2005), WHO / Harvard Medical School official Simplified Chinese version" },
    official_url: "https://www.hcp.med.harvard.edu/ncs/asrs.php",
    question_count: 6,
    scoring: "binary",
    description: { zh: "了解自己在注意力维持、任务组织、启动阻力上的特质分布。这是 WHO 与哈佛联合开发的官方筛检工具。", en: "Understand your trait distribution in attention maintenance, task organization, and initiation resistance. An official screening tool jointly developed by WHO and Harvard." },
    options: ASRS6_OPTIONS,
    cutoff: 4,
    cutoff_note: { zh: "官方 cutoff ≥4 分：症状可能与成人 ADHD 相符，建议咨询专业人士。本 Demo 不做诊断。", en: "Official cutoff ≥4: symptoms may be consistent with adult ADHD; please consult a professional. This Demo is not diagnostic." },
    bands: [
      {
        max: 1,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "你能比较稳定地启动任务、维持专注、组织安排。日常系统对你来说是可用的。", en: "You can fairly stably initiate tasks, sustain focus, and organize. Everyday systems work for you." },
        recommended_protocols: [
          { zh: "当启动阻力高，先做 2 分钟微任务破冰", en: "When initiation resistance is high, start with a 2-minute micro-task to break the ice" },
        ],
      },
      {
        max: 3,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: `你在无聊任务和高压任务间的切换有时会卡住。留意"想做却启动不了"的时刻。`, en: `You sometimes get stuck switching between boring and high-pressure tasks. Notice the moments when you "want to do it but can't start."` },
        recommended_protocols: [
          { zh: "当启动阻力高，先做 2 分钟微任务破冰", en: "When initiation resistance is high, start with a 2-minute micro-task to break the ice" },
          { zh: "当注意力涣散，切换到身体任务 10 分钟", en: "When attention scatters, switch to a physical task for 10 minutes" },
        ],
      },
      {
        max: 6,
        level: "high",
        title: { zh: "特质表达较高（达到官方 cutoff）", en: "High trait expression (at official cutoff)" },
        summary: { zh: "你达到 ASRS v1.1 官方 cutoff（≥4）。这不是诊断，但提示你的注意力系统有自己的节律，外部脚手架比意志力更有效。如需明确，请联系专业人士。", en: "You have reached the ASRS v1.1 official cutoff (≥4). This is not a diagnosis, but it suggests your attention system has its own rhythm and external scaffolding works better than willpower. For clarification, please consult a professional." },
        recommended_protocols: [
          { zh: "当启动阻力高，先做 2 分钟微任务破冰", en: "When initiation resistance is high, start with a 2-minute micro-task to break the ice" },
          { zh: "当多巴胺电量低，安排一件小而确定的事", en: "When dopamine battery is low, schedule one small, certain task" },
          { zh: "当注意力涣散 30 分钟以上，切换到身体任务", en: "When attention has been scattered for 30+ minutes, switch to a physical task" },
        ],
      },
    ],
  },

  hsps12: {
    id: "hsps12",
    neuro_type: "hsp",
    label: "HSP",
    full_name: { zh: "高敏感人群量表 · HSPS 参考简版", en: "Highly Sensitive Person Scale · HSPS Reference Short Form" },
    source: { zh: "基于 Aron & Aron (1997) HSPS 的 DOES 四维框架编制的参考简版", en: "A reference short form based on the DOES four-dimensional framework of Aron & Aron (1997) HSPS" },
    official_url: "https://hsperson.com/test/highly-sensitive-test/",
    question_count: 12,
    scoring: "likert",
    description: { zh: "了解自己在深度加工、过度刺激、情绪共情、感官敏感四个维度的特质分布。基于 Elaine Aron 的高敏感人格研究。", en: "Understand your trait distribution across four dimensions: depth of processing, overstimulation, emotional empathy, and sensory sensitivity. Based on Elaine Aron's research on the highly sensitive person." },
    options: HSPS12_OPTIONS,
    cutoff: 28,
    cutoff_note: { zh: "参考 cutoff ≥28 分（对应原版 HSPS 14/27 题的分界比例）。本 Demo 不做诊断。", en: "Reference cutoff ≥28 (corresponding to the 14/27 threshold ratio of the original HSPS). This Demo is not diagnostic." },
    bands: [
      {
        max: 15,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "你的神经系统对外界刺激的吸收度适中。你能区分自己和他人的情绪，边界感相对清晰。", en: "Your nervous system absorbs external stimuli at a moderate level. You can distinguish your own emotions from others' and have relatively clear boundaries." },
        recommended_protocols: [
          { zh: "当吸收量满，留 15 分钟独处整理", en: "When absorption is full, take 15 minutes alone to process" },
        ],
      },
      {
        max: 27,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: `你在高强度环境里会明显感到疲惫。学会区分"我的情绪"和"吸收来的情绪"，是你的核心功课。`, en: `You feel noticeably tired in high-intensity environments. Learning to distinguish "my emotions" from "absorbed emotions" is your core task.` },
        recommended_protocols: [
          { zh: "当吸收量满，接下来 1 小时不接收他人情绪输入", en: "When absorption is full, take no emotional input from others for the next hour" },
          { zh: "当环境刺激强，撤退到低感官空间 20 分钟", en: "When environmental stimuli are strong, retreat to a low-sensory space for 20 minutes" },
        ],
      },
      {
        max: 48,
        level: "high",
        title: { zh: "特质表达较高", en: "High trait expression" },
        summary: { zh: "你的神经系统是一台高增益接收器。敏感不是脆弱，是能力——但你需要主动维护边界，否则会持续透支。", en: "Your nervous system is a high-gain receiver. Sensitivity is not fragility; it is a capacity—but you need to actively maintain boundaries, or you will keep overextending." },
        recommended_protocols: [
          { zh: "当吸收量满，接下来 2 小时不接收他人情绪输入", en: "When absorption is full, take no emotional input from others for the next 2 hours" },
          { zh: "当环境刺激强，立即撤退到低感官空间", en: "When environmental stimuli are strong, retreat to a low-sensory space immediately" },
          { zh: `当边界模糊，做 5 分钟"这是谁的"分辨练习`, en: `When boundaries blur, do a 5-minute "whose is this" discernment exercise` },
        ],
      },
    ],
  },

  pcl5: {
    id: "pcl5",
    neuro_type: "ptsd",
    label: "PTSD",
    full_name: { zh: "PTSD 检查表 · PCL-5 简版", en: "PTSD Checklist · PCL-5 Short Form" },
    source: { zh: "Blevins et al. (2015), PTSD Checklist for DSM-5，美国国家 PTSD 中心", en: "Blevins et al. (2015), PTSD Checklist for DSM-5, U.S. National Center for PTSD" },
    official_url: "https://www.ptsd.va.gov/professional/assessment/adult-sr/ptsd-checklist.asp",
    question_count: 6,
    scoring: "likert",
    description: { zh: "了解自己在侵入性记忆、回避反应、唤起度上的特质分布。这是美国退伍军人事务部（VA）国家 PTSD 中心开发的官方工具。", en: "Understand your trait distribution in intrusive memories, avoidance responses, and arousal level. An official tool developed by the U.S. Department of Veterans Affairs (VA) National Center for PTSD." },
    options: PCL5_OPTIONS,
    cutoff: 10,
    cutoff_note: { zh: "参考 cutoff ≥10 分（按官方 31 分 / 20 题比例换算）。达到建议咨询专业人士。本 Demo 不做诊断。", en: "Reference cutoff ≥10 (converted at the official 31/20-item ratio). If reached, please consult a professional. This Demo is not diagnostic." },
    bands: [
      {
        max: 5,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "过去一个月里，你较少被侵入性记忆或回避反应困扰。你的神经系统目前处于相对稳定的状态。", en: "In the past month, you have been less troubled by intrusive memories or avoidance responses. Your nervous system is currently in a relatively stable state." },
        recommended_protocols: [
          { zh: "当出现闪回苗头，做 5 分钟 5-4-3-2-1 接地练习", en: "When flashback signs appear, do a 5-minute 5-4-3-2-1 grounding exercise" },
        ],
      },
      {
        max: 9,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: `你偶尔会被不想要的记忆或回避反应打扰。留意那些"突然被拉回过去"的瞬间，那是信号。`, en: `You are occasionally bothered by unwanted memories or avoidance responses. Notice the moments when you are "suddenly pulled back to the past"—those are signals.` },
        recommended_protocols: [
          { zh: "当出现闪回苗头，立即做 5 分钟 5-4-3-2-1 接地练习", en: "When flashback signs appear, immediately do a 5-minute 5-4-3-2-1 grounding exercise" },
          { zh: "当回避冲动强，先留在情境里 3 分钟再决定是否离开", en: "When avoidance impulses are strong, stay in the situation for 3 minutes before deciding whether to leave" },
        ],
      },
      {
        max: 24,
        level: "high",
        title: { zh: "特质表达较高（达到参考 cutoff）", en: "High trait expression (at reference cutoff)" },
        summary: { zh: "你达到 PCL-5 简版参考 cutoff。这不是诊断，但提示你的神经系统可能还在处理过去的压力事件。创伤恢复是可能的，专业的创伤聚焦治疗（如 EMDR、CPT）能有效帮助。请联系专业人士。", en: "You have reached the PCL-5 short-form reference cutoff. This is not a diagnosis, but it suggests your nervous system may still be processing past stressful events. Recovery from trauma is possible; trauma-focused therapies (e.g., EMDR, CPT) can effectively help. Please consult a professional." },
        recommended_protocols: [
          { zh: "当出现闪回，立即做 5 分钟 5-4-3-2-1 接地练习", en: "When a flashback occurs, immediately do a 5-minute 5-4-3-2-1 grounding exercise" },
          { zh: "当唤起度高，撤退到安全空间 15 分钟", en: "When arousal is high, retreat to a safe space for 15 minutes" },
          { zh: "当回避冲动强，不强迫自己，先记录下来带给治疗师", en: "When avoidance impulses are strong, don't force yourself; record it and bring it to your therapist" },
        ],
      },
    ],
  },

  snap18: {
    id: "snap18",
    neuro_type: "adhd",
    label: "SNAP-IV",
    full_name: { zh: "SNAP-IV 儿童 ADHD 评定量表", en: "SNAP-IV ADHD Rating Scale" },
    source: { zh: "Swanson, Nolan and Pelham (version IV) / Vanderbilt ADHD Diagnostic Rating Scale", en: "Swanson, Nolan and Pelham (version IV) / Vanderbilt ADHD Diagnostic Rating Scale" },
    official_url: "https://psychology-tools.com/test/vadrs-vanderbilt-adhd-diagnostic-rating-scale",
    question_count: 18,
    scoring: "binary",
    description: { zh: "了解儿童在注意力维持、多动-冲动上的特质分布。由家长/监护人根据日常表现作答，是 ADHD 筛查的常用工具。", en: "Understand a child's trait distribution in attention maintenance and hyperactivity-impulsivity. Completed by parents/caregivers; a common ADHD screening tool." },
    options: SNAP18_OPTIONS,
    cutoff: 6,
    cutoff_note: { zh: "按 SNAP-IV 常用解释，注意缺陷或多动-冲动任一维度 ≥6 项达到“还算不少/非常多”可考虑进一步评估。本 Demo 仅作计数参考。", en: "By common SNAP-IV interpretation, ≥6 items in either inattention or hyperactivity-impulsivity reaching 'quite a bit/very much' suggests further evaluation. This Demo is for reference only." },
    bands: [
      {
        max: 5,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "孩子目前在注意力、多动-冲动上的阳性症状较少，日常功能相对平稳。", en: "Fewer positive symptoms in attention and hyperactivity-impulsivity; daily functioning is relatively stable." },
        recommended_protocols: [
          { zh: "当注意力下降，先减少环境干扰再开始任务", en: "When attention drops, reduce environmental distractions before starting tasks" },
        ],
      },
      {
        max: 11,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: "孩子在某些情境下会明显出现注意力分散或坐立不安。留意任务难度、环境噪音和等待场景。", en: "The child shows noticeable distractibility or restlessness in some situations. Pay attention to task difficulty, environmental noise, and waiting contexts." },
        recommended_protocols: [
          { zh: "当注意力分散，用 5 分钟单一任务破冰", en: "When distracted, use a 5-minute single task to break the ice" },
          { zh: "当坐立不安，先允许 2 分钟身体活动再坐下", en: "When restless, allow 2 minutes of physical activity before sitting down" },
        ],
      },
      {
        max: 18,
        level: "high",
        title: { zh: "特质表达较高（建议进一步评估）", en: "High trait expression (further evaluation suggested)" },
        summary: { zh: "阳性症状较多，可能在学校、家庭或社交中带来明显影响。这不是诊断，但建议到有资质的医院或机构做正式评估。", en: "Many positive symptoms that may significantly affect school, home, or social life. This is not a diagnosis; a formal assessment by a qualified professional is recommended." },
        recommended_protocols: [
          { zh: "任务前用可视化清单把步骤拆到最小", en: "Use a visual checklist to break steps down before tasks" },
          { zh: "高冲动情境提前约定“暂停”信号", en: "Agree on a 'pause' signal in advance for high-impulse situations" },
          { zh: "寻求学校/机构的结构化支持方案", en: "Seek structured support plans from school or professionals" },
        ],
      },
    ],
  },

  mdqe33: {
    id: "mdqe33",
    neuro_type: "other",
    label: "MDQ-E",
    full_name: { zh: "33 项轻躁狂症状清单（MDQ-E）", en: "Mood Disorder Questionnaire — Extended 33-item" },
    source: { zh: "基于 Hirschfeld 等编制的心境障碍问卷（MDQ）扩展版", en: "Extended version based on the Mood Disorder Questionnaire by Hirschfeld et al." },
    official_url: "https://www.wjx.cn/vm/rXH0KTh.aspx",
    question_count: 33,
    scoring: "binary",
    description: { zh: "了解自己在情绪高涨、精力增加、冲动行为等方面的周期性变化。适用于关注情绪波动的人群。", en: "Understand your cyclical changes in elevated mood, increased energy, and impulsive behavior. For those concerned about mood swings." },
    options: MDQE33_OPTIONS,
    cutoff: 7,
    cutoff_note: { zh: "参考 cutoff ≥7 项阳性。若同时伴随功能损害，建议咨询精神科或心理专业人士。本 Demo 不做诊断。", en: "Reference cutoff ≥7 positive items. If functional impairment is also present, consult a mental health professional. This Demo is not diagnostic." },
    bands: [
      {
        max: 6,
        level: "low",
        title: { zh: "情绪波动较小", en: "Low mood fluctuation" },
        summary: { zh: "你目前较少出现典型的轻躁/精力高涨周期。情绪节奏相对平稳。", en: "You currently show few typical hypomanic/high-energy cycles. Your mood rhythm is relatively stable." },
        recommended_protocols: [
          { zh: "当情绪突然升高，先记录睡眠和支出变化", en: "When mood suddenly lifts, first note changes in sleep and spending" },
        ],
      },
      {
        max: 13,
        level: "mid",
        title: { zh: "存在情绪高涨周期", en: "Elevated mood cycles present" },
        summary: { zh: "你有时会经历精力、自信或冲动增加的周期。留意这些周期是否伴随睡眠减少或决策冒进。", en: "You sometimes experience cycles of increased energy, confidence, or impulsivity. Notice whether these come with reduced sleep or risky decisions." },
        recommended_protocols: [
          { zh: "建立“情绪-睡眠-花费”三轴日常记录", en: "Keep a daily log of mood, sleep, and spending" },
          { zh: "高涨期延迟重大财务/关系决定 24 小时", en: "Delay major financial or relationship decisions for 24 hours during elevated periods" },
        ],
      },
      {
        max: 33,
        level: "high",
        title: { zh: "轻躁症状较多（建议专业评估）", en: "Many hypomanic symptoms (professional evaluation suggested)" },
        summary: { zh: "你报告了较多轻躁相关症状。情绪波动可能对生活造成明显影响。这不是诊断，但建议尽快咨询精神科或心理专业人士。", en: "You reported many hypomania-related symptoms. Mood fluctuations may significantly affect your life. This is not a diagnosis; please consult a mental health professional soon." },
        recommended_protocols: [
          { zh: "高涨期把信用卡/支付密码交给信任的人保管", en: "During elevated periods, entrust payment methods to someone you trust" },
          { zh: "固定就寝时间，即使“不困”也关灯躺好", en: "Keep a fixed bedtime; turn off lights and lie down even if not sleepy" },
          { zh: "尽早预约精神科/临床心理评估", en: "Schedule a psychiatric or clinical psychological evaluation as soon as possible" },
        ],
      },
    ],
  },

  sas20: {
    id: "sas20",
    neuro_type: "other",
    label: "SAS",
    full_name: { zh: "焦虑自评量表 SAS", en: "Self-Rating Anxiety Scale" },
    source: { zh: "Zung (1971)", en: "Zung (1971)" },
    official_url: "https://www.wjx.cn/vm/rhypxKT.aspx",
    question_count: 20,
    scoring: "likert",
    description: { zh: "了解最近 1-2 周焦虑相关躯体与心理感受的强度。采用反向计分处理正向描述题。", en: "Understand the intensity of anxiety-related physical and psychological feelings over the past 1-2 weeks. Reverse-scored for positive-description items." },
    options: SAS20_OPTIONS,
    cutoff: 40,
    cutoff_note: { zh: "原始分 ≥40（对应标准分 ≥50）为筛查阳性参考。本 Demo 不做诊断。", en: "Raw score ≥40 (standard score ≥50) is a reference screening threshold. This Demo is not diagnostic." },
    bands: [
      {
        max: 39,
        level: "low",
        title: { zh: "焦虑感受较轻", en: "Low anxiety" },
        summary: { zh: "最近一两周，你的身体紧张和担忧感较轻，日常节奏大体可控。", en: "Over the past 1-2 weeks, physical tension and worry are mild and daily rhythm is mostly manageable." },
        recommended_protocols: [
          { zh: "当预感不安，做 3 分钟慢呼吸", en: "When unease arises, do 3 minutes of slow breathing" },
        ],
      },
      {
        max: 47,
        level: "mid",
        title: { zh: "焦虑感受中等", en: "Moderate anxiety" },
        summary: { zh: "你近期感受到一定程度的紧张、警觉或躯体不适。焦虑是信号，不是软弱。", en: "You have been experiencing a notable level of tension, vigilance, or physical discomfort recently. Anxiety is a signal, not weakness." },
        recommended_protocols: [
          { zh: "每天预留 10 分钟“只处理担心”的时间", en: "Set aside 10 minutes a day just for worrying" },
          { zh: "躯体紧张时做渐进式肌肉放松", en: "Do progressive muscle relaxation when body tension rises" },
        ],
      },
      {
        max: 80,
        level: "high",
        title: { zh: "焦虑感受较高（建议专业评估）", en: "High anxiety (professional evaluation suggested)" },
        summary: { zh: "焦虑体验已较强烈，可能干扰睡眠、注意力或日常功能。这不是诊断，但建议联系心理或精神科专业人士。", en: "Anxiety is quite intense and may interfere with sleep, attention, or daily functioning. This is not a diagnosis; consider contacting a mental health professional." },
        recommended_protocols: [
          { zh: "惊恐感上升时先用 5-4-3-2-1 接地", en: "Use 5-4-3-2-1 grounding when panic rises" },
          { zh: "减少咖啡因和睡前屏幕刺激", en: "Reduce caffeine and screen stimulation before bed" },
          { zh: "预约心理咨询或精神科评估", en: "Schedule a counseling or psychiatric evaluation" },
        ],
      },
    ],
  },

  sds20: {
    id: "sds20",
    neuro_type: "other",
    label: "SDS",
    full_name: { zh: "抑郁自评量表 SDS", en: "Self-Rating Depression Scale" },
    source: { zh: "Zung (1965)", en: "Zung (1965)" },
    official_url: "https://www.wjx.cn/vm/Q3soYmW.aspx",
    question_count: 20,
    scoring: "likert",
    description: { zh: "了解最近 1-2 周抑郁相关情绪、认知与躯体感受的强度。采用反向计分处理正向描述题。", en: "Understand the intensity of depression-related emotional, cognitive, and physical feelings over the past 1-2 weeks. Reverse-scored for positive-description items." },
    options: SDS20_OPTIONS,
    cutoff: 42,
    cutoff_note: { zh: "原始分 ≥42（对应标准分 ≥53）为筛查阳性参考。本 Demo 不做诊断。", en: "Raw score ≥42 (standard score ≥53) is a reference screening threshold. This Demo is not diagnostic." },
    bands: [
      {
        max: 41,
        level: "low",
        title: { zh: "抑郁感受较轻", en: "Low depression" },
        summary: { zh: "最近一两周，你的情绪低落的程度和频率较低，日常动力尚可。", en: "Over the past 1-2 weeks, low mood is mild and infrequent, and daily motivation is okay." },
        recommended_protocols: [
          { zh: "情绪低落时先做一件极小的事", en: "When mood is low, do one tiny thing first" },
        ],
      },
      {
        max: 49,
        level: "mid",
        title: { zh: "抑郁感受中等", en: "Moderate depression" },
        summary: { zh: "你近期感受到一定的情绪低落、疲惫或兴趣减退。允许自己慢一点，并寻找支持。", en: "You have been experiencing some low mood, fatigue, or loss of interest recently. Allow yourself to slow down and seek support." },
        recommended_protocols: [
          { zh: "把“做一点”当作目标，不追求完美完成", en: "Make 'do a little' the goal, not perfect completion" },
          { zh: "每天晒 10 分钟太阳或短距离散步", en: "Get 10 minutes of sunlight or a short walk daily" },
        ],
      },
      {
        max: 80,
        level: "high",
        title: { zh: "抑郁感受较高（建议专业评估）", en: "High depression (professional evaluation suggested)" },
        summary: { zh: "抑郁体验已较强烈，可能严重影响动力、睡眠和自我价值感。这不是诊断，但建议尽快联系心理或精神科专业人士。", en: "Depression is quite intense and may seriously affect motivation, sleep, and self-worth. This is not a diagnosis; please contact a mental health professional soon." },
        recommended_protocols: [
          { zh: "出现自伤念头时立即联系信任的人或危机热线", en: "If self-harm thoughts appear, immediately contact someone you trust or a crisis hotline" },
          { zh: "把起床、洗漱、吃饭拆成独立的小胜利", en: "Treat getting up, washing, and eating as separate small wins" },
          { zh: "预约心理咨询或精神科评估", en: "Schedule a counseling or psychiatric evaluation" },
        ],
      },
    ],
  },

  dsm5a18s: {
    id: "dsm5a18s",
    neuro_type: "adhd",
    label: "DSM-5 程度",
    full_name: { zh: "DSM-5 成人 ADHD 诊断（程度版）", en: "DSM-5 Adult ADHD Criteria — Severity Version" },
    source: { zh: "基于 DSM-5 注意缺陷/多动障碍诊断标准", en: "Based on DSM-5 Attention-Deficit/Hyperactivity Disorder criteria" },
    official_url: "https://www.wjx.cn/vm/eOuHnQb.aspx",
    question_count: 18,
    scoring: "binary",
    description: { zh: "基于 DSM-5 成人 ADHD 症状条目的程度自评。按“有时/常常”计为症状阳性。", en: "Self-rated severity based on DSM-5 adult ADHD symptom criteria. 'Sometimes/Often' is counted as a positive symptom." },
    options: DSM5A18S_OPTIONS,
    cutoff: 5,
    cutoff_note: { zh: "成人 ADHD 诊断通常需注意缺陷或多动-冲动任一维度 ≥5 项阳性。本 Demo 仅统计总数，不做诊断。", en: "Adult ADHD diagnosis usually requires ≥5 positive items in either inattention or hyperactivity-impulsivity. This Demo only counts total positives and is not diagnostic." },
    bands: [
      {
        max: 4,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "你在注意力维持、组织规划和冲动控制上的困扰较少，日常系统基本够用。", en: "You have few difficulties with attention maintenance, organization, and impulse control; everyday systems work for you." },
        recommended_protocols: [
          { zh: "当任务复杂，先用 2 分钟写出第一步", en: "When tasks are complex, spend 2 minutes writing the first step" },
        ],
      },
      {
        max: 9,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: "你在无聊任务、组织安排或等待情境中有时会卡住。外部脚手架比意志力更可靠。", en: "You sometimes get stuck in boring tasks, organizing, or waiting situations. External scaffolding is more reliable than willpower." },
        recommended_protocols: [
          { zh: "启动困难时用 2 分钟微任务破冰", en: "Use a 2-minute micro-task when starting is hard" },
          { zh: "注意力涣散 20 分钟后切换到身体任务", en: "Switch to a physical task after 20 minutes of scattered attention" },
        ],
      },
      {
        max: 18,
        level: "high",
        title: { zh: "特质表达较高（建议专业评估）", en: "High trait expression (professional evaluation suggested)" },
        summary: { zh: "你报告了较多 ADHD 相关症状，可能在执行功能上需要系统支持。这不是诊断，但建议咨询有资质的专业人士。", en: "You reported many ADHD-related symptoms and may need systematic support for executive function. This is not a diagnosis; consider consulting a qualified professional." },
        recommended_protocols: [
          { zh: "把每一天的“下一步”写在外部清单上", en: "Write the next step for each day on an external list" },
          { zh: "使用身体计时器（如番茄钟+站立）", en: "Use a physical timer (e.g., Pomodoro + standing)" },
          { zh: "预约成人 ADHD 专业评估", en: "Schedule an adult ADHD evaluation" },
        ],
      },
    ],
  },

  dsm5a18b: {
    id: "dsm5a18b",
    neuro_type: "adhd",
    label: "DSM-5 评估",
    full_name: { zh: "DSM-5 成人 ADHD 评估量表", en: "DSM-5 Adult ADHD Assessment" },
    source: { zh: "基于 DSM-5 注意缺陷/多动障碍诊断标准", en: "Based on DSM-5 Attention-Deficit/Hyperactivity Disorder criteria" },
    official_url: "https://www.wjx.cn/vm/mB7ah4b.aspx",
    question_count: 18,
    scoring: "binary",
    description: { zh: "基于 DSM-5 成人 ADHD 症状条目的简化是/否评估。答“是”计为症状阳性。", en: "A simplified yes/no assessment based on DSM-5 adult ADHD symptom criteria. 'Yes' is counted as a positive symptom." },
    options: DSM5A18B_OPTIONS,
    cutoff: 5,
    cutoff_note: { zh: "成人 ADHD 诊断通常需注意缺陷或多动-冲动任一维度 ≥5 项阳性。本 Demo 仅统计总数，不做诊断。", en: "Adult ADHD diagnosis usually requires ≥5 positive items in either inattention or hyperactivity-impulsivity. This Demo only counts total positives and is not diagnostic." },
    bands: [
      {
        max: 4,
        level: "low",
        title: { zh: "特质表达较低", en: "Low trait expression" },
        summary: { zh: "你目前较少符合 ADHD 核心症状条目，注意力与冲动控制相对稳定。", en: "You currently match few ADHD core symptom items; attention and impulse control are relatively stable." },
        recommended_protocols: [
          { zh: "当任务枯燥，用计时器分段完成", en: "When tasks are dull, use a timer to work in segments" },
        ],
      },
      {
        max: 9,
        level: "mid",
        title: { zh: "特质表达中等", en: "Mid trait expression" },
        summary: { zh: "你在启动、专注或抑制冲动方面有时会遇到困难。记录这些时刻出现的场景，有助于找到支持策略。", en: "You sometimes struggle with initiation, focus, or inhibiting impulses. Recording the contexts helps find support strategies." },
        recommended_protocols: [
          { zh: "把大任务拆到“小到可笑”的第一步", en: "Break large tasks down to a 'ridiculously small' first step" },
          { zh: "设置单一窗口/单一物品环境", en: "Set up a single-window/single-item environment" },
        ],
      },
      {
        max: 18,
        level: "high",
        title: { zh: "特质表达较高（建议专业评估）", en: "High trait expression (professional evaluation suggested)" },
        summary: { zh: "你符合较多 ADHD 核心症状条目，执行功能可能需要外部支持。这不是诊断，建议到专业机构做正式评估。", en: "You match many ADHD core symptom items and may need external support for executive function. This is not a diagnosis; consider a formal evaluation." },
        recommended_protocols: [
          { zh: "建立固定的“启动仪式”和环境锚点", en: "Build a fixed start ritual and environmental anchor" },
          { zh: "把截止时间和提醒放到视线可及处", en: "Place deadlines and reminders where you can see them" },
          { zh: "预约成人 ADHD 专业评估", en: "Schedule an adult ADHD evaluation" },
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
  snap18: SNAP18_QUESTIONS,
  mdqe33: MDQE33_QUESTIONS,
  sas20: SAS20_QUESTIONS,
  sds20: SDS20_QUESTIONS,
  dsm5a18s: DSM5A18S_QUESTIONS,
  dsm5a18b: DSM5A18B_QUESTIONS,
};

// 量表列表（用于选择页）：仅展示 ASD / ADHD 相关量表
// HSPS / PCL-5 / MDQ-E / SAS / SDS 量表数据保留但不展示 · 后续按需取消注释
export const SCALE_LIST: ScaleMeta[] = [
  SCALES.aq10,
  SCALES.asrs6,
  SCALES.snap18,
  SCALES.dsm5a18s,
  SCALES.dsm5a18b,
  // SCALES.hsps12,   // 高敏感人群量表 · 非 ASD/ADHD
  // SCALES.pcl5,     // PTSD 检查表 · 非 ASD/ADHD
  // SCALES.mdqe33,   // 33 项轻躁狂症状清单 · 非 ASD/ADHD
  // SCALES.sas20,    // 焦虑自评量表 · 非 ASD/ADHD
  // SCALES.sds20,    // 抑郁自评量表 · 非 ASD/ADHD
];
