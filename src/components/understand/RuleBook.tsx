import { useState } from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { PersonalRule } from "@/types";
import { useStore } from "@/store/useStore";

const EMPTY_RULE = { signal: "", understanding: "", support: "" };

export default function RuleBook() {
  const rules = useStore((state) => state.personalRules);
  const neuroType = useStore((state) => state.neuroType);
  const addRule = useStore((state) => state.addPersonalRule);
  const updateRule = useStore((state) => state.updatePersonalRule);
  const reinforceRule = useStore((state) => state.reinforcePersonalRule);
  const deleteRule = useStore((state) => state.deletePersonalRule);
  const [creating, setCreating] = useState(rules.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_RULE);

  const startEdit = (rule: PersonalRule) => {
    setEditingId(rule.id);
    setCreating(false);
    setDraft({
      signal: rule.signal,
      understanding: rule.understanding,
      support: rule.support,
    });
  };

  const closeForm = () => {
    setCreating(false);
    setEditingId(null);
    setDraft(EMPTY_RULE);
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
          {!editingId && !draft.signal && (
            <button
              type="button"
              onClick={() => setDraft(starter)}
              className="mb-4 rounded-full border border-primary/20 bg-white/60 px-3 py-1.5 text-xs text-primary"
            >
              用一个例子开始
            </button>
          )}
          <RuleInput
            label="当我出现"
            placeholder="例如：开始反复看同一个地方"
            value={draft.signal}
            onChange={(signal) => setDraft((value) => ({ ...value, signal }))}
          />
          <RuleInput
            label="这通常意味着"
            placeholder="例如：信息已经太多，不是不配合"
            value={draft.understanding}
            onChange={(understanding) => setDraft((value) => ({ ...value, understanding }))}
          />
          <RuleInput
            label="对我有帮助的是"
            placeholder="例如：停止提问，给我十分钟安静"
            value={draft.support}
            onChange={(support) => setDraft((value) => ({ ...value, support }))}
          />
          <button
            type="button"
            onClick={save}
            disabled={!draft.signal.trim() || !draft.understanding.trim() || !draft.support.trim()}
            className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white disabled:bg-edge disabled:text-ink-faint"
          >
            <Check size={16} /> 保存这版理解
          </button>
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
