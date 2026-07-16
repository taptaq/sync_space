import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Heart, MessageCircle, Play } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ConnectionMode = "self" | "other";
type DisplayRule = {
  id: string;
  signal: string;
  understanding?: string;
  support: string;
  source: "support" | "legacy";
};

// 连接页只做一件事：把已经验证中的支持规则用于自己或发给别人。
export default function Connection() {
  const navigate = useNavigate();
  const supportRules = useStore((state) => state.supportRules);
  const personalRules = useStore((state) => state.personalRules);
  const executeSupportRule = useStore((state) => state.executeSupportRule);
  const submitSupportFeedback = useStore((state) => state.submitSupportRuleFeedback);
  const submitPersonalFeedback = useStore((state) => state.submitRuleFeedback);
  const recordConnection = useStore((state) => state.recordConnection);
  const pushToast = useStore((state) => state.pushToast);
  const neuroType = useStore((state) => state.neuroType);
  const { tr } = useT();

  const rules: DisplayRule[] = supportRules.length > 0
    ? supportRules.map((rule) => ({
        id: rule.id,
        signal: rule.trigger,
        understanding: rule.understanding,
        support: rule.action,
        source: "support" as const,
      }))
    : personalRules.map((rule) => ({
        id: rule.id,
        signal: rule.signal,
        understanding: rule.understanding,
        support: rule.support,
        source: "legacy" as const,
      }));

  const [mode, setMode] = useState<ConnectionMode>("self");
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];

  const message = useMemo(() => {
    if (!selectedRule) return "";
    if (mode === "self") {
      if (selectedRule.source === "support") {
        return tr("connection_support_self", {
          signal: selectedRule.signal,
          support: selectedRule.support,
        });
      }
      return tr(neuroType === "adhd" ? "connection_msg_self_adhd" : "connection_msg_self", {
        signal: selectedRule.signal,
        understanding: selectedRule.understanding ?? "",
        support: selectedRule.support,
      });
    }
    if (selectedRule.source === "support") {
      return tr("connection_support_other", {
        signal: selectedRule.signal,
        support: selectedRule.support,
      });
    }
    return tr("connection_msg_other_v2", {
      signal: selectedRule.signal,
      understanding: selectedRule.understanding ?? "",
      support: selectedRule.support,
    });
  }, [mode, neuroType, selectedRule, tr]);

  const useRule = async () => {
    if (!selectedRule) return;
    if (mode === "other") {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        pushToast("error", tr("connection_toast_copy_failed"));
        return;
      }
    }
    if (selectedRule.source === "support") executeSupportRule(selectedRule.id);
    recordConnection(selectedRule.id, mode);
    setAwaitingFeedback(true);
    pushToast("success", mode === "self" ? tr("connection_toast_self_recorded") : tr("connection_toast_card_copied"));
  };

  const handleFeedback = (feedback: "helpful" | "unhelpful") => {
    if (!selectedRule) return;
    if (selectedRule.source === "support") submitSupportFeedback(selectedRule.id, feedback);
    else submitPersonalFeedback(selectedRule.id, feedback);
    setAwaitingFeedback(false);
  };

  return (
    <div className="space-y-6 pt-10">
      <header className="px-1">
        <p className="text-xs font-medium text-primary">{tr("connection_section_label")}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{tr("connection_title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{tr("connection_desc_simple")}</p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-edge bg-white/45 p-1">
        <ModeButton active={mode === "self"} icon={Heart} label={tr("connection_mode_self")} onClick={() => setMode("self")} />
        <ModeButton active={mode === "other"} icon={MessageCircle} label={tr("connection_mode_other")} onClick={() => setMode("other")} />
      </div>

      {selectedRule ? (
        <>
          {rules.length > 1 && (
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">{tr("connection_label_rule")}</span>
              <select
                value={selectedRule.id}
                onChange={(event) => setSelectedRuleId(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink"
              >
                {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.signal}</option>)}
              </select>
            </label>
          )}

          <section className={cn("border-l-4 px-5 py-4", mode === "self" ? "border-sage bg-sage-mist/20" : "border-primary bg-primary-mist/20")}>
            <p className="text-base leading-8 text-ink">{message}</p>
            <button type="button" onClick={useRule} className="mt-4 flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-base">
              {mode === "self" ? <Play size={16} /> : copied ? <Check size={16} /> : <Copy size={16} />}
              {mode === "self" ? tr("connection_btn_complete_self") : copied ? tr("connection_btn_copied") : tr("connection_btn_copy_card")}
            </button>
          </section>

          {awaitingFeedback && (
            <section className="border-l-2 border-sage pl-4">
              <p className="text-sm font-medium text-ink">{tr("connection_feedback_q")}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => handleFeedback("helpful")} className="min-h-11 flex-1 rounded-full bg-sage text-sm text-white">{tr("connection_feedback_helpful")}</button>
                <button type="button" onClick={() => handleFeedback("unhelpful")} className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 text-sm text-ink-muted">{tr("connection_feedback_unhelpful")}</button>
              </div>
            </section>
          )}
        </>
      ) : (
        <button type="button" onClick={() => navigate("/climate")} className="w-full rounded-card border border-primary/20 bg-white/55 p-5 text-left">
          <p className="text-sm font-medium text-ink">{tr("connection_empty_title")}</p>
          <p className="mt-1 text-xs text-ink-muted">{tr("connection_empty_desc")}</p>
        </button>
      )}

      <p className="px-5 text-center text-xs leading-relaxed text-ink-faint">{tr("connection_footer")}</p>
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
