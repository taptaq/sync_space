import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, Sun, Volume2, Eye, Lightbulb, RotateCcw } from "lucide-react";
import { useStore } from "@/store/useStore";
import { analyzeEnvironment, type EnvAnalysisResult } from "@/lib/qwenService";

// 环境感官友好度分析（Qwen-VL · 不分析人脸）
// 拍环境照片 → AI 分析光线/噪音/杂乱度 → 给感官友好度评分和建议
// 合规：只分析环境，不分析人脸/表情

type Status = "idle" | "processing" | "result";

export default function EnvSensoryScan() {
  const neuroType = useStore((s) => s.neuroType);
  const pushToast = useStore((s) => s.pushToast);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<EnvAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("processing");
    try {
      const res = await analyzeEnvironment(file, neuroType);
      setResult(res);
      setStatus("result");
      pushToast("success", "环境分析完成");
    } catch {
      pushToast("error", "分析失败，请重试");
      setStatus("idle");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-ink">环境扫描</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
            <Camera size={11} className="text-primary" />
            Qwen-VL · 拍环境看感官友好度
          </p>
        </div>
        <span className="rounded-full bg-primary-mist/60 px-2 py-0.5 text-[10px] text-primary">
          视觉
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

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
              onClick={handleCapture}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-glow transition-all duration-250 hover:bg-primary/90 active:scale-95"
              aria-label="拍照分析环境"
            >
              <Camera size={28} />
            </button>
            <p className="mt-3 text-xs text-ink-muted">
              拍一张环境照片 · 看看适不适合你
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              只分析光线/噪音/杂乱度 · 不识别人脸
            </p>
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
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="mt-3 text-xs text-ink-muted">
              Qwen-VL 正在分析环境…
            </p>
            <p className="mt-1 text-[11px] text-ink-faint">
              光线 · 噪音 · 视觉杂乱度
            </p>
          </motion.div>
        )}

        {status === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* 总评分 */}
            <div className="flex items-center gap-3 rounded-xl bg-primary-mist/30 p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/60">
                <span className="font-serif text-lg text-primary">
                  {result.overallScore}
                </span>
              </div>
              <div>
                <p className="text-small font-medium text-ink">
                  环境友好度 {getScoreLabel(result.overallScore)}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {result.imageDescription}
                </p>
              </div>
            </div>

            {/* 三维评分 */}
            <div className="space-y-2.5">
              <ScoreRow
                icon={Sun}
                label="光线"
                score={result.light.score}
                note={result.light.note}
                color="#C4956A"
              />
              <ScoreRow
                icon={Volume2}
                label="噪音"
                score={result.noise.score}
                note={result.noise.note}
                color="#6B5FA0"
              />
              <ScoreRow
                icon={Eye}
                label="杂乱度"
                score={result.clutter.score}
                note={result.clutter.note}
                color="#6B9E8A"
              />
            </div>

            {/* 建议 */}
            <div className="rounded-xl bg-sage-mist/20 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Lightbulb size={12} className="text-sage" />
                <span className="text-[11px] font-medium text-sage">建议</span>
              </div>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-1.5 text-small leading-relaxed text-ink">
                    <span className="text-sage">·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-edge py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/60"
            >
              <RotateCcw size={14} /> 再扫一个环境
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScoreRow({
  icon: Icon,
  label,
  score,
  note,
  color,
}: {
  icon: typeof Sun;
  label: string;
  score: number;
  note: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} style={{ color }} className="shrink-0" />
      <span className="w-12 shrink-0 text-xs text-ink">{label}</span>
      <div className="relative h-2 flex-1 rounded-full bg-edge">
        <div
          className="absolute left-0 top-0 h-2 rounded-full transition-all duration-500"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-center font-mono text-xs text-ink">
        {score}
      </span>
      <span className="hidden flex-1 text-[11px] text-ink-muted sm:block">
        {note}
      </span>
    </div>
  );
}

function getScoreLabel(score: number): string {
  if (score >= 7) return "友好";
  if (score >= 5) return "一般";
  if (score >= 3) return "需调整";
  return "不太适合";
}
