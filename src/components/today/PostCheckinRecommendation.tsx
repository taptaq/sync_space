import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RefreshCw, Sparkles, X } from "lucide-react";
import type { Protocol } from "@/types";
import { useStore } from "@/store/useStore";
import { detectPhase, getPhaseConfig, phasePriority } from "@/lib/stageEngine";
import { useT } from "@/lib/i18n";

// 签到完成 → 基于状态推协议（ADHD 计划延续 · P1 改进3）
// 痛点：签到完"我了解自己了"，但下一步做什么？没衔接 → 卡住
// 设计：签到后 60 秒内展示一张卡片
//   - 优先用 matchTriggers 自动命中的 activeTrigger（含触发理由）
//   - 没命中则按阶段优先级取 active 协议
//   - "开始" 直接 executeProtocol；"换一个" 取下一张；"跳过" 关闭
const SHOW_WINDOW_MS = 60_000;

export default function PostCheckinRecommendation() {
  const checkins = useStore((s) => s.checkins);
  const protocols = useStore((s) => s.protocols);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const activeTrigger = useStore((s) => s.activeTrigger);
  const dismissTrigger = useStore((s) => s.dismissTrigger);
  const executeProtocol = useStore((s) => s.executeProtocol);
  const { tr, tt } = useT();

  const [dismissed, setDismissed] = useState(false);
  // 在候选列表里的游标，"换一个"会 +1
  const [idx, setIdx] = useState(0);
  // 用于检测"刚签到完" · 每次 checkins.length 变化就重置 dismissed
  const [lastCheckinLen, setLastCheckinLen] = useState(checkins.length);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (checkins.length !== lastCheckinLen) {
      setDismissed(false);
      setIdx(0);
      setLastCheckinLen(checkins.length);
    }
  }, [checkins.length, lastCheckinLen]);

  // 每 10s 刷新一次"是否还在 60s 窗口内"
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(t);
  }, []);

  const latestCheckin = checkins[checkins.length - 1];
  const ageMs = latestCheckin ? now - new Date(latestCheckin.checkin_at).getTime() : Infinity;
  const visible = !dismissed && latestCheckin !== undefined && ageMs < SHOW_WINDOW_MS;

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const phaseCfg = getPhaseConfig(currentPhase);

  // 候选列表：active + 按阶段优先级排序，最多 3 张
  const candidates = useMemo(() => {
    const active = protocols.filter((p) => p.status === "active");
    return [...active]
      .map((p) => ({ protocol: p, priority: phasePriority(p.phases, currentPhase) }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map((x) => x.protocol);
  }, [protocols, currentPhase]);

  // 当前展示的协议：activeTrigger 优先（已自动命中），否则用 candidates[idx]
  const shown: Protocol | null = activeTrigger?.protocol ?? candidates[idx % Math.max(1, candidates.length)] ?? null;

  if (!visible || !shown) return null;

  const reason = activeTrigger?.reason ?? tr("post_checkin_reason_phase", { phase: tt(phaseCfg.label) });

  const handleStart = () => {
    executeProtocol(shown.id);
    dismissTrigger();
    setDismissed(true);
  };

  const handleSwap = () => {
    if (candidates.length > 1) {
      setIdx((v) => (v + 1) % candidates.length);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    dismissTrigger();
  };

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-card border border-primary/30 bg-primary-mist/30 p-4 shadow-soft"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-medium text-ink">{tr("post_checkin_title")}</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={tr("post_checkin_dismiss")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-white/60 hover:text-ink-muted"
          >
            <X size={13} />
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-muted">{reason}</p>

        <div className="rounded-card border border-edge bg-white/70 p-3">
          <p className="text-sm font-medium text-ink">{tt(shown.action.description)}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {tr("protocol_card_time_estimate", { minutes: shown.action.duration_minutes })}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleStart}
            className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
          >
            {tr("post_checkin_start")} <ArrowRight size={14} />
          </button>
          {candidates.length > 1 && (
            <button
              type="button"
              onClick={handleSwap}
              aria-label={tr("post_checkin_swap")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge bg-white/60 text-ink-muted transition-all duration-250 hover:bg-white/80 active:scale-[0.98]"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
