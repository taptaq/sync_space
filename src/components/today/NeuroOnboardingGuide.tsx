import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronRight, MousePointer2, Sparkles, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { ModalPortal } from "@/components/common/ModalPortal";

const STEPS = [
  {
    icon: MousePointer2,
    title: "guide_plain_pick_title" as const,
    body: "guide_plain_pick_body" as const,
  },
  {
    icon: Sparkles,
    title: "guide_plain_try_title" as const,
    body: "guide_plain_try_body" as const,
  },
  {
    icon: CheckCircle2,
    title: "guide_plain_feedback_title" as const,
    body: "guide_plain_feedback_body" as const,
  },
];

// 首次进入只解释核心路径，不介绍所有功能。
// 用户先完成一次“选择情况 → 尝试办法 → 反馈”，再逐渐发现其他能力。
export default function NeuroOnboardingGuide() {
  const hasSeen = useStore((state) => state.hasSeenNeuroGuide);
  const setHasSeen = useStore((state) => state.setHasSeenNeuroGuide);
  const { tr } = useT();
  const [stepIndex, setStepIndex] = useState(0);

  if (hasSeen) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === STEPS.length - 1;
  const close = () => setHasSeen(true);

  return (
    <ModalPortal>
      <AnimatePresence>
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/35 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-sm rounded-card border border-edge bg-base p-6 shadow-2xl"
        >
          <button
            type="button"
            onClick={close}
            aria-label={tr("close")}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center text-ink-muted"
          >
            <X size={18} />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-mist/50 text-primary">
            <Icon size={21} />
          </div>
          <p className="mt-5 text-xs text-ink-muted">
            {stepIndex + 1} / {STEPS.length}
          </p>
          <h2 className="mt-1 font-serif text-2xl text-ink">{tr(step.title)}</h2>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{tr(step.body)}</p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={close}
              className="min-h-11 px-2 text-sm text-ink-muted"
            >
              {tr("guide_skip")}
            </button>
            <button
              type="button"
              onClick={() => (isLast ? close() : setStepIndex((value) => value + 1))}
              className="flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-medium text-white"
            >
              {isLast ? tr("guide_start") : tr("onb_next")}
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}
