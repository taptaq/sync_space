import { useMemo } from "react";
import { motion } from "framer-motion";
import type { AxisKey } from "@/types";
import { getAxisProfile } from "@/lib/axisConfig";
import { useStore } from "@/store/useStore";
import { AXIS_COLORS } from "@/lib/constants";
import { mixColors } from "@/lib/colorUtils";

// 能量调色盘（感知层 · 外化投射 · 三轴颜色混合）
// 感官=紫 · 社交=绿 · 稳定=橙，三色的浓度由滑块控制
// 混合后生成今日颜色，一周形成色谱——比数字更有感知力

export default function EnergyPalette({
  values,
  onChange,
}: {
  values: Record<AxisKey, number>;
  onChange: (key: AxisKey, value: number) => void;
}) {
  const neuroType = useStore((s) => s.neuroType);
  const profile = getAxisProfile(neuroType);

  const mixedColor = useMemo(() => mixColors(values), [values]);

  // 各轴占比（用于色带显示）
  const total = values.sensory + values.social + values.predictability || 1;

  return (
    <div className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-small text-ink">能量调色盘</p>
        <p className="text-xs text-ink-muted">拖动颜色浓度 · 混合今日颜色</p>
      </div>

      {/* 今日颜色预览 */}
      <div className="mb-5 flex items-center gap-4">
        <motion.div
          animate={{ backgroundColor: mixedColor }}
          transition={{ duration: 0.4 }}
          className="h-16 w-16 rounded-2xl shadow-soft"
        />
        <div className="flex-1">
          {/* 三色比例条 */}
          <div className="mb-2 flex h-3 w-full overflow-hidden rounded-full">
            <motion.div
              className="h-full"
              style={{ backgroundColor: AXIS_COLORS.sensory.hex }}
              animate={{ width: `${(values.sensory / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="h-full"
              style={{ backgroundColor: AXIS_COLORS.social.hex }}
              animate={{ width: `${(values.social / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="h-full"
              style={{ backgroundColor: AXIS_COLORS.predictability.hex }}
              animate={{ width: `${(values.predictability / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex gap-3 text-xs text-ink-faint">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AXIS_COLORS.sensory.hex }} />
              {profile.axes[0].label} {Math.round((values.sensory / total) * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AXIS_COLORS.social.hex }} />
              {profile.axes[1].label} {Math.round((values.social / total) * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AXIS_COLORS.predictability.hex }} />
              {profile.axes[2].label} {Math.round((values.predictability / total) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 三轴滑块（用颜色条代替枯燥数字） */}
      <div className="space-y-4">
        {profile.axes.map((axis) => (
          <div key={axis.key}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-ink">{axis.label}</span>
              <span className="font-mono text-xs text-ink-muted">
                {values[axis.key].toFixed(1)}
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-edge/50">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: AXIS_COLORS[axis.key].hex }}
                animate={{ width: `${(values[axis.key] / 10) * 100}%` }}
                transition={{ duration: 0.15 }}
              />
              <input
                type="range"
                min={0}
                max={10}
                step={0.1}
                value={values[axis.key]}
                onChange={(e) =>
                  onChange(axis.key, parseFloat(e.target.value))
                }
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {/* 透明拇指轨道 */}
              <div
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                style={{
                  left: `calc(${(values[axis.key] / 10) * 100}% - 8px)`,
                  backgroundColor: AXIS_COLORS[axis.key].hex,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-ink-faint">
        今日颜色不止一种——是你的能量混合而成
      </p>
    </div>
  );
}
