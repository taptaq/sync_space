import { AXIS_COLORS } from "@/lib/constants";

// 三轴颜色混合计算（感知层 · 能量调色盘 · 将三个轴的数值映射为混合色）
// 各轴颜色按权重（归一化浓度）加权平均，生成今日颜色

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

export function mixColors(values: {
  sensory: number;
  social: number;
  predictability: number;
}): string {
  const total = values.sensory + values.social + values.predictability || 1;

  const c1 = hexToRgb(AXIS_COLORS.sensory.hex); // purple
  const c2 = hexToRgb(AXIS_COLORS.social.hex); // sage
  const c3 = hexToRgb(AXIS_COLORS.predictability.hex); // clay

  const w1 = values.sensory / total;
  const w2 = values.social / total;
  const w3 = values.predictability / total;

  const r = Math.round(c1.r * w1 + c2.r * w2 + c3.r * w3);
  const g = Math.round(c1.g * w1 + c2.g * w2 + c3.g * w3);
  const b = Math.round(c1.b * w1 + c2.b * w2 + c3.b * w3);

  return `rgb(${r}, ${g}, ${b})`;
}
