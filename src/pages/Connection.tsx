import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Heart, MessageCircle, Play, PlusCircle, Sparkles, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import LoopProgressCard from "@/components/connection/LoopProgressCard";
import SpotlightGuide from "@/components/common/SpotlightGuide";
import type { StringKey } from "@/lib/translations";
import { generateConnectionMessage } from "@/lib/qwenService";
import { getWarmPhrase } from "@/lib/warmPhrases";

type ConnectionMode = "self" | "other";
type DisplayRule = {
  id: string;
  signal: string;
  understanding?: string;
  support: string;
  source: "support" | "legacy";
};

const SUPPORT_SECONDS = 30;
// 「说给别人」的预设对象（ADHD：减少"填空"摩擦）
const RECIPIENT_PRESETS = [
  { key: "family", icon: "👨‍👩‍👧" },
  { key: "partner", icon: "💛" },
  { key: "friend", icon: "🤝" },
  { key: "colleague", icon: "💼" },
  { key: "other", icon: "✍️" },
];

// 连接页 · 精简后单屏完成，self / other 各有差异化记录
export default function Connection() {
  const navigate = useNavigate();
  const supportRules = useStore((state) => state.supportRules);
  const personalRules = useStore((state) => state.personalRules);
  const executeSupportRule = useStore((state) => state.executeSupportRule);
  const submitSupportFeedback = useStore((state) => state.submitSupportRuleFeedback);
  const submitPersonalFeedback = useStore((state) => state.submitRuleFeedback);
  const recordConnection = useStore((state) => state.recordConnection);
  const pushToast = useStore((state) => state.pushToast);
  const connectionMoments = useStore((state) => state.connectionMoments);
  // self 模式累积次数 · 用于完成态"第 N 次看见自己"视觉链
  const selfCount = connectionMoments.filter((m) => m.mode === "self").length;
  // 视觉链最多显示 12 个点，超过显示 "12+"
  const dotsToShow = Math.min(selfCount, 12);
  const { tr } = useT();

  const rules: DisplayRule[] = useMemo(
    () =>
      supportRules.length > 0
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
          })),
    [supportRules, personalRules],
  );

  // 未选定模式时为 null，选定后进入对应流程 · 取代旧的"两栏 toggle + 默认 self"
  const [mode, setMode] = useState<ConnectionMode | null>(null);
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? "");
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];

  // ===== self 模式状态 =====
  const [copied, setCopied] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [supportSecondsLeft, setSupportSecondsLeft] = useState(SUPPORT_SECONDS);
  const [supportRunning, setSupportRunning] = useState(false);
  const [supportStartedAt, setSupportStartedAt] = useState<number | null>(null);
  // signal 出现了吗？默认 yes（避免再问一次）
  const [signalPresent, setSignalPresent] = useState<"yes" | "no" | null>(null);
  // AI 生成的新理解（可选 · ASD/ADHD 用户可点击"换个角度"获取新视角）
  const [aiUnderstanding, setAiUnderstanding] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ===== other 模式状态 =====
  const [literalSource, setLiteralSource] = useState(selectedRule?.signal ?? "");
  const [literalSupport, setLiteralSupport] = useState(selectedRule?.support ?? "");
  const [includeUnderstanding, setIncludeUnderstanding] = useState(false);
  const [recipient, setRecipient] = useState<string>("");
  const [messageDraft, setMessageDraft] = useState(() =>
    selectedRule
      ? tr("connection_literal_template", {
          signal: selectedRule.signal,
          support: selectedRule.support,
        })
      : "",
  );
  const [aiOtherLoading, setAiOtherLoading] = useState(false);
  // AI 生成过 other 草稿后标记 · 防止被实时联动 effect 覆盖
  // 用户再次手动改 source/support 时清掉这个标记，恢复自动联动
  const [aiOtherTouched, setAiOtherTouched] = useState(false);

  // 切换规则时重置 other 模式输入
  useEffect(() => {
    if (mode !== "other" || !selectedRule) return;
    setLiteralSource(selectedRule.signal);
    setLiteralSupport(selectedRule.support);
    setIncludeUnderstanding(false);
    setAiOtherTouched(false);
    setMessageDraft(
      tr("connection_literal_template", {
        signal: selectedRule.signal,
        support: selectedRule.support,
      }),
    );
  }, [selectedRuleId, mode, selectedRule, tr]);

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

  // 草稿实时联动（去掉 Refresh 按钮）
  // AI 生成过的话不覆盖 · 用户手动改 source/support 时才恢复联动
  useEffect(() => {
    if (mode !== "other" || aiOtherTouched) return;
    const base = tr("connection_literal_template", {
      signal: literalSource.trim(),
      support: literalSupport.trim(),
    });
    const withUnderstanding =
      includeUnderstanding && selectedRule?.understanding
        ? base + tr("connection_literal_understanding", { understanding: selectedRule.understanding })
        : base;
    setMessageDraft(withUnderstanding);
  }, [literalSource, literalSupport, includeUnderstanding, selectedRule, mode, tr, aiOtherTouched]);

  const switchMode = (next: ConnectionMode) => {
    setMode(next);
    setAwaitingFeedback(false);
    setCompleted(false);
    setSignalPresent(null);
    setSupportSecondsLeft(SUPPORT_SECONDS);
    setSupportRunning(false);
    setSupportStartedAt(null);
    setAiUnderstanding(null);
    setAiOtherTouched(false);
  };

  // self 模式：AI 生成新的自我理解（ASD/ADHD 可能需要新视角）
  const handleAiSelfUnderstanding = async () => {
    if (!selectedRule) return;
    setAiLoading(true);
    try {
      const lang = useStore.getState().language;
      const result = await generateConnectionMessage(
        selectedRule.signal,
        selectedRule.support,
        selectedRule.understanding,
        useStore.getState().neuroType,
        "self_understanding",
        undefined,
        lang,
      );
      setAiUnderstanding(result.text);
      pushToast(result.source === "ai" ? "success" : "info", tr(result.source === "ai" ? "connection_ai_success" : "connection_ai_template"));
    } catch {
      pushToast("error", tr("connection_ai_failed"));
    } finally {
      setAiLoading(false);
    }
  };

  // other 模式：AI 生成对话草稿（可继续编辑）
  const handleAiOtherDraft = async () => {
    if (!selectedRule) return;
    setAiOtherLoading(true);
    try {
      const lang = useStore.getState().language;
      const result = await generateConnectionMessage(
        literalSource.trim() || selectedRule.signal,
        literalSupport.trim() || selectedRule.support,
        selectedRule.understanding,
        useStore.getState().neuroType,
        "other_message",
        recipient || undefined,
        lang,
      );
      setMessageDraft(result.text);
      setAiOtherTouched(true);
      pushToast(result.source === "ai" ? "success" : "info", tr(result.source === "ai" ? "connection_ai_success" : "connection_ai_template"));
    } catch {
      pushToast("error", tr("connection_ai_failed"));
    } finally {
      setAiOtherLoading(false);
    }
  };

  const completeSelfConnection = () => {
    if (!selectedRule) return;
    const durationSec = supportStartedAt ? Math.min(SUPPORT_SECONDS, Math.round((Date.now() - supportStartedAt) / 1000)) : 0;
    if (selectedRule.source === "support") executeSupportRule(selectedRule.id);
    // AI 生成的新视角自动保存到 connectionMoment · 方便后续回看
    recordConnection(selectedRule.id, "self", {
      duration_sec: durationSec,
      ...(aiUnderstanding ? { ai_understanding: aiUnderstanding } : {}),
    });
    setAwaitingFeedback(true);
    pushToast("success", tr("connection_toast_self_recorded"));
  };

  const completeOtherConnection = async () => {
    if (!selectedRule) return;
    try {
      await navigator.clipboard.writeText(messageDraft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast("error", tr("connection_toast_copy_failed"));
      return;
    }
    if (selectedRule.source === "support") executeSupportRule(selectedRule.id);
    recordConnection(selectedRule.id, "other", {
      recipient: recipient || undefined,
      message: messageDraft,
    });
    setAwaitingFeedback(true);
    pushToast("success", tr("connection_toast_card_copied"));
  };

  const handleFeedback = (feedback: "helpful" | "unhelpful") => {
    if (!selectedRule) return;
    if (selectedRule.source === "support") submitSupportFeedback(selectedRule.id, feedback);
    else submitPersonalFeedback(selectedRule.id, feedback);
    setAwaitingFeedback(false);
    setCompleted(true);
    pushToast("success", `${tr("connection_completed_toast")} · ${getWarmPhrase(useStore.getState().language)}`);
  };

  // 完成态后重置 · 准备再来一次
  const handleResetComplete = () => {
    setCompleted(false);
    setAwaitingFeedback(false);
    setSignalPresent(null);
    setSupportSecondsLeft(SUPPORT_SECONDS);
    setSupportRunning(false);
    setSupportStartedAt(null);
    setAiUnderstanding(null);
    setMode(null);
  };

  // signal 没出现 · 直接记录（无 30 秒仪式）
  const handleSignalAbsent = () => {
    if (!selectedRule) return;
    recordConnection(selectedRule.id, "self", { duration_sec: 0 });
    pushToast("success", tr("connection_self_step1_no_msg"));
    setAwaitingFeedback(true);
  };

  const startSupportTimer = () => {
    setSupportRunning(true);
    setSupportStartedAt(Date.now());
  };

  const handleRuleChange = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    setAwaitingFeedback(false);
  };

  return (
    <div className="space-y-5 pb-24 pt-10">
      <header className="px-1">
        <p className="text-xs font-medium text-primary">{tr("connection_section_label")}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{tr("connection_title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{tr("connection_desc_simple")}</p>
      </header>

      <LoopProgressCard />

      {selectedRule ? (
        <>
          {/* 1. 顶部规则选择器（若有多个） */}
          {rules.length > 1 && (
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">{tr("connection_label_rule")}</span>
              <select
                value={selectedRule.id}
                onChange={(event) => handleRuleChange(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-edge bg-white/70 px-3 text-sm text-ink"
              >
                {rules.map((rule) => (
                  <option key={rule.id} value={rule.id}>{rule.signal}</option>
                ))}
              </select>
            </label>
          )}

          {/* 2. 模式选择卡片（未选定模式时显示） */}
          {!mode && (
            <div data-tour-id="connection-mode" className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => switchMode("self")}
                className="group flex flex-col items-center gap-2 rounded-card border border-primary/30 bg-primary-mist/20 p-5 text-center transition-all duration-250 hover:border-primary/50 hover:bg-primary-mist/30 active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 shadow-sm transition-colors group-hover:bg-white/80">
                  <Heart size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{tr("connection_mode_self")}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{tr("connection_mode_self_hint")}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => switchMode("other")}
                className="group flex flex-col items-center gap-2 rounded-card border border-primary/30 bg-primary-mist/20 p-5 text-center transition-all duration-250 hover:border-primary/50 hover:bg-primary-mist/30 active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 shadow-sm transition-colors group-hover:bg-white/80">
                  <MessageCircle size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{tr("connection_mode_other")}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{tr("connection_mode_other_hint")}</p>
                </div>
              </button>
            </div>
          )}

          {/* 3. self 模式 · 单屏 3 段卡片 + 可选 30 秒 */}
          {mode === "self" && (
            <section data-tour-id="connection-self-flow" className="space-y-3">
              {/* 切换模式按钮 */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="text-xs text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted"
                >
                  {tr("connection_switch_mode")}
                </button>
              </div>

              {/* signal 出现了吗？ */}
              {signalPresent === null && (
                <div className="rounded-card border border-edge bg-white/55 p-4">
                  <p className="text-sm text-ink">{tr("connection_self_step1_q")}</p>
                  <p className="mt-2 rounded-lg bg-primary-mist/15 px-3 py-2 text-sm text-ink">{selectedRule.signal}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignalPresent("yes")}
                      className="min-h-11 flex-1 rounded-full bg-primary px-3 text-sm font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
                    >
                      {tr("connection_self_step1_yes")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignalAbsent}
                      className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 px-3 text-sm text-ink-muted transition-all duration-250 hover:bg-white/75 active:scale-[0.98]"
                    >
                      {tr("connection_self_step1_no")}
                    </button>
                  </div>
                </div>
              )}

              {/* signal 已出现 · 单屏展示三段 + 可选 30 秒 */}
              {signalPresent === "yes" && (
                <div className="space-y-3">
                  <div className="rounded-card border-l-4 border-sage bg-sage-mist/20 p-4">
                    <p className="text-xs font-medium text-sage">{tr("connection_self_step1_label")}</p>
                    <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm text-ink">{selectedRule.signal}</p>
                  </div>

                  {selectedRule.understanding ? (
                    <div className="rounded-card border-l-4 border-sage bg-sage-mist/20 p-4">
                      <p className="text-xs font-medium text-sage">{tr("connection_self_step2_label")}</p>
                      <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm leading-7 text-ink">{selectedRule.understanding}</p>
                    </div>
                  ) : (
                    // 空态：保持 3 段结构稳定，避免 02 消失让用户疑惑
                    <button
                      type="button"
                      onClick={() => navigate("/climate")}
                      className="block w-full rounded-card border border-dashed border-edge bg-white/30 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary-mist/10"
                    >
                      <p className="text-xs font-medium text-ink-faint">{tr("connection_self_step2_label")}</p>
                      <p className="mt-1 text-xs text-ink-muted">{tr("connection_self_step2_empty")}</p>
                      <p className="mt-1.5 text-xs text-primary">{tr("connection_self_step2_cta")}</p>
                    </button>
                  )}

                  <div className="rounded-card border-l-4 border-sage bg-sage-mist/20 p-4">
                    <p className="text-xs font-medium text-sage">{tr("connection_self_step3_label")}</p>
                    <p className="mt-1 rounded-lg bg-white/60 px-3 py-2 text-sm leading-7 text-ink">{selectedRule.support}</p>

                    {/* 30 秒可选 · 不强制 */}
                    <div className="mt-4 flex items-center gap-3">
                      <span className={cn("font-mono text-xl", supportSecondsLeft === 0 ? "text-sage" : "text-ink")} aria-live="polite">
                        {supportSecondsLeft}s
                      </span>
                      {supportSecondsLeft === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSupportSecondsLeft(SUPPORT_SECONDS);
                            setSupportRunning(false);
                            setSupportStartedAt(null);
                          }}
                          className="min-h-10 flex-1 rounded-full border border-edge bg-white/55 text-xs text-ink-muted transition-colors hover:bg-white/75"
                        >
                          {tr("connection_self_step3_redo")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => (supportRunning ? setSupportRunning(false) : startSupportTimer())}
                          className={cn(
                            "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-all duration-250 active:scale-[0.98]",
                            supportRunning
                              ? "border border-edge bg-white/55 text-ink-muted"
                              : "bg-sage text-white hover:bg-sage/90",
                          )}
                        >
                          {supportRunning ? (
                            <>{tr("connection_self_step3_doing", { sec: String(supportSecondsLeft) })}</>
                          ) : (
                            <>
                              <Play size={12} />
                              {tr("connection_self_step3_start")}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI 换个角度 · 放在三段之后、完成按钮之前，保持编号不被破坏 */}
                  {aiUnderstanding && (
                    <div className="rounded-card border border-primary/30 bg-primary-mist/15 p-4">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-primary" />
                        <p className="text-xs font-medium text-primary">{tr("connection_ai_new_understanding")}</p>
                      </div>
                      <p className="text-sm leading-7 text-ink">{aiUnderstanding}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    data-tour-id="connection-ai-self"
                    onClick={handleAiSelfUnderstanding}
                    disabled={aiLoading}
                    className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-primary-mist/20 px-3 text-xs font-medium text-primary transition-all duration-250 hover:bg-primary-mist/30 active:scale-[0.98] disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <><Loader2 size={12} className="animate-spin" /> {tr("connection_ai_loading")}</>
                    ) : (
                      <><Sparkles size={12} /> {tr("connection_ai_self_btn")}</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={completeSelfConnection}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-base text-white transition-all duration-250 hover:bg-ink/90 active:scale-[0.98]"
                  >
                    <Check size={16} />
                    {tr("connection_btn_complete_self")}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 4. other 模式 · 单屏 source/support + recipient + 实时草稿 */}
          {mode === "other" && (
            <section className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="text-xs text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted"
                >
                  {tr("connection_switch_mode")}
                </button>
              </div>

              <div className="rounded-card border border-edge bg-white/55 p-4 space-y-3">
                {/* 对谁说 · 预设按钮 */}
                <div>
                  <p className="mb-1.5 text-xs text-ink-muted">{tr("connection_recipient_label")}</p>
                  <div className="flex flex-wrap gap-2">
                    {RECIPIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setRecipient(recipient === preset.key ? "" : preset.key)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-250",
                          recipient === preset.key
                            ? "border-primary/40 bg-primary-mist/40 text-primary"
                            : "border-edge bg-white/55 text-ink-muted hover:bg-white/75",
                        )}
                      >
                        <span>{preset.icon}</span>
                        {tr(`connection_recipient_${preset.key}` as StringKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="block text-sm font-medium text-ink">{tr("connection_literal_source")}</span>
                  <textarea
                    value={literalSource}
                    onChange={(event) => { setLiteralSource(event.target.value); setAiOtherTouched(false); }}
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-edge bg-white/75 p-2.5 text-sm leading-6 text-ink"
                  />
                </label>

                <label className="block">
                  <span className="block text-sm font-medium text-ink">{tr("connection_literal_support")}</span>
                  <textarea
                    value={literalSupport}
                    onChange={(event) => { setLiteralSupport(event.target.value); setAiOtherTouched(false); }}
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-edge bg-white/75 p-2.5 text-sm leading-6 text-ink"
                  />
                </label>

                {selectedRule.understanding && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeUnderstanding}
                    onClick={() => setIncludeUnderstanding((value) => !value)}
                    className={cn(
                      "flex min-h-10 w-full items-center justify-between rounded-lg border px-3 text-left text-xs",
                      includeUnderstanding
                        ? "border-primary/30 bg-primary-mist/25 text-primary"
                        : "border-edge bg-white/55 text-ink-muted",
                    )}
                  >
                    {tr("connection_literal_include_understanding")}
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border",
                      includeUnderstanding ? "border-primary bg-primary text-white" : "border-edge",
                    )}>
                      {includeUnderstanding && <Check size={12} />}
                    </span>
                  </button>
                )}

                {/* 实时草稿（联动，无需 Refresh 按钮） */}
                <label className="block border-t border-edge/70 pt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="block text-xs font-medium text-ink-muted">{tr("connection_literal_draft")}</span>
                    <button
                      type="button"
                      data-tour-id="connection-ai-other"
                      onClick={handleAiOtherDraft}
                      disabled={aiOtherLoading}
                      className="flex items-center gap-1 rounded-full bg-primary-mist/30 px-2.5 py-1 text-xs font-medium text-primary transition-all duration-250 hover:bg-primary-mist/50 active:scale-[0.98] disabled:opacity-50"
                    >
                      {aiOtherLoading ? (
                        <><Loader2 size={11} className="animate-spin" /> {tr("connection_ai_loading")}</>
                      ) : (
                        <><Sparkles size={11} /> {tr("connection_ai_other_btn")}</>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    rows={4}
                    className="mt-1.5 w-full rounded-lg border border-primary/20 bg-primary-mist/10 p-2.5 text-sm leading-7 text-ink"
                  />
                </label>

                <p className="rounded-lg bg-warn-mist/15 px-3 py-2 text-[11px] leading-5 text-ink-muted">
                  {tr("connection_literal_boundary")}
                </p>

                <button
                  type="button"
                  onClick={completeOtherConnection}
                  disabled={!messageDraft.trim()}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-base text-white transition-all duration-250 hover:bg-ink/90 active:scale-[0.98] disabled:opacity-40"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? tr("connection_btn_copied") : tr("connection_btn_copy_card")}
                </button>

                <p className="px-5 pt-2 text-center text-xs leading-relaxed text-ink-faint">
                  {tr("connection_footer")}
                </p>
              </div>
            </section>
          )}

          {/* 5. 反馈询问 */}
          {awaitingFeedback && !completed && (
            <section className="border-l-2 border-sage pl-4">
              <p className="text-sm font-medium text-ink">{tr("connection_feedback_q")}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => handleFeedback("helpful")} className="min-h-11 flex-1 rounded-full bg-sage text-sm text-white transition-colors hover:bg-sage/90">{tr("connection_feedback_helpful")}</button>
                <button type="button" onClick={() => handleFeedback("unhelpful")} className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 text-sm text-ink-muted transition-colors hover:bg-white/75">{tr("connection_feedback_unhelpful")}</button>
              </div>
            </section>
          )}

          {/* 6. 完成态 · 衔接下一步（ADHD 计划延续：不让"完成"变成"终点"） */}
          {completed && (
            <section className="rounded-card border border-primary/30 bg-primary-mist/20 p-5 text-center">
              <div className="mb-2 flex justify-center">
                <Check size={20} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-ink">{tr("connection_completed_title")}</p>
              <p className="mt-1 text-xs text-ink-muted">{tr("connection_completed_hint")}</p>

              {/* 「看见自己」累积链 · 每次完成 self-connection 后 +1，最多显示 12 个点 */}
              {selfCount > 0 && (
                <div data-tour-id="connection-self-dots" className="mt-4 rounded-lg bg-white/40 px-3 py-2.5">
                  <p className="text-xs text-ink-muted">
                    {tr("connection_self_count", { n: selfCount })}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                    {Array.from({ length: dotsToShow }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-2 w-2 rounded-full transition-all duration-300",
                          i === dotsToShow - 1 ? "bg-primary scale-125" : "bg-primary/40",
                        )}
                      />
                    ))}
                    {selfCount > 12 && (
                      <span className="text-[10px] text-ink-faint">+{selfCount - 12}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleResetComplete}
                  className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
                >
                  <RefreshCw size={14} />
                  {tr("connection_completed_again")}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/climate")}
                    className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-full border border-edge bg-white/60 text-xs text-ink-muted transition-all duration-250 hover:bg-white/80 active:scale-[0.98]"
                  >
                    {tr("connection_completed_review")}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/today")}
                    className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-full border border-edge bg-white/60 text-xs text-ink-muted transition-all duration-250 hover:bg-white/80 active:scale-[0.98]"
                  >
                    {tr("connection_completed_today")}
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <button
          type="button"
          data-tour-id="connection-empty"
          onClick={() => navigate("/climate")}
          className="group flex w-full flex-col items-center gap-2 rounded-card border border-dashed border-primary/40 bg-primary-mist/20 p-6 text-center transition-all duration-250 hover:border-primary/60 hover:bg-primary-mist/30 active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 shadow-sm transition-colors group-hover:bg-white/80">
            <PlusCircle size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">{tr("connection_empty_title")}</p>
            <p className="mt-1 text-xs text-ink-muted">{tr("connection_empty_desc")}</p>
            <p className="mt-1 text-xs text-primary">{tr("connection_empty_cta")}</p>
          </div>
        </button>
      )}

      <SpotlightGuide
        pageKey="connection"
        steps={[
          {
            targetId: "connection-mode",
            titleKey: "guide_conn_mode_title",
            bodyKey: "guide_conn_mode_body",
          },
          {
            targetId: selectedRule ? "connection-self-flow" : "connection-empty",
            titleKey: "guide_conn_flow_title",
            bodyKey: "guide_conn_flow_body",
          },
          {
            targetId: "loop-progress",
            titleKey: "guide_conn_loop_title",
            bodyKey: "guide_conn_loop_body",
          },
        ]}
      />
    </div>
  );
}
