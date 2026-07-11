import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, Clock, ChevronDown, Plus, Eye } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  PROTOCOL_TEMPLATES,
  getTemplatesByNeuroType,
  sortTemplatesByPhase,
  templateToProtocol,
  TEMPLATE_CATEGORY_LABELS,
  type ProtocolTemplate,
} from "@/lib/protocolTemplates";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";
import type { NeuroType } from "@/types";

// 协议模板库（基于学术文献 · 非诊断 · 辅助自我调节）
// 按神经特质过滤 + 当前阶段优先推荐
// 每条模板可一键导入为协议候选

// 神经特质标签（用于"适合 X"切换按钮）
const NEURO_TYPE_LABELS: Record<NeuroType, string> = {
  asd: "ASD",
  adhd: "ADHD",
  hsp: "HSP",
  ptsd: "PTSD",
  other: "通用",
};

export default function ProtocolTemplateLibrary() {
  const neuroType = useStore((s) => s.neuroType);
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);
  const addProtocol = useStore((s) => s.addProtocol);
  const pushToast = useStore((s) => s.pushToast);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const currentPhase = detectPhase(currentWeather.climate, crashMarks);
  const phaseCfg = getPhaseConfig(currentPhase);

  const templates = useMemo(() => {
    const base = showAll
      ? PROTOCOL_TEMPLATES
      : getTemplatesByNeuroType(neuroType);
    const byCategory = categoryFilter
      ? base.filter((t) => t.category === categoryFilter)
      : base;
    return sortTemplatesByPhase(byCategory, currentPhase);
  }, [neuroType, showAll, categoryFilter, currentPhase]);

  const handleImport = (template: ProtocolTemplate) => {
    addProtocol(templateToProtocol(template));
    pushToast("success", `「${template.name}」已加入协议候选`);
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
          <Layers size={18} className="text-primary" />
          <h2 className="font-serif text-xl text-ink">协议模板库</h2>
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
        基于循证研究的预设协议 · 一键导入后可自定义 · 非诊断
      </p>

      {/* 适合特质 / 看全部 切换 */}
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={cn(
            "rounded-full px-3 py-1 text-xs transition-all duration-250",
            !showAll
              ? "bg-primary text-white"
              : "bg-white/60 text-ink-muted hover:bg-primary-mist/40",
          )}
        >
          适合 {NEURO_TYPE_LABELS[neuroType]}
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-all duration-250",
            showAll
              ? "bg-primary text-white"
              : "bg-white/60 text-ink-muted hover:bg-primary-mist/40",
          )}
        >
          <Eye size={11} />
          看全部
        </button>
      </div>

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
        {Object.entries(TEMPLATE_CATEGORY_LABELS).map(
          ([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() =>
                setCategoryFilter(categoryFilter === key ? null : key)
              }
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-all duration-250",
                categoryFilter === key
                  ? "bg-primary text-white"
                  : "bg-white/60 text-ink-muted hover:bg-primary-mist/40",
              )}
            >
              {icon} {label}
            </button>
          ),
        )}
      </div>

      {/* 模板列表 */}
      <div className="space-y-2.5">
        {templates.map((template) => {
          const isExpanded = expandedId === template.id;
          const phaseMatch = template.phases.includes(currentPhase);
          const catLabel = TEMPLATE_CATEGORY_LABELS[template.category];

          return (
            <div
              key={template.id}
              className={cn(
                "rounded-card border transition-all duration-250",
                phaseMatch
                  ? "border-primary/30 bg-primary-mist/20"
                  : "border-edge bg-white/50",
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : template.id)}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-sm">
                  {catLabel.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-small font-medium text-ink">
                      {template.name}
                    </p>
                    {phaseMatch && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                        适合现在
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-faint">
                    <span className="flex items-center gap-0.5">
                      <Clock size={10} />
                      {template.action.duration_minutes} 分钟
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
                      {/* 触发条件 → 动作 */}
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-ink">
                          触发 → 动作
                        </p>
                        <p className="text-xs leading-relaxed text-ink-muted">
                          <span className="text-clay-soft">当</span>{" "}
                          {template.trigger.description}
                          {" → "}
                          <span className="text-sage">
                            {template.action.description}
                          </span>
                        </p>
                      </div>

                      {/* 为什么有效 */}
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-ink">原理</p>
                        <p className="text-xs leading-relaxed text-ink-muted">
                          {template.why}
                        </p>
                      </div>

                      {/* 文献来源 */}
                      <p className="mb-3 text-[10px] text-ink-faint">
                        文献：{template.evidence}
                      </p>

                      {/* 适合阶段 */}
                      <div className="mb-4 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-ink-faint">
                          适合阶段：
                        </span>
                        {template.phases.map((ph) => {
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

                      {/* 一键导入协议 */}
                      <button
                        onClick={() => handleImport(template)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
                      >
                        <Plus size={14} />
                        一键导入协议
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
        所有模板基于同行评审文献 · 非诊断 · 严重困扰请咨询专业人士
      </p>
    </motion.section>
  );
}
