import type { ClimateType, LocalText, NeuroType, WeatherSnapshot } from "@/types";
import { getAxisProfile, toStrain } from "@/lib/axisConfig";

// 气候类型映射（PRD §09：气候类型非好坏）
// 基础版本（通用），按特质分化的版本在 CLIMATE_MAP_BY_TYPE
export const CLIMATE_MAP: Record<
  ClimateType,
  { label: LocalText; description: LocalText; suitable: LocalText[]; unsuitable: LocalText[] }
> = {
  stuffy_rain: {
    label: { zh: "闷热待雨", en: "Stuffy, pre-rain" },
    description: { zh: "气压升高中，预计 30 分钟后接近临界点", en: "Pressure is rising; nearing critical point in ~30 minutes" },
    suitable: [
      { zh: "低感官活动", en: "Low-sensory activities" },
      { zh: "安静空间", en: "Quiet space" },
      { zh: "独处休息", en: "Solo rest" },
    ],
    unsuitable: [
      { zh: "嘈杂环境", en: "Noisy environments" },
      { zh: "重要决策", en: "Important decisions" },
      { zh: "高强度社交", en: "High-intensity socializing" },
    ],
  },
  clear_breeze: {
    label: { zh: "晴朗微风", en: "Clear breeze" },
    description: { zh: "状态稳定舒适，适合做需要专注的事", en: "Stable and comfortable; good for focused work" },
    suitable: [
      { zh: "专注工作", en: "Focused work" },
      { zh: "适度社交", en: "Moderate socializing" },
      { zh: "做决定", en: "Making decisions" },
    ],
    unsuitable: [],
  },
  warm_fog: {
    label: { zh: "暖雾弥漫", en: "Warm fog" },
    description: { zh: "执行功能有些模糊，启动任务可能困难", en: "Executive function is a bit hazy; task initiation may be hard" },
    suitable: [
      { zh: "微任务破冰", en: "Micro-task warm-up" },
      { zh: "低压力活动", en: "Low-pressure activities" },
      { zh: "减少选择", en: "Reduce choices" },
    ],
    unsuitable: [
      { zh: "复杂决策", en: "Complex decisions" },
      { zh: "多线程任务", en: "Multi-threaded tasks" },
    ],
  },
  storm_warning: {
    label: { zh: "雷暴预警", en: "Storm warning" },
    description: { zh: "接近临界点，建议立即执行撤退协议", en: "Nearing critical point; run a retreat protocol now" },
    suitable: [
      { zh: "撤退到安全空间", en: "Retreat to a safe space" },
      { zh: "降低一切输入", en: "Reduce all input" },
      { zh: "暂停社交", en: "Pause social contact" },
    ],
    unsuitable: [
      { zh: "嘈杂环境", en: "Noisy environments" },
      { zh: "重要决策", en: "Important decisions" },
      { zh: "持续忍耐", en: "Pushing through" },
    ],
  },
};

// 按特质分化的气候文案
// ASD 侧重感官解读，ADHD 侧重执行功能解读
const CLIMATE_MAP_BY_TYPE: Partial<Record<NeuroType, Partial<Record<ClimateType, {
  description: LocalText;
  suitable: LocalText[];
  unsuitable: LocalText[];
}>>>> = {
  asd: {
    stuffy_rain: {
      description: { zh: "感官气压在升高，环境输入正在累积", en: "Sensory pressure is rising; environmental input is accumulating" },
      suitable: [
        { zh: "低感官活动", en: "Low-sensory activities" },
        { zh: "安静空间", en: "Quiet space" },
        { zh: "独处休息", en: "Solo rest" },
        { zh: "降噪耳机", en: "Noise-canceling headphones" },
      ],
      unsuitable: [
        { zh: "嘈杂环境", en: "Noisy environments" },
        { zh: "强光场所", en: "Bright-light venues" },
        { zh: "重要决策", en: "Important decisions" },
        { zh: "高强度社交", en: "High-intensity socializing" },
      ],
    },
    warm_fog: {
      description: { zh: "感官预算开始模糊，对环境的耐受在下降", en: "Sensory budget is blurring; environmental tolerance is dropping" },
      suitable: [
        { zh: "低感官活动", en: "Low-sensory activities" },
        { zh: "熟悉环境", en: "Familiar environments" },
        { zh: "减少刺激源", en: "Reduce stimuli" },
      ],
      unsuitable: [
        { zh: "新环境", en: "New environments" },
        { zh: "多线程任务", en: "Multi-threaded tasks" },
        { zh: "强感官刺激", en: "Intense sensory input" },
      ],
    },
    storm_warning: {
      description: { zh: "感官负荷接近临界，需要立即降载", en: "Sensory load is near critical; reduce load immediately" },
      suitable: [
        { zh: "撤退到安全空间", en: "Retreat to a safe space" },
        { zh: "降噪隔离", en: "Noise isolation" },
        { zh: "减少一切输入", en: "Reduce all input" },
      ],
      unsuitable: [
        { zh: "嘈杂环境", en: "Noisy environments" },
        { zh: "社交场合", en: "Social gatherings" },
        { zh: "强光强声", en: "Bright lights and loud sounds" },
        { zh: "持续忍耐", en: "Pushing through" },
      ],
    },
    clear_breeze: {
      description: { zh: "感官预算充足，环境在你的耐受范围内", en: "Sensory budget is full; environment is within tolerance" },
      suitable: [
        { zh: "专注工作", en: "Focused work" },
        { zh: "适度社交", en: "Moderate socializing" },
        { zh: "感官建设活动", en: "Sensory-building activities" },
      ],
      unsuitable: [],
    },
  },
  adhd: {
    stuffy_rain: {
      description: { zh: "执行功能气压升高，任务切换在累积疲劳", en: "Executive function pressure rising; task-switching fatigue is accumulating" },
      suitable: [
        { zh: "单线程任务", en: "Single-threaded tasks" },
        { zh: "减少切换", en: "Reduce switching" },
        { zh: "身体活动", en: "Physical activity" },
        { zh: "低决策负荷", en: "Low decision load" },
      ],
      unsuitable: [
        { zh: "多线程任务", en: "Multi-threaded tasks" },
        { zh: "重要决策", en: "Important decisions" },
        { zh: "高认知负荷", en: "High cognitive load" },
      ],
    },
    warm_fog: {
      description: { zh: "多巴胺电量在降，启动任务越来越困难", en: "Dopamine battery is dropping; task initiation is getting harder" },
      suitable: [
        { zh: "5 分钟微任务", en: "5-minute micro-tasks" },
        { zh: "外部结构化", en: "External structure" },
        { zh: "body doubling", en: "Body doubling" },
        { zh: "减少选择", en: "Reduce choices" },
      ],
      unsuitable: [
        { zh: "无截止期的任务", en: "Open-ended tasks" },
        { zh: "复杂决策", en: "Complex decisions" },
        { zh: "多线程任务", en: "Multi-threaded tasks" },
      ],
    },
    storm_warning: {
      description: { zh: "多巴胺见底，执行功能接近崩溃", en: "Dopamine is bottoming out; executive function is near collapse" },
      suitable: [
        { zh: "完全停止任务", en: "Stop all tasks" },
        { zh: "身体重置运动", en: "Physical reset movement" },
        { zh: "关闭屏幕", en: "Turn off screens" },
        { zh: "不要求自己", en: "Drop self-demands" },
      ],
      unsuitable: [
        { zh: "继续任务", en: "Continue tasks" },
        { zh: "做决定", en: "Make decisions" },
        { zh: "增加新任务", en: "Add new tasks" },
        { zh: "硬撑", en: "Push through" },
      ],
    },
    clear_breeze: {
      description: { zh: "多巴胺电量满格，脑子转得动", en: "Dopamine battery is full; the mind is ready to work" },
      suitable: [
        { zh: "做你真正想做的事", en: "Do what you truly want" },
        { zh: "启动重要任务", en: "Start important tasks" },
        { zh: "创造性工作", en: "Creative work" },
      ],
      unsuitable: [],
    },
  },
};

// 获取按特质分化的气候配置
function getClimateMeta(climate: ClimateType, neuroType: NeuroType) {
  const base = CLIMATE_MAP[climate];
  const typed = CLIMATE_MAP_BY_TYPE[neuroType]?.[climate];
  if (typed) {
    return {
      label: base.label,
      description: typed.description,
      suitable: typed.suitable,
      unsuitable: typed.unsuitable,
    };
  }
  return base;
}

// 天气卡生成引擎（PRD §10：基于签到数据 + 简单条件逻辑）
// 统一用 strain（0-10，10=最差）模型：不同神经特质的轴语义不同，但归一化后气候逻辑通用
// strain1/2/3 对应三轴归一化后的"过载程度"
function climateFromStrains(s1: number, s2: number, s3: number): ClimateType {
  // 雷暴预警：任一主轴 strain ≥ 8
  if (s1 >= 8 || s2 >= 8) return "storm_warning";
  // 闷热待雨：主轴 strain ≥ 7
  if (s1 >= 7) return "stuffy_rain";
  // 暖雾弥漫：第三轴 strain ≥ 7（执行功能/接地/稳定感下降）
  if (s3 >= 7) return "warm_fog";
  // 晴朗微风：三轴 strain 均 ≤ 5
  if (s1 <= 5 && s2 <= 5 && s3 <= 5) return "clear_breeze";
  // 主轴偏高但未到 7 → 闷热趋势
  if (s1 > 5) return "stuffy_rain";
  // 其余 → 暖雾
  return "warm_fog";
}

// 基于原始签到值 + 神经特质生成天气卡
export function generateWeather(
  sensory: number,
  social: number,
  predictability: number,
  neuroType: NeuroType = "asd",
): WeatherSnapshot {
  const profile = getAxisProfile(neuroType);
  const [a1, a2, a3] = profile.axes;
  const s1 = toStrain(sensory, a1.direction);
  const s2 = toStrain(social, a2.direction);
  const s3 = toStrain(predictability, a3.direction);

  const climate = climateFromStrains(s1, s2, s3);
  const meta = getClimateMeta(climate, neuroType);
  return {
    climate,
    climate_label: meta.label,
    description: meta.description,
    suitable: meta.suitable,
    unsuitable: meta.unsuitable,
  };
}

// 根据签到三轴生成默认快照（用于无签到时的初始天气卡）
export function defaultWeather(): WeatherSnapshot {
  return generateWeather(6.5, 4.0, 7.0);
}
