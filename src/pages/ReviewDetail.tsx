import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mic, Sparkles } from "lucide-react";
import type { AIInterpretation } from "@/types";
import AIInterpretationCard from "@/components/ai/AIInterpretationCard";
import { useStore } from "@/store/useStore";
import { interpretEmotion, extractProtocolFromReview } from "@/lib/aiSimulator";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/lib/i18n";

// 回看详情 · 崩溃复盘（PRD §05 F-08/F-09/F-10）
// 事后记录 → AI 解读 → 沉淀新协议
export default function ReviewDetail() {
  const { crashId } = useParams();
  const navigate = useNavigate();
  const crashMarks = useStore((s) => s.crashMarks);
  const updateCrashMark = useStore((s) => s.updateCrashMark);
  const addProtocol = useStore((s) => s.addProtocol);
  const addPersonalRule = useStore((s) => s.addPersonalRule);
  const { tr, tt } = useT();

  const crash = crashMarks.find((c) => c.id === crashId);
  const [text, setText] = useState("");
  const [interpretation, setInterpretation] = useState<AIInterpretation | null>(
    crash?.ai_interpretation ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [settled, setSettled] = useState(false);

  // 初始化文本：语音转文字或空白
  useEffect(() => {
    if (crash && !text) {
      setText(crash.voice_text ?? crash.raw_text ?? "");
    }
  }, [crash, text]);

  if (!crash) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-ink-muted">{tr("review_detail_not_found")}</p>
        <button
          onClick={() => navigate("/review")}
          className="rounded-full bg-primary px-5 py-2 text-small text-white"
        >
          {tr("review_detail_back")}
        </button>
      </div>
    );
  }

  const handleInterpret = async () => {
    setLoading(true);
    const result = await interpretEmotion(text);
    setInterpretation(result);
    setLoading(false);
    updateCrashMark(crash.id, {
      raw_text: text,
      ai_interpretation: result,
      reviewed: true,
    });
  };

  const handleSettle = async () => {
    if (!interpretation) return;
    const draft = await extractProtocolFromReview(interpretation);
    addProtocol({
      trigger: {
        type: "threshold",
        axis: "sensory",
        operator: ">",
        value: 7,
        description: draft.trigger_description,
      },
      action: {
        description: draft.action_description,
        duration_minutes: 15,
        timer: true,
      },
      source: "crash_reflection",
      status: "candidate",
    });
    addPersonalRule({
      signal: tt(interpretation.event),
      understanding: tt(interpretation.emotion),
      support: tt(interpretation.need),
    });
    setSettled(true);
    setTimeout(() => navigate("/climate"), 1200);
  };

  return (
    <div className="space-y-5 pt-6">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/review")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-white/50 text-ink-muted transition-all duration-250 hover:bg-white/80"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">
            {tr("review_detail_header")}
          </p>
          <p className="font-serif text-xl text-ink">
            {formatDateTime(crash.marked_at)}
          </p>
        </div>
      </div>

      {/* 事后记录（PRD F-08） */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
      >
        <div className="mb-3 flex items-center gap-2">
          {crash.voice_text && <Mic size={14} className="text-clay" />}
          <span className="text-xs uppercase tracking-widest text-ink-muted">
            {crash.voice_text ? tr("review_detail_voice_label") : tr("review_detail_note_label")}
          </span>
        </div>

        {crash.voice_text && (
          <p className="mb-3 italic leading-relaxed text-ink-muted">
            "{crash.voice_text}"
          </p>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr("review_detail_placeholder")}
          rows={4}
          className="w-full resize-none rounded-card border border-edge bg-base/60 p-3 text-body leading-relaxed text-ink placeholder:text-ink-faint"
        />

        <button
          onClick={handleInterpret}
          disabled={loading || !text.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-edge disabled:text-ink-muted"
        >
          <Sparkles size={15} />
          {loading ? tr("review_detail_loading") : tr("review_detail_interpret_btn")}
        </button>
      </motion.section>

      {/* AI 解读（PRD F-09） */}
      <AIInterpretationCard
        interpretation={interpretation}
        loading={loading}
        onSettle={handleSettle}
      />

      {settled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-small text-sage"
        >
          {tr("review_detail_settled")}
        </motion.p>
      )}

      <p className="px-4 pb-4 text-center text-xs leading-relaxed text-ink-muted">
        {tr("review_detail_footer_1")}
        <br />
        {tr("review_detail_footer_2")}
      </p>
    </div>
  );
}
