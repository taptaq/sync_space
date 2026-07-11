import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import type { Phase } from "@/types";
import { getPhaseConfig } from "@/lib/stageEngine";
import { getFamiliarLocalImage } from "@/components/weather/FamiliarImage";
import { cn } from "@/lib/utils";

// 气候精灵——"小小的我"（PRD 理念：外化投射 · 不需要问"我感受怎样"，看一眼精灵姿态就懂）
// 精灵是住在天气卡里的"另一个我"，它替用户感知自己的状态
// 本地生图图片优先加载，5 种姿态对应 5 个阶段

interface ClimateFamiliarProps {
  phase: Phase;
  size?: number;
  className?: string;
}

const MOTIONS: Record<Phase, { animate: TargetAndTransition; transition: Transition }> = {
  stable: {
    animate: { scale: [0.98, 1.02, 0.98] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  accumulating: {
    animate: { y: [0, -2, 0] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  warning: {
    animate: { x: [0, 0.8, -0.8, 0.8, 0] },
    transition: { duration: 0.6, repeat: 2, ease: "easeInOut" },
  },
  overload: {
    animate: {},
    transition: {},
  },
  recovery: {
    animate: { y: [4, 0, 4] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function ClimateFamiliar({ phase, size = 72, className }: ClimateFamiliarProps) {
  const phaseCfg = getPhaseConfig(phase);
  const imgUrl = getFamiliarLocalImage(phase);
  const mot = MOTIONS[phase];

  return (
    <motion.div
      animate={mot.animate}
      transition={mot.transition}
      className={cn("flex flex-col items-center", className)}
    >
      {/* 光晕底 */}
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-xl",
            phase === "stable" && "bg-sage-mist/40",
            phase === "accumulating" && "bg-clay-mist/40",
            phase === "warning" && "bg-warn-mist/40",
            phase === "overload" && "bg-warn-mist/50",
            phase === "recovery" && "bg-primary-mist/40",
          )}
          style={{ transform: "scale(1.3)" }}
        />
        <motion.img
          src={imgUrl}
          alt={`小小的我 · ${phaseCfg.label}`}
          className="relative rounded-full object-contain"
          style={{ width: size, height: size }}
          draggable={false}
        />
      </div>

      {/* 精灵状态标签 */}
      <span
        className={cn(
          "mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
          phaseCfg.badgeClass,
        )}
      >
        {getFamiliarSpeech(phase)}
      </span>
    </motion.div>
  );
}

function getFamiliarSpeech(phase: Phase): string {
  switch (phase) {
    case "stable": return "趴着休息";
    case "accumulating": return "注意到什么";
    case "warning": return "准备好";
    case "overload": return "蜷起来";
    case "recovery": return "慢慢探头";
    default: return "在这里";
  }
}
