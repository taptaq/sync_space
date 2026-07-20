import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { ModalPortal } from "@/components/common/ModalPortal";
import type { StringKey } from "@/lib/translations";

// 通用多步引导 · spotlight 高亮指定功能位置
// 通过 data-tour-id 定位元素，box-shadow 镂空效果高亮目标
// polling 等待元素渲染（处理条件渲染），找不到时 fallback 到居中卡片

export interface GuideStep {
  targetId: string;          // data-tour-id 值
  titleKey: StringKey;
  bodyKey: StringKey;
  placement?: "auto" | "bottom" | "top";  // 卡片相对目标的位置
}

interface SpotlightGuideProps {
  pageKey: string;           // store.seenPageGuides 的 key
  steps: GuideStep[];
}

interface Rect { top: number; left: number; width: number; height: number }

const POLL_INTERVAL = 120;
const POLL_MAX = 25;     // ~3s
const PAD = 8;           // spotlight 内边距
const SCROLL_WAIT = 480; // scrollIntoView 后等待

function useTargetRect(targetId: string | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!targetId) { setRect(null); return; }
    setRect(null);
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts++;
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
      if (el && el.offsetHeight >= 10) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }, SCROLL_WAIT);
        window.clearInterval(timer);
      } else if (attempts >= POLL_MAX) {
        window.clearInterval(timer);
      }
    }, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [targetId]);

  return rect;
}

export default function SpotlightGuide({ pageKey, steps }: SpotlightGuideProps) {
  const seen = useStore((state) => state.seenPageGuides[pageKey] ?? false);
  const setSeen = useStore((state) => state.setSeenPageGuide);
  const { tr } = useT();
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);

  // 延迟启动：等页面渲染稳定后再开始引导
  useEffect(() => {
    if (seen) return;
    const t = window.setTimeout(() => setStarted(true), 400);
    return () => window.clearTimeout(t);
  }, [seen]);

  const close = useCallback(() => setSeen(pageKey, true), [pageKey, setSeen]);

  const step = steps[stepIndex];
  const rect = useTargetRect(started && !seen ? step?.targetId ?? null : null);

  if (seen || !started || !step) return null;

  const isLast = stepIndex === steps.length - 1;
  const hasTarget = rect !== null && rect.width > 0;

  // 卡片定位：有目标时放在下方，否则居中
  const cardStyle: React.CSSProperties = hasTarget
    ? {
        position: "fixed",
        top: Math.min(rect!.top + rect!.height + PAD * 2 + 8, window.innerHeight - 220),
        left: Math.max(16, Math.min(rect!.left, window.innerWidth - 336 - 16)),
        width: Math.min(336, window.innerWidth - 32),
      }
    : { position: "fixed", left: 16, right: 16, bottom: "calc(2rem + env(safe-area-inset-bottom))" };

  return (
    <ModalPortal>
      <AnimatePresence>
        {/* 遮罩 + spotlight 镂空 */}
        {hasTarget ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{
              backgroundColor: "rgba(28, 25, 35, 0.55)",
              backdropFilter: "blur(2px)",
              // box-shadow 镂空：大阴影 + 目标矩形透明
              boxShadow: `0 0 0 9999px rgba(28, 25, 35, 0.55)`,
              clipPath: `polygon(
                0% 0%, 0% 100%,
                ${rect!.left - PAD}px 100%,
                ${rect!.left - PAD}px ${rect!.top - PAD}px,
                ${rect!.left + rect!.width + PAD}px ${rect!.top - PAD}px,
                ${rect!.left + rect!.width + PAD}px ${rect!.top + rect!.height + PAD}px,
                ${rect!.left - PAD}px ${rect!.top + rect!.height + PAD}px,
                ${rect!.left - PAD}px 100%,
                100% 100%, 100% 0%
              )`,
            }}
            onClick={close}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm"
            onClick={close}
          />
        )}

        {/* 高亮边框动画 */}
        {hasTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-[71] rounded-card border-2 border-primary"
            style={{
              top: rect!.top - PAD,
              left: rect!.left - PAD,
              width: rect!.width + PAD * 2,
              height: rect!.height + PAD * 2,
            }}
          />
        )}

        {/* 说明卡片 */}
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={cardStyle}
          className="fixed z-[72] rounded-card border border-edge bg-base p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={close}
            aria-label={tr("close")}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center text-ink-muted"
          >
            <X size={16} />
          </button>

          <p className="text-[11px] font-medium text-primary">
            {stepIndex + 1} / {steps.length}
          </p>
          <h3 className="mt-1 font-serif text-lg text-ink">{tr(step.titleKey)}</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{tr(step.bodyKey)}</p>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={close}
              className="min-h-10 px-2 text-xs text-ink-muted"
            >
              {tr("guide_skip")}
            </button>
            <div className="flex items-center gap-1.5">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((v) => v - 1)}
                  className="flex min-h-10 items-center gap-1 rounded-full border border-edge px-3 text-xs text-ink-muted"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? close() : setStepIndex((v) => v + 1))}
                className="flex min-h-10 items-center gap-1 rounded-full bg-primary px-4 text-xs font-medium text-white"
              >
                {isLast ? tr("guide_start") : tr("onb_next")}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </ModalPortal>
  );
}
