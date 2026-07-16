import { useState } from "react";
import { Check, Play, Plus, Trash2, X, Sparkles, Loader2 } from "lucide-react";
import type { DifficultyType, SupportRule } from "@/types";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { getDifficultyLabel } from "@/lib/difficultyPacks";
import { cn } from "@/lib/utils";
import { generateProtocolSuggestions } from "@/lib/qwenService";

const DIFFICULTY_TYPES: DifficultyType[] = [
  "sensory",
  "change",
  "startup",
  "time",
  "communication",
];

type FeedbackValue = "helpful" | "neutral" | "unhelpful";

const EMPTY_FORM = { trigger: "", action: "", difficultyType: "sensory" as DifficultyType };

function getEffectiveness(rule: SupportRule): number {
  return rule.uses > 0 ? rule.helpfulCount / rule.uses : 0;
}

export default function SupportRulePanel() {
  const rules = useStore((state) => state.supportRules);
  const addRule = useStore((state) => state.addSupportRule);
  const deleteRule = useStore((state) => state.deleteSupportRule);
  const executeRule = useStore((state) => state.executeSupportRule);
  const submitFeedback = useStore((state) => state.submitSupportRuleFeedback);
  const pushToast = useStore((state) => state.pushToast);
  const neuroType = useStore((state) => state.neuroType);
  const qwenEnabled = useStore((state) => state.qwenEnabled);
  const { tr, tt } = useT();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY_FORM);
  const [feedbackRuleId, setFeedbackRuleId] = useState<string | null>(null);
  const [actionSuggestions, setActionSuggestions] = useState<Array<{ text: string; duration_minutes: number; source: string }>>([]);
  const [suggestingAction, setSuggestingAction] = useState(false);

  const sorted = [...rules].sort((a, b) => getEffectiveness(b) - getEffectiveness(a));

  const closeForm = () => {
    setAdding(false);
    setDraft(EMPTY_FORM);
    setActionSuggestions([]);
  };

  const save = () => {
    if (!draft.trigger.trim() || !draft.action.trim()) return;
    addRule({
      trigger: draft.trigger.trim(),
      action: draft.action.trim(),
      difficultyType: draft.difficultyType,
    });
    pushToast("success", tr("support_rule_added"));
    closeForm();
  };

  const handleExecute = (rule: SupportRule) => {
    executeRule(rule.id);
    setFeedbackRuleId(rule.id);
    pushToast("success", tr("support_rule_executed"));
  };

  const handleFeedback = (rule: SupportRule, feedback: FeedbackValue) => {
    submitFeedback(rule.id, feedback);
    setFeedbackRuleId(null);
    pushToast("success", tr("support_rule_feedback_saved"));
  };

  const handleSkipFeedback = () => {
    setFeedbackRuleId(null);
    pushToast("info", tr("support_rule_feedback_skip_hint"));
  };

  const handleAiSuggestAction = async () => {
    const triggerText = draft.trigger.trim();
    if (!triggerText) return;
    setSuggestingAction(true);
    try {
      const result = await generateProtocolSuggestions(triggerText, neuroType, []);
      setActionSuggestions(result);
    } finally {
      setSuggestingAction(false);
    }
  };

  const applyActionSuggestion = (s: { text: string; duration_minutes: number }) => {
    setDraft((value) => ({ ...value, action: s.text }));
    setActionSuggestions([]);
  };

  const handleDelete = (rule: SupportRule) => {
    deleteRule(rule.id);
    if (feedbackRuleId === rule.id) setFeedbackRuleId(null);
    pushToast("success", tr("support_rule_deleted"));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-serif text-2xl text-ink">{tr("support_rule_title")}</h2>
          <p className="mt-1 text-xs text-ink-muted">{tr("support_rule_desc")}</p>
        </div>
        {!adding && rules.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setDraft(EMPTY_FORM);
            }}
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-edge bg-white/60 px-3 text-xs text-primary"
          >
            <Plus size={14} /> {tr("support_rule_add")}
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-card border border-primary/20 bg-primary-mist/20 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">{tr("support_rule_add")}</p>
            <button type="button" onClick={closeForm} aria-label={tr("close")} className="text-ink-muted">
              <X size={18} />
            </button>
          </div>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-ink-muted">{tr("support_rule_trigger")}</span>
            <input
              value={draft.trigger}
              onChange={(event) => setDraft((value) => ({ ...value, trigger: event.target.value }))}
              placeholder={tr("support_rule_trigger_ph")}
              className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary/40"
            />
          </label>

          <label className="mb-3 block">
            <span className="mb-1 block text-xs text-ink-muted">{tr("support_rule_action")}</span>

            {/* AI 参考行动 */}
            {qwenEnabled && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handleAiSuggestAction}
                  disabled={suggestingAction || !draft.trigger.trim()}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs transition-all duration-250",
                    suggestingAction || !draft.trigger.trim()
                      ? "cursor-not-allowed bg-edge text-ink-muted"
                      : "bg-primary-mist/50 text-primary hover:bg-primary-mist/70"
                  )}
                >
                  {suggestingAction ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {suggestingAction ? tr("support_rule_ai_loading") : tr("support_rule_ai_suggest")}
                </button>

                {actionSuggestions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {actionSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyActionSuggestion(s)}
                        className="flex w-full items-start gap-2 rounded-lg border border-edge bg-white/50 p-2.5 text-left text-xs text-ink hover:bg-white/70"
                      >
                        <Sparkles size={12} className="mt-0.5 shrink-0 text-primary" />
                        <span className="flex-1 leading-5">{s.text} · {s.duration_minutes}min</span>
                        {s.source === "template" && (
                          <span className="shrink-0 rounded-full bg-edge/40 px-1.5 py-0.5 text-[9px] text-ink-faint">{tr("support_rule_ai_fallback")}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input
              value={draft.action}
              onChange={(event) => setDraft((value) => ({ ...value, action: event.target.value }))}
              placeholder={tr("support_rule_action_ph")}
              className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary/40"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-xs text-ink-muted">{tr("support_rule_difficulty")}</span>
            <select
              value={draft.difficultyType}
              onChange={(event) => setDraft((value) => ({ ...value, difficultyType: event.target.value as DifficultyType }))}
              className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink focus:border-primary/40"
            >
              {DIFFICULTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {tt(getDifficultyLabel(type))}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="flex min-h-11 items-center rounded-full border border-edge px-4 text-sm text-ink-muted"
            >
              {tr("support_rule_cancel")}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.trigger.trim() || !draft.action.trim()}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white disabled:bg-edge disabled:text-ink-faint"
            >
              <Check size={16} /> {tr("support_rule_save")}
            </button>
          </div>
        </div>
      )}

      {sorted.map((rule) => {
        const effectiveness = getEffectiveness(rule);
        const pendingFeedback = feedbackRuleId === rule.id;
        const difficultyLabel = rule.difficultyType ? tt(getDifficultyLabel(rule.difficultyType)) : null;
        return (
          <article key={rule.id} className="rounded-card border border-edge bg-white/55 p-5">
            {difficultyLabel && (
              <span className="mb-3 inline-block rounded-full border border-edge bg-white/60 px-2.5 py-0.5 text-xs text-ink-muted">
                {difficultyLabel}
              </span>
            )}

            <div className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed">
              <span className="text-ink-faint">{tr("support_rule_trigger")}</span>
              <span className="text-ink">{rule.trigger}</span>
              <span className="text-ink-faint">{tr("support_rule_action")}</span>
              <span className="font-medium text-primary">{rule.action}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge/70 pt-3 text-xs text-ink-muted">
              {rule.uses > 0 ? (
                <>
                  <span>{tr("support_rule_uses", { count: rule.uses })}</span>
                  <span className="text-sage">
                    {tr("support_rule_effective", { percent: Math.round(effectiveness * 100) })}
                  </span>
                </>
              ) : (
                <span className="text-ink-faint">{tr("support_rule_no_data")}</span>
              )}
            </div>

            {pendingFeedback ? (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary-mist/20 p-4">
                <p className="mb-3 text-sm text-ink">{tr("support_rule_feedback_q")}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleFeedback(rule, "helpful")}
                    className="flex min-h-10 items-center rounded-full border border-sage/30 bg-sage/10 px-3 text-xs text-sage"
                  >
                    {tr("support_rule_helpful")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(rule, "neutral")}
                    className="flex min-h-10 items-center rounded-full border border-edge bg-white/60 px-3 text-xs text-ink-muted"
                  >
                    {tr("support_rule_neutral")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedback(rule, "unhelpful")}
                    className="flex min-h-10 items-center rounded-full border border-edge bg-white/60 px-3 text-xs text-ink-muted"
                  >
                    {tr("support_rule_unhelpful")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipFeedback}
                    className="flex min-h-10 items-center rounded-full px-3 text-xs text-ink-faint underline underline-offset-4"
                  >
                    {tr("support_rule_cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleExecute(rule)}
                  className="flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-white"
                >
                  <Play size={13} /> {tr("support_rule_execute")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rule)}
                  aria-label={tr("support_rule_delete")}
                  className="flex h-10 w-10 items-center justify-center text-ink-faint"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
          </article>
        );
      })}

      {!adding && rules.length === 0 && (
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setDraft(EMPTY_FORM);
          }}
          className="w-full rounded-card border border-dashed border-edge bg-white/30 p-7 text-sm text-ink-muted"
        >
          {tr("support_rule_empty")}
        </button>
      )}
    </section>
  );
}
