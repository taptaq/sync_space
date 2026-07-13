import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { PersonalRule } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const EMPTY_RULE = { signal: "", understanding: "", support: "" };

const ADHD_UNDERSTANDING_OPTIONS = [
  "一直拖延，不等于故意逃避；时间和启动信号可能没有外显",
  "想了很多，不等于什么都没做；我已经在规划，但第一步仍然太大",
  "犯错，不等于我很差；它提示工作记忆或环境需要外部支持",
  "焦虑，不等于没有能力；我在意结果，也需要把风险和截止点写出来",
  "不想努力，不等于懒；当前精力可能与任务不匹配",
];

const ADHD_SUPPORT_OPTIONS = [
  "把时间和截止点放到眼前",
  "只做第一个毫无压力的小步骤",
  "使用固定启动仪式，不等动力出现",
  "把常用物品放回固定位置",
  "请信任的人陪我开始，但不要催完成",
  "完成一个小步骤后，立刻给自己喜欢的反馈",
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
        signal: "在几个窗口之间反复切换",
        understanding: "工作记忆已经装不下，不是我不够努力",
        support: "把下一步写在眼前，只保留一个窗口",
      }
    : neuroType === "asd"
      ? {
          signal: "声音开始刺痛，回答变慢",
          understanding: "感官负载正在累积，不是不愿意回应",
          support: "先降低声音，暂停提问十分钟",
        }
      : {
          signal: "开始反复卡在同一件事上",
          understanding: "当前余力已经不足，需要降低要求",
          support: "只留下一个最小动作，其他稍后处理",
        };

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-medium text-primary">不断更新的理解</p>
          <h2 className="mt-1 font-serif text-2xl text-ink">我的个人规则</h2>
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
            <Plus size={14} /> 新理解
          </button>
        )}
      </div>

      {formOpen && (
        <div className="rounded-card border border-primary/20 bg-primary-mist/20 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              {editingId ? "修正这条理解" : "把一次经历写成规则"}
            </p>
            <button type="button" onClick={closeForm} aria-label="关闭" className="text-ink-muted">
              <X size={18} />
            </button>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-ink-muted">{formStep + 1} / 3</span>
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
              用一个例子开始
            </button>
          )}
          {formStep === 0 && (
            <RuleInput
              label="你观察到了什么？"
              placeholder="只写看得见的信号，例如：回答变慢"
              value={draft.signal}
              onChange={(signal) => setDraft((value) => ({ ...value, signal }))}
            />
          )}
          {formStep === 1 && (
            <>
              <RuleInput
                label="这对你可能意味着什么？"
                placeholder="可以只是一个猜测"
                value={draft.understanding}
                onChange={(understanding) => setDraft((value) => ({ ...value, understanding }))}
              />
              {neuroType === "adhd" && (
                <RuleChoices
                  label="把自责换成一个可验证的解释 · 不是找借口"
                  options={ADHD_UNDERSTANDING_OPTIONS}
                  value={draft.understanding}
                  onSelect={(understanding) => setDraft((value) => ({ ...value, understanding }))}
                />
              )}
              {!draft.understanding && (
                <button type="button" onClick={() => setDraft((value) => ({ ...value, understanding: "我还不确定，需要继续观察" }))} className="mb-3 text-xs text-ink-muted underline underline-offset-4">
                  暂时不确定
                </button>
              )}
            </>
          )}
          {formStep === 2 && (
            <>
              <RuleInput
                label="下次先怎样支持自己？"
                placeholder="只写一个最小动作"
                value={draft.support}
                onChange={(support) => setDraft((value) => ({ ...value, support }))}
              />
              {neuroType === "adhd" && (
                <RuleChoices
                  label="只选一个下次最容易尝试的支持"
                  options={ADHD_SUPPORT_OPTIONS}
                  value={draft.support}
                  onSelect={(support) => setDraft((value) => ({ ...value, support }))}
                />
              )}
              {!draft.support && (
                <button type="button" onClick={() => setDraft((value) => ({ ...value, support: "暂时降低要求，稍后再决定" }))} className="mb-3 text-xs text-ink-muted underline underline-offset-4">
                  现在还不知道
                </button>
              )}
            </>
          )}
          <div className="mt-1 flex gap-2">
            {formStep > 0 && (
              <button type="button" onClick={() => setFormStep((step) => step - 1)} className="flex min-h-11 items-center gap-1 rounded-full border border-edge px-4 text-sm text-ink-muted">
                <ArrowLeft size={15} /> 上一步
              </button>
            )}
            {formStep < 2 ? (
              <button
                type="button"
                onClick={() => setFormStep((step) => step + 1)}
                disabled={formStep === 0 ? !draft.signal.trim() : !draft.understanding.trim()}
                className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full bg-primary text-sm font-medium text-white disabled:bg-edge disabled:text-ink-faint"
              >
                下一步 <ChevronRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={!draft.support.trim()}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white disabled:bg-edge disabled:text-ink-faint"
              >
                <Check size={16} /> 保存这版理解
              </button>
            )}
          </div>
        </div>
      )}

      {rules.map((rule) => (
        <article key={rule.id} className="rounded-card border border-edge bg-white/55 p-5">
          <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 text-sm leading-relaxed">
            <span className="text-ink-faint">当我出现</span>
            <span className="text-ink">{rule.signal}</span>
            <span className="text-ink-faint">通常意味着</span>
            <span className="text-ink">{rule.understanding}</span>
            <span className="text-ink-faint">有帮助的是</span>
            <span className="font-medium text-primary">{rule.support}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-edge/70 pt-3">
            <button
              type="button"
              onClick={() => reinforceRule(rule.id)}
              className="flex min-h-10 items-center gap-1.5 text-xs text-sage"
            >
              <RotateCcw size={14} /> 这次也符合 · {rule.evidence_count}
            </button>
            <div className="flex gap-1">
              <button type="button" onClick={() => startEdit(rule)} aria-label="修改规则" className="flex h-10 w-10 items-center justify-center text-ink-muted">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={() => deleteRule(rule.id)} aria-label="删除规则" className="flex h-10 w-10 items-center justify-center text-ink-faint">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </article>
      ))}

      {!formOpen && rules.length === 0 && (
        <button type="button" onClick={() => setCreating(true)} className="w-full rounded-card border border-dashed border-edge p-7 text-sm text-ink-muted">
          记录第一条属于你的规则
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
