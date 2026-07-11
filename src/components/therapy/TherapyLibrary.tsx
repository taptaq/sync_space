import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookHeart, Clock, ChevronDown, Plus, X } from "lucide-react";
import type { Phase, Protocol } from "@/types";
import { useStore } from "@/store/useStore";
import {
  getTherapiesByNeuroType,
  sortTherapiesByPhase,
  CATEGORY_LABELS,
  type Therapy,
} from "@/lib/therapies";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";

// 循证疗法库（基于学术文献 · 非诊断 · 辅助自我调节）
// 按神经特质过滤 + 当前阶段优先推荐
// 每条疗法可一键转为协议

export default function TherapyLibrary() {
  const neuroType = useStore((s) => s.neuroType);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const addProtocol = useStore((s) => s.addProtocol);
  const pushToast = useStore((s) => s.pushToast);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const phaseCfg = getPhaseConfig(currentPhase);

  const therapies = useMemo(() => {
    const filtered = getTherapiesByNeuroType(neuroType);
    const byCategory = categoryFilter
      ? filtered.filter((t) => t.category === categoryFilter)
      : filtered;
    return sortTherapiesByPhase(byCategory, currentPhase);
  }, [neuroType, categoryFilter, currentPhase]);

  const handleAddAsProtocol = (therapy: Therapy) => {
    const protocol: Omit<Protocol, "id" | "execution_count" | "last_executed_at" | "created_at"> = {
      trigger: {
        type: "behavior",
        description: `${therapy.name}（${CATEGORY_LABELS[therapy.category].label}）`,
      },
      action: {
        description: therapy.steps[0],
        duration_minutes: therapy.duration_minutes,
        timer: therapy.duration_minutes >= 5,
      },
      source: "ai_suggestion",
      status: "candidate",
      phases: therapy.phases,
    };
    addProtocol(protocol);
    pushToast("success", `「${therapy.name}」已加入协议候选`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookHeart size={18} className="text-primary" />
          <h2 className="font-serif text-xl text-ink">疗法库</h2>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs",
            phaseCfg.badgeClass,
          )}
        >
          当前 {phaseCfg.label} · 优先推荐
        </span>
      </div>

      <p className="mb-4 text-xs text-ink-muted">
        基于学术文献的循证低成本疗法 · 每条可一键转为协议 · 非诊断
      </p>

      {/* 分类筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter(null)}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-all duration-250",
            categoryFilter === null
              ? "bg-primary text-white"
              : "bg-white/60 text-ink-muted hover:bg-primary-mist/40",
          )}
        >
          全部
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs transition-all duration-250",
              categoryFilter === key
                ? "bg-primary text-white"
                : "bg-white/60 text-ink-muted hover:bg-primary-mist/40",
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* 疗法列表 */}
      <div className="space-y-2.5">
        {therapies.map((therapy) => {
          const isExpanded = expandedId === therapy.id;
          const phaseMatch = therapy.phases.includes(currentPhase);
          const catLabel = CATEGORY_LABELS[therapy.category];

          return (
            <div
              key={therapy.id}
              className={cn(
                "rounded-card border transition-all duration-250",
                phaseMatch
                  ? "border-primary/30 bg-primary-mist/20"
                  : "border-edge bg-white/50",
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : therapy.id)}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-sm">
                  {catLabel.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-small font-medium text-ink">
                      {therapy.name}
                    </p>
                    {phaseMatch && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                        适合现在
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-faint">
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      {therapy.duration_minutes} 分钟
                    </span>
                    <span>·</span>
                    <span>{catLabel.label}</span>
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  className={cn(
                    "shrink-0 text-ink-faint transition-transform duration-250",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-edge/50 px-4 py-4">
                      {/* 步骤 */}
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-medium text-ink">操作步骤</p>
                        <ol className="space-y-1.5">
                          {therapy.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs text-ink-muted">
                              <span className="shrink-0 font-mono text-primary/60">
                                {i + 1}.
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* 原理 */}
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-ink">原理</p>
                        <p className="text-xs leading-relaxed text-ink-muted">
                          {therapy.principle}
                        </p>
                      </div>

                      {/* 工具 */}
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-ink">需要准备</p>
                        <div className="flex flex-wrap gap-1.5">
                          {therapy.tools.map((tool, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-edge/40 px-2 py-0.5 text-[10px] text-ink-muted"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 文献来源 */}
                      <p className="mb-3 text-[10px] text-ink-faint">
                        文献：{therapy.evidence}
                      </p>

                      {/* 适合阶段 */}
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-ink-faint">适合阶段：</span>
                        {therapy.phases.map((ph) => {
                          const cfg = getPhaseConfig(ph);
                          return (
                            <span
                              key={ph}
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px]",
                                cfg.badgeClass,
                              )}
                            >
                              {cfg.label}
                            </span>
                          );
                        })}
                      </div>

                      {/* 一键转为协议 */}
                      <button
                        onClick={() => handleAddAsProtocol(therapy)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
                      >
                        <Plus size={14} />
                        收为我的协议
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[10px] text-ink-faint">
        所有疗法基于同行评审文献 · 非诊断 · 严重困扰请咨询专业人士
      </p>
    </motion.section>
  );
}
