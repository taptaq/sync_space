import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import type { AxisKey, LocalText, Phase, ProtocolTrigger } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { getAxisProfile, getBandLabel } from "@/lib/axisConfig";
import { PHASE_MAP } from "@/lib/stageEngine";
import { useT } from "@/lib/i18n";
import { generateProtocolSuggestions } from "@/lib/qwenService";
import { Loader2, Sparkles } from "lucide-react";

// 创建新协议（PRD §05 F-06 协议管理 · 手动创建）
// 轴选项按神经特质动态生成

export default function ProtocolNew() {
  const navigate = useNavigate();
  const addProtocol = useStore((s) => s.addProtocol);
  const neuroType = useStore((s) => s.neuroType);
  const qwenEnabled = useStore((s) => s.qwenEnabled);
  const { tr, tt } = useT();
  const profile = getAxisProfile(neuroType);
  const AXIS_OPTIONS: { key: AxisKey | "none"; label: LocalText | string }[] = [
    ...profile.axes.map((a) => ({ key: a.key, label: a.label })),
    { key: "none", label: tr("protocol_new_axis_behavior") },
  ];

  const [axis, setAxis] = useState<AxisKey | "none">("sensory");
  const [operator, setOperator] = useState<">" | "<">(">");
  const [value, setValue] = useState(7);
  const [triggerDesc, setTriggerDesc] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [duration, setDuration] = useState(15);
  const [timer, setTimer] = useState(true);
  // 适用的阶段标签（不选 = 全阶段通用）
  const [phases, setPhases] = useState<Phase[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ text: string; duration_minutes: number; source: string }>>([]);
  const [suggesting, setSuggesting] = useState(false);

  const togglePhase = (p: Phase) => {
    setPhases((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  };

  const axisLabelStr = (key: AxisKey | "none"): string => {
    const found = AXIS_OPTIONS.find((a) => a.key === key);
    return found ? tt(found.label) : "";
  };

  const autoTriggerDesc =
    axis === "none"
      ? triggerDesc || tr("protocol_new_trigger_placeholder")
      : `${axisLabelStr(axis)} ${operator} ${value}`;

  // 当前选中轴的程度描述（让数值有体感）
  const selectedAxis = profile.axes.find((a) => a.key === axis);
  const bandLabel =
    axis !== "none" && selectedAxis ? getBandLabel(value, selectedAxis) : null;

  const handleSubmit = () => {
    const triggerDescText = triggerDesc || tr("protocol_new_trigger_default");
    const trigger: ProtocolTrigger =
      axis === "none"
        ? { type: "behavior", description: { zh: triggerDescText, en: triggerDescText } }
        : {
            type: "threshold",
            axis,
            operator,
            value,
            description: { zh: autoTriggerDesc, en: autoTriggerDesc },
          };

    addProtocol({
      trigger,
      action: {
        description: { zh: actionDesc, en: actionDesc },
        duration_minutes: duration,
        timer,
      },
      source: "manual",
      status: "active",
      phases: phases.length > 0 ? phases : undefined,
    });
    navigate("/climate");
  };

  const canSubmit = actionDesc.trim().length > 0;

  const handleAiSuggest = async () => {
    const triggerText = axis === "none" ? triggerDesc : autoTriggerDesc;
    if (!triggerText.trim()) return;
    setSuggesting(true);
    try {
      const result = await generateProtocolSuggestions(triggerText, neuroType, phases);
      setSuggestions(result);
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggestion = (s: { text: string; duration_minutes: number }) => {
    setActionDesc(s.text);
    if (s.duration_minutes > 0) setDuration(s.duration_minutes);
  };

  return (
    <div className="space-y-5 pt-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-white/50 text-ink-muted transition-all duration-250 hover:bg-white/80"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">
            {tr("protocol_new_header")}
          </p>
          <p className="font-serif text-xl text-ink">{tr("protocol_new")}</p>
        </div>
      </div>

      {/* WHEN 触发条件 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
      >
        <p className="mb-4 font-mono text-xs text-primary">
          {tr("protocol_new_when")}
        </p>

        {/* 轴选择 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {AXIS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setAxis(opt.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs transition-all duration-250",
                axis === opt.key
                  ? "bg-primary text-white"
                  : "bg-white/50 text-ink-muted hover:bg-white/80",
              )}
            >
              {tt(opt.label)}
            </button>
          ))}
        </div>

        {axis !== "none" ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as ">" | "<")}
                className="rounded-full border border-edge bg-base px-3 py-1.5 text-small text-ink"
              >
                <option value=">">{tr("protocol_new_op_gt")}</option>
                <option value="<">{tr("protocol_new_op_lt")}</option>
              </select>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-10 text-center font-mono text-lg text-primary">
                {value}
              </span>
            </div>
            {/* 程度描述：让数值有体感 */}
            <div className="flex items-center gap-2 px-1">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  value <= 3
                    ? "bg-sage-mist/60 text-sage"
                    : value <= 6
                      ? "bg-clay-mist/50 text-clay"
                      : "bg-warn-mist/50 text-warn",
                )}
              >
                {bandLabel ? tt(bandLabel) : ""}
              </span>
              <span className="text-xs text-ink-faint">
                {selectedAxis ? tt(selectedAxis.hint) : ""} {tr("protocol_new_range_hint")}
              </span>
            </div>
          </div>
        ) : (
          <input
            type="text"
            value={triggerDesc}
            onChange={(e) => setTriggerDesc(e.target.value)}
            placeholder={tr("protocol_new_trigger_example")}
            className="w-full rounded-card border border-edge bg-base/60 px-3 py-2.5 text-body text-ink placeholder:text-ink-faint"
          />
        )}

        {/* 预览 */}
        <div className="mt-4 rounded-card bg-primary-mist/40 p-3">
          <p className="text-small text-ink-muted">{tr("protocol_new_trigger_preview")}</p>
          <p className="mt-1 font-mono text-xs text-primary">
            {autoTriggerDesc}
            {axis !== "none" && bandLabel && `（${tt(bandLabel)}）`}
          </p>
        </div>
      </motion.section>

      {/* THEN 约定动作 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
      >
        <p className="mb-4 font-mono text-xs text-sage">{tr("protocol_new_then")}</p>

        {/* AI 参考建议 */}
        {qwenEnabled ? (
          <div className="mb-3">
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={suggesting || (axis === "none" ? triggerDesc.trim().length === 0 : autoTriggerDesc.length === 0)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs transition-all duration-250",
                suggesting || (axis === "none" ? triggerDesc.trim().length === 0 : autoTriggerDesc.length === 0)
                  ? "cursor-not-allowed bg-edge text-ink-muted"
                  : "bg-primary-mist/50 text-primary hover:bg-primary-mist/70"
              )}
            >
              {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {suggesting ? tr("protocol_new_ai_loading") : tr("protocol_new_ai_suggest")}
            </button>

            {suggestions.length > 0 && (
              <div className="mt-2 space-y-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className="flex w-full items-start gap-2 rounded-lg border border-edge bg-white/50 p-2.5 text-left text-xs text-ink hover:bg-white/70"
                  >
                    <Sparkles size={12} className="mt-0.5 shrink-0 text-primary" />
                    <span className="flex-1 leading-5">{s.text} · {s.duration_minutes}min</span>
                    {s.source === "template" && (
                      <span className="shrink-0 rounded-full bg-edge/40 px-1.5 py-0.5 text-[9px] text-ink-faint">{tr("protocol_new_ai_fallback")}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="mb-3 rounded-full bg-edge/40 px-3 py-2 text-xs text-ink-muted">{tr("protocol_new_ai_disabled")}</p>
        )}

        <textarea
          value={actionDesc}
          onChange={(e) => setActionDesc(e.target.value)}
          placeholder={tr("protocol_new_action_example")}
          rows={3}
          className="w-full resize-none rounded-card border border-edge bg-base/60 p-3 text-body leading-relaxed text-ink placeholder:text-ink-faint"
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-small text-ink-muted">{tr("protocol_new_timer_label")}</span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-16 rounded-full border border-edge bg-base px-3 py-1.5 text-center font-mono text-small text-ink"
            />
            <button
              onClick={() => setTimer((v) => !v)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs transition-all duration-250",
                timer
                  ? "bg-sage text-white"
                  : "bg-white/50 text-ink-muted",
              )}
            >
              {timer ? tr("protocol_new_timer_on") : tr("protocol_new_timer_off")}
            </button>
          </div>
        </div>
      </motion.section>

      {/* 适用阶段（可选 · 不选 = 全阶段通用） */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
      >
        <p className="mb-1 font-mono text-xs text-clay">
          {tr("protocol_new_for")}
        </p>
        <p className="mb-3 text-xs text-ink-muted">
          {tr("protocol_new_for_desc")}
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PHASE_MAP) as Phase[]).map((p) => {
            const cfg = PHASE_MAP[p];
            const selected = phases.includes(p);
            return (
              <button
                key={p}
                onClick={() => togglePhase(p)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs transition-all duration-250",
                  selected
                    ? cfg.badgeClass
                    : "bg-white/50 text-ink-muted hover:bg-white/80",
                )}
              >
                {tt(cfg.label)}
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* 协议预览 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-bowl bg-sage-mist/40 p-5"
      >
        <p className="mb-2 text-xs uppercase tracking-widest text-sage">
          {tr("protocol_new_preview")}
        </p>
        <p className="font-mono text-xs text-primary">
          WHEN · {autoTriggerDesc}
        </p>
        <p className="mt-1.5 text-body text-ink">
          {actionDesc || tr("protocol_new_action_placeholder")}
          {timer && duration > 0 && ` · ${duration} ${tr("protocol_new_timer_suffix")}`}
        </p>
        {phases.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {phases.map((p) => (
              <span
                key={p}
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  PHASE_MAP[p].badgeClass,
                )}
              >
                {tt(PHASE_MAP[p].label)}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-body font-medium transition-all duration-250",
          canSubmit
            ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
            : "cursor-not-allowed bg-edge text-ink-muted",
        )}
      >
        <Check size={18} /> {tr("protocol_new_save")}
      </button>

      <p className="px-4 pb-4 text-center text-xs leading-relaxed text-ink-muted">
        {tr("protocol_new_footer_1")}
        <br />
        {tr("protocol_new_footer_2")}
      </p>
    </div>
  );
}
