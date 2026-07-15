import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Check, Zap, Brain, Heart, Target } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { interpretCrashVoice } from "@/lib/qwenService";
import type { AIInterpretation } from "@/types";
import { useT } from "@/lib/i18n";

// 崩溃语音补记（Qwen ASR + 三段式解读）
// 崩溃时语音描述 → 转文字 → AI 三段式解读（事件/情绪/需求）
// 比 CrashButton 的模拟语音更进一步：真实调用语音识别 + AI 解读

type Status = "idle" | "recording" | "processing" | "result" | "done";

export default function VoiceCrashNote() {
  const { tr, tt } = useT();
  const addCrashMark = useStore((s) => s.addCrashMark);
  const pushToast = useStore((s) => s.pushToast);
  const [status, setStatus] = useState<Status>("idle");
  const [transcript, setTranscript] = useState("");
  const [interpretation, setInterpretation] = useState<AIInterpretation | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStartRecord = () => {
    setStatus("recording");
    // 模拟录音 4 秒后自动停止
    timerRef.current = setTimeout(() => {
      handleStopRecord();
    }, 4000);
  };

  const handleStopRecord = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("processing");
    try {
      const res = await interpretCrashVoice(null);
      setTranscript(res.transcript);
      setInterpretation(res.interpretation);
      setStatus("result");
      pushToast("success", tr("voice_crash_recognized"));
    } catch {
      pushToast("error", tr("voice_crash_recognize_failed"));
      setStatus("idle");
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("idle");
    setTranscript("");
    setInterpretation(null);
  };

  const handleSave = () => {
    addCrashMark(transcript);
    setStatus("done");
    pushToast("success", tr("voice_crash_recorded"));
    setTimeout(() => {
      setStatus("idle");
      setTranscript("");
      setInterpretation(null);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-warn/30 bg-warn-mist/30 p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-ink">{tr("voice_crash_title")}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <Zap size={11} className="text-warn" />
            {tr("voice_crash_subtitle")}
          </p>
        </div>
        <span className="rounded-full bg-warn-mist/60 px-2 py-0.5 text-[10px] text-warn">
          {tr("today_voice")}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4"
          >
            <button
              onClick={handleStartRecord}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-warn text-white shadow-glow transition-all duration-250 hover:bg-warn/90 active:scale-95"
              aria-label={tr("voice_crash_start_record")}
            >
              <Mic size={28} />
            </button>
            <p className="mt-3 text-xs text-ink-muted">
              {tr("voice_crash_prompt")}
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              {tr("voice_crash_prompt_hint")}
            </p>
          </motion.div>
        )}

        {status === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4"
          >
            <div className="flex items-center gap-1.5 py-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span
                  key={i}
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.08,
                    ease: "easeInOut",
                  }}
                  className="h-8 w-1.5 rounded-full bg-warn"
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-muted">{tr("voice_crash_recording")}</p>
            <button
              onClick={handleStopRecord}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-edge px-4 py-2 text-xs text-ink-muted transition-all duration-250 hover:bg-edge/80"
            >
              <MicOff size={14} /> {tr("voice_crash_end_early")}
            </button>
          </motion.div>
        )}

        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-6"
          >
            <Loader2 size={28} className="animate-spin text-warn" />
            <p className="mt-3 text-xs text-ink-muted">
              {tr("voice_crash_processing")}
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              {tr("voice_crash_processing_hint")}
            </p>
          </motion.div>
        )}

        {status === "result" && interpretation && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* 语音转写 */}
            <div className="rounded-xl bg-warn-mist/40 p-3">
              <p className="mb-1 text-[11px] text-warn">{tr("voice_crash_you_said")}</p>
              <p className="text-small leading-relaxed text-ink">{transcript}</p>
            </div>

            {/* AI 三段式解读 */}
            <div className="space-y-2.5">
              <InterpretationRow
                icon={Brain}
                label={tr("voice_crash_event")}
                text={tt(interpretation.event)}
                color="text-primary"
                bg="bg-primary-mist/30"
              />
              <InterpretationRow
                icon={Heart}
                label={tr("voice_crash_emotion")}
                text={tt(interpretation.emotion)}
                color="text-clay"
                bg="bg-clay-mist/30"
              />
              <InterpretationRow
                icon={Target}
                label={tr("voice_crash_need")}
                text={tt(interpretation.need)}
                color="text-sage"
                bg="bg-sage-mist/30"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-full border border-edge py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/60"
              >
                {tr("voice_crash_rerecord")}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-full bg-warn py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-warn/90 active:scale-[0.98]"
              >
                {tr("voice_crash_save")}
              </button>
            </div>
          </motion.div>
        )}

        {status === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-6"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sage text-white">
              <Check size={26} />
            </div>
            <p className="mt-3 text-small text-ink">{tr("voice_crash_done")}</p>
            <p className="mt-1 text-xs text-ink-muted">{tr("voice_crash_done_hint")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InterpretationRow({
  icon: Icon,
  label,
  text,
  color,
  bg,
}: {
  icon: typeof Brain;
  label: string;
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-xl p-3", bg)}>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} className={color} />
        <span className={cn("text-[11px] font-medium", color)}>{label}</span>
      </div>
      <p className="text-small leading-relaxed text-ink">{text}</p>
    </div>
  );
}
