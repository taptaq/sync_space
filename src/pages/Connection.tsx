import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Heart, Layers, MessageCircle, UserRound } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import LoopProgressCard from "@/components/connection/LoopProgressCard";

type ConnectionMode = "self" | "other";

export default function Connection() {
  const navigate = useNavigate();
  const rules = useStore((state) => state.personalRules);
  const pushToast = useStore((state) => state.pushToast);
  const recordConnection = useStore((state) => state.recordConnection);
  const [mode, setMode] = useState<ConnectionMode>("self");
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];

  const message = useMemo(() => {
    if (!selectedRule) return "先在“理解”里写下一条属于你的个人规则。";
    if (mode === "self") {
      return `我注意到：${selectedRule.signal}。这通常意味着：${selectedRule.understanding}。现在先做：${selectedRule.support}。`;
    }
    return `我现在出现了这个信号：${selectedRule.signal}。对我来说，这通常意味着：${selectedRule.understanding}。请先这样支持我：${selectedRule.support}。我恢复后会再连接。`;
  }, [mode, selectedRule]);

  const completeConnection = async () => {
    if (!selectedRule) return;
    if (mode === "self") {
      recordConnection(selectedRule.id, mode);
      setCopied(true);
      pushToast("success", "已记下这次自我连接");
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      recordConnection(selectedRule.id, mode);
      setCopied(true);
      pushToast("success", "连接卡已复制");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast("error", "复制失败，请长按文字复制");
    }
  };

  return (
    <div className="space-y-6 pt-10">
      <header className="px-1">
        <p className="text-xs font-medium text-primary">03 · 重新建立联系</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">连接</h1>
        <p className="mt-1 text-sm text-ink-muted">先照顾自己，再让别人知道怎样靠近你。</p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-edge bg-white/45 p-1">
        <ModeButton active={mode === "self"} icon={Heart} label="连接自己" onClick={() => setMode("self")} />
        <ModeButton active={mode === "other"} icon={MessageCircle} label="连接他人" onClick={() => setMode("other")} />
      </div>

      {rules.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs text-ink-muted">这次使用哪条理解</span>
          <select
            value={selectedRule?.id ?? ""}
            onChange={(event) => setSelectedRuleId(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink"
          >
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>{rule.signal}</option>
            ))}
          </select>
        </label>
      )}

      <section className={cn("border-l-4 px-5 py-4", mode === "self" ? "border-sage bg-sage-mist/20" : "border-primary bg-primary-mist/20")}>
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-ink-muted">
          {mode === "self" ? <UserRound size={15} /> : <MessageCircle size={15} />}
          {mode === "self" ? "给此刻的自己" : "给我信任的人"}
        </div>
        <p className="text-base leading-8 text-ink">{message}</p>
        {selectedRule && (
          <button
            type="button"
            onClick={completeConnection}
            className="mt-4 flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied
              ? mode === "self" ? "已完成" : "已复制"
              : mode === "self" ? "完成这次连接" : "复制连接卡"}
          </button>
        )}
      </section>

      {rules.length === 0 && (
        <button type="button" onClick={() => navigate("/climate")} className="w-full rounded-card border border-primary/20 bg-white/55 p-5 text-left">
          <p className="text-sm font-medium text-ink">先形成第一条个人规则</p>
          <p className="mt-1 text-xs text-ink-muted">从一次真实经历开始，不需要一次想明白。</p>
        </button>
      )}

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => navigate("/protocol")} className="min-h-24 rounded-card border border-edge bg-white/50 p-4 text-left">
          <Layers size={18} className="text-primary" />
          <p className="mt-3 text-sm font-medium text-ink">支持协议</p>
          <p className="mt-1 text-xs text-ink-muted">把连接变成行动</p>
        </button>
        <button type="button" onClick={() => navigate("/review")} className="min-h-24 rounded-card border border-edge bg-white/50 p-4 text-left">
          <MessageCircle size={18} className="text-sage" />
          <p className="mt-3 text-sm font-medium text-ink">回看经历</p>
          <p className="mt-1 text-xs text-ink-muted">带着新理解再看</p>
        </button>
      </section>

      <LoopProgressCard />

      <p className="px-5 text-center text-xs leading-relaxed text-ink-faint">连接卡由你决定是否分享，也可以只留给自己。</p>
    </div>
  );
}

function ModeButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Heart; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-md text-sm", active ? "bg-white text-primary shadow-sm" : "text-ink-muted")}>
      <Icon size={16} /> {label}
    </button>
  );
}
