import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Heart, MessageCircle } from "lucide-react";
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

// self 模式 3 步引导状态：0=未开始 1=看见 2=理解 3=支持(30秒倒计时) 4=完成
type SelfStep = 0 | 1 | 2 | 3 | 4;

const SUPPORT_SECONDS = 30;

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
  const [selfStep, setSelfStep] = useState<SelfStep>(0);
  const [supportSecondsLeft, setSupportSecondsLeft] = useState(SUPPORT_SECONDS);
  const [supportRunning, setSupportRunning] = useState(false);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];

  // other 模式消息（含 understanding 时走三段式，否则简短版）
  const otherMessage = useMemo(() => {
    if (!selectedRule) return "";
    if (selectedRule.understanding) {
      return tr("connection_msg_other_v2", {
        signal: selectedRule.signal,
        understanding: selectedRule.understanding,
        support: selectedRule.support,
      });
    }
    return tr("connection_support_other", {
      signal: selectedRule.signal,
      support: selectedRule.support,
    });
  }, [selectedRule, tr]);

  // 30 秒倒计时
  useEffect(() => {
    if (!supportRunning || supportSecondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSupportSecondsLeft((value) => {
        if (value <= 1) {
          setSupportRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [supportRunning, supportSecondsLeft]);

  // 切换模式或规则时重置 self 流程
  const resetSelfFlow = () => {
    setSelfStep(0);
    setSupportSecondsLeft(SUPPORT_SECONDS);
    setSupportRunning(false);
  };

  const switchMode = (next: ConnectionMode) => {
    setMode(next);
    resetSelfFlow();
    setAwaitingFeedback(false);
  };

  const completeSelfConnection = () => {
    if (!selectedRule) return;
    if (selectedRule.source === "support") executeSupportRule(selectedRule.id);
    recordConnection(selectedRule.id, "self");
    setAwaitingFeedback(true);
    pushToast("success", tr("connection_toast_self_recorded"));
  };

  const completeOtherConnection = async () => {
    if (!selectedRule) return;
    try {
      await navigator.clipboard.writeText(otherMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast("error", tr("connection_toast_copy_failed"));
      return;
    }
    if (selectedRule.source === "support") executeSupportRule(selectedRule.id);
    recordConnection(selectedRule.id, "other");
    setAwaitingFeedback(true);
    pushToast("success", tr("connection_toast_card_copied"));
  };

  const handleFeedback = (feedback: "helpful" | "unhelpful") => {
    if (!selectedRule) return;
    if (selectedRule.source === "support") submitSupportFeedback(selectedRule.id, feedback);
    else submitPersonalFeedback(selectedRule.id, feedback);
    setAwaitingFeedback(false);
  };

  // self 模式 step1 选「没有」：提前记住，直接完成
  const handleStep1No = () => {
    if (!selectedRule) return;
    recordConnection(selectedRule.id, "self");
    pushToast("success", tr("connection_self_step1_no_msg"));
    setSelfStep(4); // 走完成语路径
  };

  return (
    <div className="space-y-6 pt-10">
      <header className="px-1">
        <p className="text-xs font-medium text-primary">{tr("connection_section_label")}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{tr("connection_title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{tr("connection_desc_simple")}</p>
      </header>

      <div className="grid grid-cols-2 rounded-lg border border-edge bg-white/45 p-1">
        <ModeButton active={mode === "self"} icon={Heart} label={tr("connection_mode_self")} onClick={() => switchMode("self")} />
        <ModeButton active={mode === "other"} icon={MessageCircle} label={tr("connection_mode_other")} onClick={() => switchMode("other")} />
      </div>

      {selectedRule ? (
        <>
          {rules.length > 1 && (
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">{tr("connection_label_rule")}</span>
              <select
                value={selectedRule.id}
                onChange={(event) => {
                  setSelectedRuleId(event.target.value);
                  resetSelfFlow();
                  setAwaitingFeedback(false);
                }}
                className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink"
              >
                {rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.signal}</option>)}
              </select>
            </label>
          )}

          {/* ============ self 模式：3 步引导 ============ */}
          {mode === "self" && (
            <>
              {/* step 0：开始入口 */}
              {selfStep === 0 && (
                <section className="border-l-4 border-sage bg-sage-mist/20 px-5 py-4">
                  <p className="text-sm leading-7 text-ink">
                    {tr("connection_self_step1_q")}
                  </p>
                  <p className="mt-3 text-[11px] text-ink-muted">{tr("connection_self_step1_signal_hint")}</p>
                  <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm text-ink">{selectedRule.signal}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelfStep(1)}
                      className="min-h-11 flex-1 rounded-full bg-sage px-3 text-sm text-white"
                    >
                      {tr("connection_self_step1_yes")}
                    </button>
                    <button
                      type="button"
                      onClick={handleStep1No}
                      className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 px-3 text-sm text-ink-muted"
                    >
                      {tr("connection_self_step1_no")}
                    </button>
                  </div>
                </section>
              )}

              {/* step 1：看见 → 进入理解 */}
              {selfStep === 1 && (
                <section className="border-l-4 border-sage bg-sage-mist/20 px-5 py-4">
                  <p className="text-xs font-medium text-sage">{tr("connection_self_step1_label")}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">{tr("connection_self_step1_signal_hint")}</p>
                  <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm text-ink">{selectedRule.signal}</p>
                  <p className="mt-3 text-xs text-ink-muted">{tr("connection_self_step2_q")}</p>
                  <button
                    type="button"
                    onClick={() => setSelfStep(2)}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
                  >
                    {tr("connection_self_step2_done")}
                  </button>
                </section>
              )}

              {/* step 2：理解 → 进入支持 */}
              {selfStep === 2 && (
                <section className="border-l-4 border-sage bg-sage-mist/20 px-5 py-4">
                  <p className="text-xs font-medium text-sage">{tr("connection_self_step2_label")}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">{tr("connection_self_step2_understanding_hint")}</p>
                  <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm leading-7 text-ink">
                    {selectedRule.understanding || tr("connection_self_step2_q")}
                  </p>
                  <p className="mt-3 text-xs text-ink-muted">{tr("connection_self_step3_q")}</p>
                  <button
                    type="button"
                    onClick={() => setSelfStep(3)}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
                  >
                    {tr("connection_self_step3_start")}
                  </button>
                </section>
              )}

              {/* step 3：支持 + 30 秒倒计时 */}
              {selfStep === 3 && (
                <section className="border-l-4 border-sage bg-sage-mist/20 px-5 py-4">
                  <p className="text-xs font-medium text-sage">{tr("connection_self_step3_label")}</p>
                  <p className="mt-1 text-[11px] text-ink-muted">{tr("connection_self_step3_support_hint")}</p>
                  <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm leading-7 text-ink">{selectedRule.support}</p>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="font-mono text-2xl text-ink" aria-live="polite">
                      {supportSecondsLeft}s
                    </span>
                    {supportSecondsLeft === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSupportSecondsLeft(SUPPORT_SECONDS);
                          setSupportRunning(true);
                        }}
                        className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 text-sm text-ink-muted"
                      >
                        {tr("connection_self_step3_start")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSupportRunning((value) => !value)}
                        className="min-h-11 flex-1 rounded-full bg-sage px-4 text-sm text-white"
                      >
                        {supportRunning
                          ? tr("connection_self_step3_doing", { sec: String(supportSecondsLeft) })
                          : tr("connection_self_step3_start")}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelfStep(4);
                      setSupportRunning(false);
                    }}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
                  >
                    <Check size={16} />
                    {tr("connection_self_step3_done")}
                  </button>
                </section>
              )}

              {/* step 4：完成 */}
              {selfStep === 4 && !awaitingFeedback && (
                <section className="border-l-4 border-sage bg-sage-mist/20 px-5 py-4">
                  <p className="text-sm leading-7 text-ink">{tr("connection_self_complete")}</p>
                  <button
                    type="button"
                    onClick={completeSelfConnection}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
                  >
                    <Check size={16} />
                    {tr("connection_btn_complete_self")}
                  </button>
                </section>
              )}
            </>
          )}

          {/* ============ other 模式：消息 + 发送前提醒 ============ */}
          {mode === "other" && (
            <>
              <section className="border-l-4 border-primary bg-primary-mist/20 px-5 py-4">
                <p className="text-base leading-8 text-ink">{otherMessage}</p>
                <button
                  type="button"
                  onClick={completeOtherConnection}
                  className="mt-4 flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-base"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? tr("connection_btn_copied") : tr("connection_btn_copy_card")}
                </button>
              </section>

              {/* 发送前提醒卡片（预判对方反应 + 兜底话术） */}
              <section className="rounded-card border border-edge bg-warn-mist/15 p-4">
                <p className="text-xs font-medium text-warn">{tr("connection_other_tip_title")}</p>
                <div className="mt-3 space-y-2.5">
                  <div>
                    <p className="text-[11px] text-ink-muted">{tr("connection_other_tip_react")}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink">{tr("connection_other_tip_react_msg")}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-muted">{tr("connection_other_tip_backup")}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink">{tr("connection_other_backup_msg")}</p>
                  </div>
                </div>
              </section>
            </>
          )}

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
