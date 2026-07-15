import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Heart, Layers, MessageCircle, UserRound, Volume2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import LoopProgressCard from "@/components/connection/LoopProgressCard";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

type ConnectionMode = "self" | "other";
type ConnectionStyle = "short" | "voice" | "full";

const PREFERENCE_OPTIONS: Record<"asd" | "adhd" | "other", StringKey[]> = {
  asd: ["connection_pref_asd_0", "connection_pref_asd_1", "connection_pref_asd_2", "connection_pref_asd_3"],
  adhd: ["connection_pref_adhd_0", "connection_pref_adhd_1", "connection_pref_adhd_2", "connection_pref_adhd_3"],
  other: ["connection_pref_other_0", "connection_pref_other_1", "connection_pref_other_2", "connection_pref_other_3"],
};

const ADHD_REQUESTS: StringKey[] = [
  "connection_adhd_req_0",
  "connection_adhd_req_1",
  "connection_adhd_req_2",
  "connection_adhd_req_3",
];

export default function Connection() {
  const navigate = useNavigate();
  const rules = useStore((state) => state.personalRules);
  const neuroType = useStore((state) => state.neuroType);
  const pushToast = useStore((state) => state.pushToast);
  const recordConnection = useStore((state) => state.recordConnection);
  const preferences = useStore((state) => state.connectionPreferences);
  const setPreferences = useStore((state) => state.setConnectionPreferences);
  const submitRuleFeedback = useStore((state) => state.submitRuleFeedback);
  const { tr } = useT();
  const [mode, setMode] = useState<ConnectionMode>("self");
  const [connectionStyle, setConnectionStyle] = useState<ConnectionStyle>(neuroType === "adhd" ? "short" : "full");
  const [adhdRequest, setAdhdRequest] = useState<StringKey>(ADHD_REQUESTS[0]);
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<"helpful" | "unhelpful" | null>(null);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];

  const message = useMemo(() => {
    if (!selectedRule) return tr("connection_msg_no_rule");
    if (mode === "self") {
      if (neuroType === "adhd") {
        return tr("connection_msg_self_adhd", {
          signal: selectedRule.signal,
          understanding: selectedRule.understanding,
          support: selectedRule.support,
        });
      }
      return tr("connection_msg_self", {
        signal: selectedRule.signal,
        understanding: selectedRule.understanding,
        support: selectedRule.support,
      });
    }
    const translatedPrefs = preferences.map((p) => tr(p as StringKey));
    const preferenceText = translatedPrefs.length > 0
      ? tr("connection_prefs_prefix", { prefs: translatedPrefs.join(tr("connection_prefs_join")) })
      : "";
    if (neuroType === "adhd" && connectionStyle === "short") {
      return tr("connection_msg_other_adhd_short", {
        signal: selectedRule.signal,
        request: tr(adhdRequest),
        prefs: preferenceText,
      });
    }
    if (neuroType === "adhd" && connectionStyle === "voice") {
      const extra = preferenceText || tr("connection_msg_other_adhd_voice_default");
      return tr("connection_msg_other_adhd_voice", {
        signal: selectedRule.signal,
        understanding: selectedRule.understanding,
        request: tr(adhdRequest),
        extra,
      });
    }
    return tr("connection_msg_other_full", {
      signal: selectedRule.signal,
      understanding: selectedRule.understanding,
      support: selectedRule.support,
      prefs: preferenceText,
    });
  }, [adhdRequest, connectionStyle, mode, neuroType, preferences, selectedRule, tr]);

  const preferenceOptions: StringKey[] = neuroType === "asd"
    ? PREFERENCE_OPTIONS.asd
    : neuroType === "adhd"
      ? PREFERENCE_OPTIONS.adhd
      : PREFERENCE_OPTIONS.other;

  const togglePreference = (preference: string) => {
    setPreferences(
      preferences.includes(preference)
        ? preferences.filter((item) => item !== preference)
        : [...preferences, preference],
    );
  };

  const completeConnection = async () => {
    if (!selectedRule) return;
    if (mode === "self") {
      recordConnection(selectedRule.id, mode);
      setCopied(true);
      setAwaitingFeedback(true);
      setLastFeedback(null);
      pushToast("success", tr("connection_toast_self_recorded"));
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      recordConnection(selectedRule.id, mode);
      setCopied(true);
      setAwaitingFeedback(true);
      setLastFeedback(null);
      pushToast("success", tr("connection_toast_card_copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast("error", tr("connection_toast_copy_failed"));
    }
  };

  const handleFeedback = (feedback: "helpful" | "unhelpful") => {
    if (!selectedRule) return;
    submitRuleFeedback(selectedRule.id, feedback);
    setAwaitingFeedback(false);
    setLastFeedback(feedback);
    pushToast("success", feedback === "helpful" ? tr("connection_toast_helpful") : tr("connection_toast_unhelpful"));
  };

  return (
    <div className="space-y-6 pt-10">
      <header className="px-1">
        <p className="text-xs font-medium text-primary">{tr("connection_section_label")}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{tr("connection_title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{tr("connection_desc")}</p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-edge bg-white/45 p-1">
        <ModeButton active={mode === "self"} icon={Heart} label={tr("connection_mode_self")} onClick={() => setMode("self")} />
        <ModeButton active={mode === "other"} icon={MessageCircle} label={tr("connection_mode_other")} onClick={() => setMode("other")} />
      </div>

      {rules.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-xs text-ink-muted">{tr("connection_label_rule")}</span>
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

      {mode === "other" && (
        <section className="space-y-4">
          {neuroType === "adhd" && (
            <>
              <div>
                <p className="mb-2 text-xs text-ink-muted">{tr("connection_label_style")}</p>
                <div className="grid grid-cols-3 rounded-lg border border-edge bg-white/45 p-1">
                  <StyleButton active={connectionStyle === "short"} label={tr("connection_style_short")} onClick={() => setConnectionStyle("short")} />
                  <StyleButton active={connectionStyle === "voice"} label={tr("connection_style_voice")} onClick={() => setConnectionStyle("voice")} isVoice />
                  <StyleButton active={connectionStyle === "full"} label={tr("connection_style_full")} onClick={() => setConnectionStyle("full")} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-ink-muted">{tr("connection_label_request")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {ADHD_REQUESTS.map((request) => (
                    <button
                      key={request}
                      type="button"
                      aria-pressed={adhdRequest === request}
                      onClick={() => setAdhdRequest(request)}
                      className={cn(
                        "min-h-11 rounded-lg border px-3 py-2 text-left text-xs",
                        adhdRequest === request ? "border-primary bg-primary text-white" : "border-edge bg-white/55 text-ink-muted",
                      )}
                    >
                      {tr(request)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
          <p className="mb-2 text-xs text-ink-muted">{tr("connection_label_prefs")}</p>
          <div className="flex flex-wrap gap-2">
            {preferenceOptions.map((preference) => {
              const selected = preferences.includes(preference);
              return (
                <button
                  key={preference}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => togglePreference(preference)}
                  className={cn(
                    "min-h-10 rounded-full border px-3 text-xs",
                    selected ? "border-primary bg-primary text-white" : "border-edge bg-white/55 text-ink-muted",
                  )}
                >
                  {tr(preference)}
                </button>
              );
            })}
          </div>
          </div>
        </section>
      )}

      <section className={cn("border-l-4 px-5 py-4", mode === "self" ? "border-sage bg-sage-mist/20" : "border-primary bg-primary-mist/20")}>
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-ink-muted">
          {mode === "self" ? <UserRound size={15} /> : <MessageCircle size={15} />}
          {mode === "self" ? tr("connection_section_self") : tr("connection_section_other")}
        </div>
        <p className="whitespace-pre-line text-base leading-8 text-ink">{message}</p>
        {selectedRule && (
          <button
            type="button"
            onClick={completeConnection}
            className="mt-4 flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied
              ? mode === "self" ? tr("connection_btn_done") : tr("connection_btn_copied")
              : mode === "self" ? tr("connection_btn_complete_self") : tr("connection_btn_copy_card")}
          </button>
        )}
      </section>

      {selectedRule && awaitingFeedback && (
        <section className="border-l-2 border-sage pl-4">
          <p className="text-sm font-medium text-ink">{tr("connection_feedback_q")}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => handleFeedback("helpful")} className="min-h-11 flex-1 rounded-full bg-sage text-sm text-white">
              {tr("connection_feedback_helpful")}
            </button>
            <button type="button" onClick={() => handleFeedback("unhelpful")} className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 text-sm text-ink-muted">
              {tr("connection_feedback_unhelpful")}
            </button>
          </div>
        </section>
      )}

      {selectedRule && lastFeedback === "unhelpful" && (
        <button type="button" onClick={() => navigate("/climate")} className="w-full text-left text-sm text-primary underline underline-offset-4">
          {tr("connection_link_fix_rule")}
        </button>
      )}

      {rules.length === 0 && (
        <button type="button" onClick={() => navigate("/climate")} className="w-full rounded-card border border-primary/20 bg-white/55 p-5 text-left">
          <p className="text-sm font-medium text-ink">{tr("connection_empty_title")}</p>
          <p className="mt-1 text-xs text-ink-muted">{tr("connection_empty_desc")}</p>
        </button>
      )}

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => navigate("/protocol")} className="min-h-24 rounded-card border border-edge bg-white/50 p-4 text-left">
          <Layers size={18} className="text-primary" />
          <p className="mt-3 text-sm font-medium text-ink">{tr("connection_card_protocols")}</p>
          <p className="mt-1 text-xs text-ink-muted">{tr("connection_card_protocols_desc")}</p>
        </button>
        <button type="button" onClick={() => navigate("/review")} className="min-h-24 rounded-card border border-edge bg-white/50 p-4 text-left">
          <MessageCircle size={18} className="text-sage" />
          <p className="mt-3 text-sm font-medium text-ink">{tr("connection_card_review")}</p>
          <p className="mt-1 text-xs text-ink-muted">{tr("connection_card_review_desc")}</p>
        </button>
      </section>

      <LoopProgressCard />

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

function StyleButton({ active, label, onClick, isVoice }: { active: boolean; label: string; onClick: () => void; isVoice?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-10 items-center justify-center gap-1 rounded-md text-xs", active ? "bg-white text-primary shadow-sm" : "text-ink-muted")}>
      {isVoice && <Volume2 size={13} />} {label}
    </button>
  );
}
