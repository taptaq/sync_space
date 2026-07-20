import { useState } from "react";
import { motion, type TargetAndTransition, type Transition, AnimatePresence } from "framer-motion";
import { HelpCircle, X } from "lucide-react";
import type { Phase } from "@/types";
import { getPhaseConfig } from "@/lib/stageEngine";
import { getFamiliarLocalImage } from "@/components/weather/FamiliarImage";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ModalPortal } from "@/components/common/ModalPortal";

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
  const { tr, tt } = useT();
  const phaseCfg = getPhaseConfig(phase);
  const imgUrl = getFamiliarLocalImage(phase);
  const mot = MOTIONS[phase];
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <motion.div
        animate={mot.animate}
        transition={mot.transition}
        className="flex flex-col items-center"
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
            alt={`小小的我 · ${tt(phaseCfg.label)}`}
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

      {/* 状态说明入口 */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-muted transition-colors hover:text-ink"
        title={tr("familiar_tooltip_title")}
      >
        <HelpCircle size={11} />
        {tr("familiar_tooltip_title")}
      </button>

      <ModalPortal>
        <AnimatePresence>
          {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 p-5 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-xs rounded-card border border-edge bg-white/90 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-serif text-base text-ink">{tr("familiar_tooltip_title")}</p>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  aria-label={tr("close")}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-ink-muted"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm leading-7 text-ink-muted">{tr("familiar_tooltip_desc")}</p>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </div>
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
