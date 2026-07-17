import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BatteryFull,
  Calendar,
  Sparkles,
  Droplets,
  Timer,
  Inbox,
  X,
  ChevronRight,
  Heart,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 神经特质新手引导 · 首次进入 Today 时显示
//
// 聚光灯策略：
// - 每步尝试在 DOM 中找 data-tour-id 对应元素
// - 用轮询等待元素出现且有实际内容（组件可能因数据不足 return null）
// - 找到则 scrollIntoView + 聚光灯挖孔 + 浮层说明卡
// - 超时（2s）或元素不存在则降级为居中卡片
//
// 前置选择对布局的影响：
// - parent_proxy 模式：QuickCapture/SensoryBattery/TomorrowPreview/FocusStartCard/困难入口均不渲染
// - focus 模式：困难入口不渲染，但 FocusStartCard 渲染
// - ASD 首次进入：SensoryBattery（需签到数据）和 TomorrowPreview（需 3 次同星期签到）不渲染
// - ADHD 首次进入：QuickCapture 总是渲染
//
// 关闭后不再弹（store 记录 hasSeenNeuroGuide）

type GuideStep = {
  icon: typeof BatteryFull;
  iconColor: string;
  titleKey: string;
  bodyKey: string;
  /** 对应 data-tour-id · 省略则用居中卡片 */
  targetId?: string;
};

const ASD_STEPS: GuideStep[] = [
  {
    icon: BatteryFull,
    iconColor: "text-sage",
    titleKey: "guide_asd_battery_title",
    bodyKey: "guide_asd_battery_body",
    // SensoryBattery 首次进入时无签到数据不渲染 → 自动降级居中卡片
    // 用户签过后再看引导（如重置）则聚光灯生效
    targetId: "sensory-battery",
  },
  {
    icon: Calendar,
    iconColor: "text-primary",
    titleKey: "guide_asd_tomorrow_title",
    bodyKey: "guide_asd_tomorrow_body",
    // TomorrowPreview 需 3 次同星期签到 → 首次必降级
    targetId: "tomorrow-preview",
  },
  {
    icon: Heart,
    iconColor: "text-clay",
    titleKey: "guide_asd_energy_title",
    bodyKey: "guide_asd_energy_body",
    // EnergyArchive 在「理解」页 · Today 看不到 → 居中卡片
  },
  {
    icon: Sparkles,
    iconColor: "text-primary",
    titleKey: "guide_asd_lowsensory_title",
    bodyKey: "guide_asd_lowsensory_body",
    targetId: "settings-entry",
  },
];

const ADHD_STEPS: GuideStep[] = [
  {
    icon: Inbox,
    iconColor: "text-primary",
    titleKey: "guide_adhd_inbox_title",
    bodyKey: "guide_adhd_inbox_body",
    // QuickCapture 对 ADHD 用户总是渲染
    targetId: "quick-capture",
  },
  {
    icon: Timer,
    iconColor: "text-sage",
    titleKey: "guide_adhd_micro_start_title",
    bodyKey: "guide_adhd_micro_start_body",
    // 困难入口在 normal 模式下渲染（默认 normal）
    targetId: "difficulty-entry",
  },
  {
    icon: Droplets,
    iconColor: "text-sage",
    titleKey: "guide_adhd_hyperfocus_title",
    bodyKey: "guide_adhd_hyperfocus_body",
    // 专注按钮在 normal 模式 + 非 parent 下渲染
    targetId: "focus-mode-entry",
  },
  {
    icon: Sparkles,
    iconColor: "text-primary",
    titleKey: "guide_adhd_no_streak_title",
    bodyKey: "guide_adhd_no_streak_body",
    // 概念性说明 · 无具体定位
  },
];

const OTHER_STEPS: GuideStep[] = [
  {
    icon: Sparkles,
    iconColor: "text-primary",
    titleKey: "guide_other_explore_title",
    bodyKey: "guide_other_explore_body",
  },
];

const SPOTLIGHT_PADDING = 10;
const POLL_INTERVAL = 120;
const MAX_POLLS = 18; // ≈2.2s
const SCROLL_SETTLE = 520;

type TargetInfo = { rect: DOMRect; el: HTMLElement };

/**
 * 轮询查找目标元素：
 * 1. 等 data-tour-id 元素出现（React 渲染延迟）
 * 2. 检查元素有实际内容（offsetHeight ≥ 10，排除组件 return null 时的空壳）
 * 3. scrollIntoView 后等滚动落定再采样 rect
 * 4. 超时则返回 null（降级居中卡片）
 */
function useTarget(targetId: string | undefined, stepKey: string): TargetInfo | null {
  const [target, setTarget] = useState<TargetInfo | null>(null);

  useEffect(() => {
    if (!targetId) {
      setTarget(null);
      return;
    }

    let cancelled = false;
    let pollCount = 0;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const findEl = (): HTMLElement | null => {
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${targetId}"]`);
      if (!el) return null;
      // 排除空壳（组件 return null 但外层容器存在的情况）
      if (el.offsetHeight < 10) return null;
      return el;
    };

    const poll = () => {
      if (cancelled) return;
      pollCount++;
      const el = findEl();
      if (el) {
        // 找到了 → 滚入视口 → 等落定 → 采样
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        scrollTimer = setTimeout(() => {
          if (cancelled) return;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            setTarget({ rect: r, el });
          } else {
            setTarget(null);
          }
        }, SCROLL_SETTLE);
        return;
      }
      // 没找到 → 继续轮询或超时降级
      if (pollCount < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL);
      } else {
        setTarget(null);
      }
    };

    // 首次延迟，等 React 完成 DOM 挂载
    const initTimer = setTimeout(poll, 180);

    // 滚动/resize 时重新采样（仅当已有 target 时）
    const onScrollOrResize = () => {
      if (cancelled) return;
      const el = findEl();
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setTarget({ rect: r, el });
        }
      }
    };
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      if (scrollTimer) clearTimeout(scrollTimer);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [targetId, stepKey]);

  return target;
}

export default function NeuroOnboardingGuide() {
  const neuroType = useStore((s) => s.neuroType);
  const hasSeenNeuroGuide = useStore((s) => s.hasSeenNeuroGuide);
  const setHasSeenNeuroGuide = useStore((s) => s.setHasSeenNeuroGuide);
  const { tr } = useT();

  const steps =
    neuroType === "asd"
      ? ASD_STEPS
      : neuroType === "adhd"
        ? ADHD_STEPS
        : OTHER_STEPS;

  const [idx, setIdx] = useState(0);
  const [closed, setClosed] = useState(hasSeenNeuroGuide);

  const step = steps[idx];
  const stepKey = `${neuroType}-${idx}`;
  const target = useTarget(step.targetId, stepKey);

  if (closed) return null;

  const isLast = idx === steps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLast) {
      setHasSeenNeuroGuide(true);
      setClosed(true);
    } else {
      setIdx((v) => v + 1);
    }
  };

  const handleSkip = () => {
    setHasSeenNeuroGuide(true);
    setClosed(true);
  };

  // ---- 聚光灯挖孔样式 ----
  const holeStyle = target
    ? {
        position: "fixed" as const,
        top: target.rect.top - SPOTLIGHT_PADDING,
        left: target.rect.left - SPOTLIGHT_PADDING,
        width: target.rect.width + SPOTLIGHT_PADDING * 2,
        height: target.rect.height + SPOTLIGHT_PADDING * 2,
        boxShadow: "0 0 0 9999px rgba(28, 25, 23, 0.55)",
        borderRadius: "16px",
        outline: "2px solid rgba(255, 255, 255, 0.5)",
        outlineOffset: "3px",
      }
    : null;

  // ---- 浮层卡片定位 ----
  const TOOLTIP_WIDTH = 320;
  const TOOLTIP_EST_HEIGHT = 240;
  const tooltipPos = target
    ? (() => {
        const showBelow = target.rect.top + target.rect.height / 2 < window.innerHeight * 0.45;
        const gap = 16;
        const top = showBelow
          ? Math.min(
              target.rect.bottom + SPOTLIGHT_PADDING + gap,
              window.innerHeight - TOOLTIP_EST_HEIGHT - 16,
            )
          : Math.max(
              20,
              target.rect.top - SPOTLIGHT_PADDING - gap - TOOLTIP_EST_HEIGHT,
            );
        const centerX = target.rect.left + target.rect.width / 2;
        const left = Math.max(
          16,
          Math.min(window.innerWidth - TOOLTIP_WIDTH - 16, centerX - TOOLTIP_WIDTH / 2),
        );
        return { top, left, showBelow };
      })()
    : null;

  const stepCard = (
    <>
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-mist/40",
          step.iconColor,
        )}
      >
        <Icon size={20} />
      </div>
      <div className="mb-3 flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-250",
              i === idx ? "w-5 bg-primary" : "w-1.5 bg-edge",
            )}
          />
        ))}
      </div>
      <h3 className="font-serif text-lg text-ink">{tr(step.titleKey as never)}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        {tr(step.bodyKey as never)}
      </p>
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          {tr("guide_skip")}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
        >
          {isLast ? tr("guide_start") : tr("onb_next")}
          <ChevronRight size={15} />
        </button>
      </div>
    </>
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`guide-${idx}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60]"
        onClick={handleSkip}
      >
        {target && holeStyle && tooltipPos ? (
          <>
            {/* 聚光灯：透明挖孔 + 四周变暗 */}
            <div
              className="pointer-events-none transition-all duration-300"
              style={holeStyle}
            />
            {/* 浮层说明卡 */}
            <motion.div
              initial={{ opacity: 0, y: tooltipPos.showBelow ? -8 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                position: "fixed",
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: TOOLTIP_WIDTH,
              }}
              className="rounded-card border border-edge bg-base/95 p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleSkip}
                aria-label={tr("close")}
                className="absolute right-4 top-4 text-ink-faint transition-colors hover:text-ink-muted"
              >
                <X size={16} />
              </button>
              {stepCard}
            </motion.div>
          </>
        ) : (
          /* 居中卡片（目标不在 DOM / 组件未渲染 / 等待超时） */
          <div className="absolute inset-0 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-card border border-edge bg-base/95 p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={handleSkip}
                aria-label={tr("close")}
                className="absolute right-4 top-4 text-ink-faint transition-colors hover:text-ink-muted"
              >
                <X size={16} />
              </button>
              {stepCard}
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
