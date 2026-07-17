import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import type { Protocol } from "@/types";
import { useStore } from "@/store/useStore";
import { detectPhase, getPhaseConfig, phasePriority } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";
import { useVoice, useT } from "@/lib/i18n";

// 阶段匹配协议推荐（行动层 · 当前阶段优先推适用协议 + 一键触发）
export default function RecommendedProtocolsCard() {
  const [expanded, setExpanded] = useState(false);
  const protocols = useStore((s) => s.protocols);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const setActiveTrigger = useStore((s) => s.setActiveTrigger);
  const { t } = useVoice();
  const { tr, tt } = useT();

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const phaseCfg = getPhaseConfig(currentPhase);

  // 按阶段优先级排序，取前 3
  const recommended = useMemo(() => {
    const active = protocols.filter((p) => p.status === "active");
    return [...active]
      .map((p) => ({ protocol: p, priority: phasePriority(p.phases, currentPhase) }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map((x) => x.protocol);
  }, [protocols, currentPhase]);

  if (recommended.length === 0) return null;

  const handleTrigger = (protocol: Protocol) => {
    const phaseLabel = tt(phaseCfg.label);
    setActiveTrigger({
      protocol,
      reason: tr("recommended_reason", { phase: phaseLabel, who: t.you }),
      triggeredAt: new Date().toISOString(),
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-card border p-5 shadow-soft",
        currentPhase === "recovery"
          ? "border-primary/20 bg-primary-mist/20"
          : currentPhase === "overload"
            ? "border-warn/30 bg-warn-mist/20"
            : "border-edge bg-white/60",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={14} className="text-primary" />
        <span className="text-small font-medium text-ink">
          {tr("recommended_phase_prefix")}{tt(phaseCfg.label)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            phaseCfg.badgeClass,
          )}
        >
          {tr("recommended_count", { count: recommended.length })}
        </span>
      </div>

      <p className="mb-3 text-xs text-ink-muted">{tt(phaseCfg.measureTone)}</p>

      <div className="space-y-2">
        {(expanded ? recommended : recommended.slice(0, 1)).map((p) => (
          <button
            key={p.id}
            onClick={() => handleTrigger(p)}
            className="flex w-full items-center gap-3 rounded-card border border-edge bg-white/50 p-3 text-left transition-all duration-250 hover:bg-white/80 active:scale-[0.99]"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                p.phases && p.phases.includes(currentPhase)
                  ? "bg-primary-mist text-primary"
                  : "bg-edge text-ink-muted",
              )}
            >
              <Zap size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-small text-ink">
                {tt(p.action.description)}
              </p>
              <p className="truncate text-xs text-ink-faint">
                {tr("protocol_when_label")} · {tt(p.trigger.description)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-primary">{tr("recommended_execute")}</span>
          </button>
        ))}
      </div>
      {recommended.length > 1 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 w-full py-1 text-xs text-ink-muted"
        >
          {expanded ? tr("recommended_collapse") : tr("recommended_more", { count: recommended.length - 1 })}
        </button>
      )}
    </motion.section>
  );
}
