import type { ClimateType, NeuroType, WeatherSnapshot } from "@/types";
import { getAxisProfile, toStrain } from "@/lib/axisConfig";

// 气候类型映射（PRD §09：气候类型非好坏）
// 基础版本（通用），按特质分化的版本在 CLIMATE_MAP_BY_TYPE
export const CLIMATE_MAP: Record<
  ClimateType,
  { label: string; description: string; suitable: string[]; unsuitable: string[] }
> = {
  stuffy_rain: {
    label: "闷热待雨",
    description: "气压升高中，预计 30 分钟后接近临界点",
    suitable: ["低感官活动", "安静空间", "独处休息"],
    unsuitable: ["嘈杂环境", "重要决策", "高强度社交"],
  },
  clear_breeze: {
    label: "晴朗微风",
    description: "状态稳定舒适，适合做需要专注的事",
    suitable: ["专注工作", "适度社交", "做决定"],
    unsuitable: [],
  },
  warm_fog: {
    label: "暖雾弥漫",
    description: "执行功能有些模糊，启动任务可能困难",
    suitable: ["微任务破冰", "低压力活动", "减少选择"],
    unsuitable: ["复杂决策", "多线程任务"],
  },
  storm_warning: {
    label: "雷暴预警",
    description: "接近临界点，建议立即执行撤退协议",
    suitable: ["撤退到安全空间", "降低一切输入", "暂停社交"],
    unsuitable: ["嘈杂环境", "重要决策", "持续忍耐"],
  },
};

// 按特质分化的气候文案
// ASD 侧重感官解读，ADHD 侧重执行功能解读
const CLIMATE_MAP_BY_TYPE: Partial<Record<NeuroType, Partial<Record<ClimateType, {
  description: string;
  suitable: string[];
  unsuitable: string[];
}>>>> = {
  asd: {
    stuffy_rain: {
      description: "感官气压在升高，环境输入正在累积",
      suitable: ["低感官活动", "安静空间", "独处休息", "降噪耳机"],
      unsuitable: ["嘈杂环境", "强光场所", "重要决策", "高强度社交"],
    },
    warm_fog: {
      description: "感官预算开始模糊，对环境的耐受在下降",
      suitable: ["低感官活动", "熟悉环境", "减少刺激源"],
      unsuitable: ["新环境", "多线程任务", "强感官刺激"],
    },
    storm_warning: {
      description: "感官负荷接近临界，需要立即降载",
      suitable: ["撤退到安全空间", "降噪隔离", "减少一切输入"],
      unsuitable: ["嘈杂环境", "社交场合", "强光强声", "持续忍耐"],
    },
    clear_breeze: {
      description: "感官预算充足，环境在你的耐受范围内",
      suitable: ["专注工作", "适度社交", "感官建设活动"],
      unsuitable: [],
    },
  },
  adhd: {
    stuffy_rain: {
      description: "执行功能气压升高，任务切换在累积疲劳",
      suitable: ["单线程任务", "减少切换", "身体活动", "低决策负荷"],
      unsuitable: ["多线程任务", "重要决策", "高认知负荷"],
    },
    warm_fog: {
      description: "多巴胺电量在降，启动任务越来越困难",
      suitable: ["5 分钟微任务", "外部结构化", "body doubling", "减少选择"],
      unsuitable: ["无截止期的任务", "复杂决策", "多线程任务"],
    },
    storm_warning: {
      description: "多巴胺见底，执行功能接近崩溃",
      suitable: ["完全停止任务", "身体重置运动", "关闭屏幕", "不要求自己"],
      unsuitable: ["继续任务", "做决定", "增加新任务", "硬撑"],
    },
    clear_breeze: {
      description: "多巴胺电量满格，脑子转得动",
      suitable: ["做你真正想做的事", "启动重要任务", "创造性工作"],
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
