import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { PersonalRule } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

const EMPTY_RULE = { signal: "", understanding: "", support: "" };

const ADHD_UNDERSTANDING_KEYS: StringKey[] = [
  "rule_book_adhd_und_0",
  "rule_book_adhd_und_1",
  "rule_book_adhd_und_2",
  "rule_book_adhd_und_3",
  "rule_book_adhd_und_4",
];

const ADHD_SUPPORT_KEYS: StringKey[] = [
  "rule_book_adhd_sup_0",
  "rule_book_adhd_sup_1",
  "rule_book_adhd_sup_2",
  "rule_book_adhd_sup_3",
  "rule_book_adhd_sup_4",
  "rule_book_adhd_sup_5",
];

export default function RuleBook() {
  const rules = useStore((state) => state.personalRules);
  const neuroType = useStore((state) => state.neuroType);
  const addRule = useStore((state) => state.addPersonalRule);
  const updateRule = useStore((state) => state.updatePersonalRule);
  const reinforceRule = useStore((state) => state.reinforcePersonalRule);
  const deleteRule = useStore((state) => state.deletePersonalRule);
  const ruleSeed = useStore((state) => state.ruleSeed);
  const clearRuleSeed = useStore((state) => state.clearRuleSeed);
  const { tr } = useT();
  const [creating, setCreating] = useState(rules.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_RULE);
  const [formStep, setFormStep] = useState(0);

  useEffect(() => {
    if (!ruleSeed) return;
    setCreating(true);
    setEditingId(null);
    setDraft({ ...EMPTY_RULE, signal: ruleSeed });
    setFormStep(1);
    clearRuleSeed();
  }, [clearRuleSeed, ruleSeed]);

  const startEdit = (rule: PersonalRule) => {
    setEditingId(rule.id);
    setCreating(false);
    setDraft({
      signal: rule.signal,
      understanding: rule.understanding,
      support: rule.support,
    });
    setFormStep(0);
  };

  const closeForm = () => {
    setCreating(false);
    setEditingId(null);
    setDraft(EMPTY_RULE);
    setFormStep(0);
  };

  const save = () => {
    if (!draft.signal.trim() || !draft.understanding.trim() || !draft.support.trim()) return;
    if (editingId) updateRule(editingId, draft);
    else addRule(draft);
    closeForm();
  };

  const formOpen = creating || editingId !== null;
  const starter = neuroType === "adhd"
    ? {
        signal: tr("rule_book_starter_adhd_signal"),
        understanding: tr("rule_book_starter_adhd_und"),
        support: tr("rule_book_starter_adhd_sup"),
      }
    : neuroType === "asd"
      ? {
          signal: tr("rule_book_starter_asd_signal"),
          understanding: tr("rule_book_starter_asd_und"),
          support: tr("rule_book_starter_asd_sup"),
        }
      : {
          signal: tr("rule_book_starter_other_signal"),
          understanding: tr("rule_book_starter_other_und"),
          support: tr("rule_book_starter_other_sup"),
        };

  const understandingOptions = ADHD_UNDERSTANDING_KEYS.map((k) => tr(k));
  const supportOptions = ADHD_SUPPORT_KEYS.map((k) => tr(k));

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium text-primary">{tr("rule_book_label")}</p>
          <h2 className="mt-1 font-serif text-2xl text-ink">{tr("rule_book_title")}</h2>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setDraft(EMPTY_RULE);
              setFormStep(0);
            }}
            className="flex min-h-10 items-center gap-1.5 rounded-full border border-edge bg-white/60 px-3 text-xs text-primary"
          >
            <Plus size={14} /> {tr("rule_book_new")}
          </button>
        )}
      </div>

      {formOpen && (
        <div className="rounded-card border border-primary/20 bg-primary-mist/20 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {editingId ? tr("rule_book_edit_title") : tr("rule_book_create_title")}
            </p>
            <button type="button" onClick={closeForm} aria-label={tr("close")} className="text-ink-muted">
              <X size={18} />
            </button>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-ink-muted">{tr("rule_book_step_of", { current: formStep + 1 })}</span>
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((step) => (
                <span key={step} className={cn("h-1.5 w-7 rounded-full", step <= formStep ? "bg-primary" : "bg-edge")} />
              ))}
            </div>
          </div>
          {!editingId && formStep === 0 && !draft.signal && (
            <button
              type="button"
              onClick={() => setDraft(starter)}
              className="mb-4 rounded-full border border-primary/20 bg-white/60 px-3 py-1.5 text-xs text-primary"
            >
              {tr("rule_book_use_example")}
            </button>
          )}
          {formStep === 0 && (
            <RuleInput
              label={tr("rule_book_signal_label")}
              placeholder={tr("rule_book_signal_placeholder")}
              value={draft.signal}
              onChange={(signal) => setDraft((value) => ({ ...value, signal }))}
            />
          )}
          {formStep === 1 && (
            <>
              <RuleInput
                label={tr("rule_book_und_label")}
                placeholder={tr("rule_book_und_placeholder")}
                value={draft.understanding}
                onChange={(understanding) => setDraft((value) => ({ ...value, understanding }))}
              />
              {neuroType === "adhd" && (
                <RuleChoices
                  label={tr("rule_book_und_choices_label")}
                  options={understandingOptions}
                  value={draft.understanding}
                  onSelect={(understanding) => setDraft((value) => ({ ...value, understanding }))}
                />
              )}
              {!draft.understanding && (
                <button type="button" onClick={() => setDraft((value) => ({ ...value, understanding: tr("rule_book_und_unsure") }))} className="mb-3 text-xs text-ink-muted underline underline-offset-4">
                  {tr("rule_book_und_unsure_btn")}
                </button>
              )}
            </>
          )}
          {formStep === 2 && (
            <>
              <RuleInput
                label={tr("rule_book_sup_label")}
                placeholder={tr("rule_book_sup_placeholder")}
                value={draft.support}
                onChange={(support) => setDraft((value) => ({ ...value, support }))}
              />
              {neuroType === "adhd" && (
                <RuleChoices
                  label={tr("rule_book_sup_choices_label")}
                  options={supportOptions}
                  value={draft.support}
                  onSelect={(support) => setDraft((value) => ({ ...value, support }))}
                />
              )}
              {!draft.support && (
                <button type="button" onClick={() => setDraft((value) => ({ ...value, support: tr("rule_book_sup_unknown") }))} className="mb-3 text-xs text-ink-muted underline underline-offset-4">
                  {tr("rule_book_sup_unknown_btn")}
                </button>
              )}
            </>
          )}
          <div className="mt-1 flex gap-2">
            {formStep > 0 && (
              <button type="button" onClick={() => setFormStep((step) => step - 1)} className="flex min-h-11 items-center gap-1 rounded-full border border-edge px-4 text-sm text-ink-muted">
                <ArrowLeft size={15} /> {tr("rule_book_prev")}
              </button>
            )}
            {formStep < 2 ? (
              <button
                type="button"
                onClick={() => setFormStep((step) => step + 1)}
                disabled={formStep === 0 ? !draft.signal.trim() : !draft.understanding.trim()}
                className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full bg-primary text-sm font-medium text-white disabled:bg-edge disabled:text-ink-faint"
              >
                {tr("rule_book_next")} <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={!draft.support.trim()}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white disabled:bg-edge disabled:text-ink-faint"
              >
                <Check size={16} /> {tr("rule_book_save")}
              </button>
            )}
          </div>
        </div>
      )}

      {rules.map((rule) => (
        <article key={rule.id} className="rounded-card border border-edge bg-white/55 p-5">
          <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed">
            <span className="text-ink-faint">{tr("rule_book_when")}</span>
            <span className="text-ink">{rule.signal}</span>
            <span className="text-ink-faint">{tr("rule_book_means")}</span>
            <span className="text-ink">{rule.understanding}</span>
            <span className="text-ink-faint">{tr("rule_book_helpful")}</span>
            <span className="font-medium text-primary">{rule.support}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-edge/70 pt-3">
            <button
              type="button"
              onClick={() => reinforceRule(rule.id)}
              className="flex min-h-10 items-center gap-1.5 text-xs text-sage"
            >
              <RotateCcw size={14} /> {tr("rule_book_reinforce", { count: rule.evidence_count })}
            </button>
            <div className="flex gap-1">
              <button type="button" onClick={() => startEdit(rule)} aria-label={tr("rule_book_aria_edit")} className="flex h-10 w-10 items-center justify-center text-ink-muted">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => deleteRule(rule.id)} aria-label={tr("rule_book_aria_delete")} className="flex h-10 w-10 items-center justify-center text-ink-faint">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </article>
      ))}

      {!formOpen && rules.length === 0 && (
        <button type="button" onClick={() => setCreating(true)} className="w-full rounded-card border border-dashed border-edge p-7 text-sm text-ink-muted">
          {tr("rule_book_first_rule")}
        </button>
      )}
    </section>
  );
}

function RuleChoices({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-xs text-ink-faint">{label}</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onSelect(option)}
            className={cn(
              "min-h-10 rounded-lg border px-3 py-2 text-left text-xs leading-relaxed",
              value === option
                ? "border-primary bg-primary text-white"
                : "border-edge bg-white/55 text-ink-muted",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function RuleInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs text-ink-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary/40"
      />
    </label>
  );
}
