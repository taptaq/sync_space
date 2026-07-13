import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Heart, Layers, MessageCircle, UserRound, Volume2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import LoopProgressCard from "@/components/connection/LoopProgressCard";

type ConnectionMode = "self" | "other";
type ConnectionStyle = "short" | "voice" | "full";

const PREFERENCE_OPTIONS = {
  asd: ["请用文字", "请少说话", "请不要触碰", "等我主动联系"],
  adhd: ["一次只说一件事", "允许我用语音回复", "请先问我要提醒还是陪伴", "忘记不代表我不在乎"],
  other: ["请说得直接一点", "给我一点时间", "请先不要追问", "等我主动联系"],
};

const ADHD_REQUESTS = [
  "陪我开始第一步",
  "只提醒我一次",
  "帮我确认截止时间",
  "先别催，等我回复",
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
  const [mode, setMode] = useState<ConnectionMode>("self");
  const [connectionStyle, setConnectionStyle] = useState<ConnectionStyle>(neuroType === "adhd" ? "short" : "full");
  const [adhdRequest, setAdhdRequest] = useState(ADHD_REQUESTS[0]);
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<"helpful" | "unhelpful" | null>(null);
  const selectedRule = rules.find((rule) => rule.id === selectedRuleId) ?? rules[0];

  const message = useMemo(() => {
    if (!selectedRule) return "先在“理解”里写下一条属于你的个人规则。";
    if (mode === "self") {
      if (neuroType === "adhd") {
        return `先不判自己。出现“${selectedRule.signal}”，不等于我不够好；它可能说明：${selectedRule.understanding}。现在只做：${selectedRule.support}。做一点也算有效。`;
      }
      return `我注意到：${selectedRule.signal}。这通常意味着：${selectedRule.understanding}。现在先做：${selectedRule.support}。`;
    }
    const preferenceText = preferences.length > 0 ? ` 另外：${preferences.join("；")}。` : "";
    if (neuroType === "adhd" && connectionStyle === "short") {
      return `我现在有点卡在“${selectedRule.signal}”。可以${adhdRequest}吗？不用催我做完。${preferenceText}`;
    }
    if (neuroType === "adhd" && connectionStyle === "voice") {
      return `我想简单说明一下：\n现在的信号是：${selectedRule.signal}。\n这通常不是不在意，而是：${selectedRule.understanding}。\n我现在需要你：${adhdRequest}。\n${preferenceText || "不用替我解决全部，陪我过第一步就可以。"}`;
    }
    return `我现在出现了这个信号：${selectedRule.signal}。对我来说，这通常意味着：${selectedRule.understanding}。请先这样支持我：${selectedRule.support}。${preferenceText}我恢复后会再连接。`;
  }, [adhdRequest, connectionStyle, mode, neuroType, preferences, selectedRule]);

  const preferenceOptions = neuroType === "asd"
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
      pushToast("success", "已记下这次自我连接");
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      recordConnection(selectedRule.id, mode);
      setCopied(true);
      setAwaitingFeedback(true);
      setLastFeedback(null);
      pushToast("success", "连接卡已复制");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      pushToast("error", "复制失败，请长按文字复制");
    }
  };

  const handleFeedback = (feedback: "helpful" | "unhelpful") => {
    if (!selectedRule) return;
    submitRuleFeedback(selectedRule.id, feedback);
    setAwaitingFeedback(false);
    setLastFeedback(feedback);
    pushToast("success", feedback === "helpful" ? "已记下：这次有帮助" : "已记下：这条理解需要调整");
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

      {mode === "other" && (
        <section className="space-y-4">
          {neuroType === "adhd" && (
            <>
              <div>
                <p className="mb-2 text-xs text-ink-muted">这次怎样表达最省力</p>
                <div className="grid grid-cols-3 rounded-lg border border-edge bg-white/45 p-1">
                  <StyleButton active={connectionStyle === "short"} label="短消息" onClick={() => setConnectionStyle("short")} />
                  <StyleButton active={connectionStyle === "voice"} label="语音提纲" onClick={() => setConnectionStyle("voice")} />
                  <StyleButton active={connectionStyle === "full"} label="完整说明" onClick={() => setConnectionStyle("full")} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs text-ink-muted">希望对方具体做什么 · 只选一个</p>
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
                      {request}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div>
          <p className="mb-2 text-xs text-ink-muted">稳定的沟通偏好 · 会保留在本机</p>
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
                  {preference}
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
          {mode === "self" ? "给此刻的自己" : "给我信任的人"}
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
              ? mode === "self" ? "已完成" : "已复制"
              : mode === "self" ? "完成这次连接" : "复制连接卡"}
          </button>
        )}
      </section>

      {selectedRule && awaitingFeedback && (
        <section className="border-l-2 border-sage pl-4">
          <p className="text-sm font-medium text-ink">这次有帮助吗？</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => handleFeedback("helpful")} className="min-h-11 flex-1 rounded-full bg-sage text-sm text-white">
              有帮助
            </button>
            <button type="button" onClick={() => handleFeedback("unhelpful")} className="min-h-11 flex-1 rounded-full border border-edge bg-white/55 text-sm text-ink-muted">
              不适合我
            </button>
          </div>
        </section>
      )}

      {selectedRule && lastFeedback === "unhelpful" && (
        <button type="button" onClick={() => navigate("/climate")} className="w-full text-left text-sm text-primary underline underline-offset-4">
          去理解页修正这条规则
        </button>
      )}

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

function StyleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex min-h-10 items-center justify-center gap-1 rounded-md text-xs", active ? "bg-white text-primary shadow-sm" : "text-ink-muted")}>
      {label === "语音提纲" && <Volume2 size={13} />} {label}
    </button>
  );
}
