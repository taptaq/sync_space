import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Sparkles,
  ChevronRight,
  Check,
  Info,
} from "lucide-react";
import type { ScaleId, ScaleResult } from "@/types";
import { SCALE_LIST, SCALE_QUESTIONS, SCALES } from "@/lib/scales";
import { computeResult, levelColor, levelBg } from "@/lib/traitEngine";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

// 神经特质自评页（PRD §11 非诊断声明 · §03 可预测可退出）
// 三阶段：选量表 → 逐题作答 → 结果画像（保存到特质档案）
// 全程可跳过、可回退，结果只输出"特质表达程度"不输出"是否有 X"

type Phase = "select" | "quiz" | "result";

const NEURO_ICON: Record<string, typeof Brain> = {
  asd: Brain,
  adhd: Sparkles,
};

export default function Screen() {
  const navigate = useNavigate();
  const saveTraitResult = useStore((s) => s.saveTraitResult);
  const traitProfile = useStore((s) => s.traitProfile);

  const [phase, setPhase] = useState<Phase>("select");
  const [scaleId, setScaleId] = useState<ScaleId | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<ScaleResult | null>(null);

  // ---- 阶段切换 ----
  const startScale = (id: ScaleId) => {
    setScaleId(id);
    setAnswers(new Array(SCALE_QUESTIONS[id].length).fill(-1));
    setQuestionIdx(0);
    setPhase("quiz");
  };

  const pickAnswer = (value: number) => {
    if (!scaleId) return;
    const next = [...answers];
    next[questionIdx] = value;
    setAnswers(next);

    // 自动进入下一题（PRD §09：减少决策摩擦）
    setTimeout(() => {
      if (questionIdx < SCALE_QUESTIONS[scaleId].length - 1) {
        setQuestionIdx(questionIdx + 1);
      } else {
        // 全部完成 → 计算结果
        const res = computeResult(scaleId, next);
        setResult(res);
        setPhase("result");
      }
    }, 220);
  };

  const goPrevQuestion = () => {
    if (questionIdx > 0) setQuestionIdx(questionIdx - 1);
  };

  const saveAndExit = () => {
    if (result) {
      saveTraitResult(result);
      navigate("/climate");
    }
  };

  const exitWithoutSave = () => {
    navigate("/climate");
  };

  // ============ 阶段 1：量表选择 ============
  if (phase === "select") {
    return (
      <div className="flex min-h-screen flex-col pt-10">
        <Header title="神经特质自评" onBack={() => navigate("/climate")} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex-1"
        >
          <h1 className="font-serif text-3xl leading-tight text-ink">
            多了解自己一点
          </h1>
          <p className="mt-3 text-body leading-relaxed text-ink-muted">
            这是基于业内公开量表的自评画像，<span className="text-primary">不是诊断</span>。
            结果会帮你更精准地配置签到维度和协议方向。
            <br />
            神经多样性是差异，不是疾病。
          </p>

          {/* 非诊断声明卡 */}
          <div className="mt-5 flex gap-2.5 rounded-card border border-edge bg-white/40 p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-clay" />
            <p className="text-small leading-relaxed text-ink-muted">
              自评只反映你的特质表达程度。如果你正在经历明显困扰，
              请联系专业医疗或心理人士做正式评估。
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {SCALE_LIST.map((scale) => {
              const Icon = NEURO_ICON[scale.neuro_type] ?? Brain;
              const doneResult = traitProfile?.results.find(
                (r) => r.scale_id === scale.id,
              );
              return (
                <button
                  key={scale.id}
                  onClick={() => startScale(scale.id)}
                  className="flex w-full items-start gap-4 rounded-card border border-edge bg-white/50 p-4 text-left transition-all duration-250 hover:border-primary hover:bg-primary-mist/30 active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-mist/50">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-ink">
                        {scale.label}
                      </p>
                      {doneResult && (
                        <span className="rounded-full bg-sage-mist/60 px-2 py-0.5 text-[10px] text-sage">
                          已完成
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {scale.full_name} · {scale.question_count} 题
                    </p>
                    <p className="mt-2 text-small leading-relaxed text-ink-muted">
                      {scale.description}
                    </p>
                    <p className="mt-2 text-[11px] text-ink-faint">
                      来源：{scale.source}
                    </p>
                    {doneResult && (
                      <p className="mt-1.5 text-xs text-ink-faint">
                        上次：{doneResult.band_title} · {doneResult.score}/
                        {doneResult.max_score} 分
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="mt-1 shrink-0 text-ink-faint"
                  />
                </button>
              );
            })}
          </div>

          {/* 官方测试链接（PRD §11 非诊断 · 提供权威出口） */}
          <div className="mt-5 rounded-card border border-edge bg-white/30 p-4">
            <p className="text-xs font-medium text-ink">官方测试链接</p>
            <p className="mt-1 text-[11px] text-ink-muted">
              如果你想要完整的官方评估体验，可以直接访问这些权威来源。
            </p>
            <div className="mt-3 space-y-2">
              {SCALE_LIST.map((s) => (
                <a
                  key={s.id}
                  href={s.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2 text-xs transition-colors hover:bg-primary-mist/30"
                >
                  <span className="text-ink">{s.label} · {s.full_name.split("·")[0].trim()}</span>
                  <span className="text-primary">访问 ↗</span>
                </a>
              ))}
            </div>
          </div>

          <p className="mt-6 px-2 text-center text-xs leading-relaxed text-ink-muted">
            三份量表可以都做，也可以只做一份。
            <br />
            随时可以重做，结果会覆盖上一次。
          </p>
        </motion.div>
      </div>
    );
  }

  // ============ 阶段 2：逐题作答 ============
  if (phase === "quiz" && scaleId) {
    const scale = SCALES[scaleId];
    const questions = SCALE_QUESTIONS[scaleId];
    const q = questions[questionIdx];
    const progress = (questionIdx / questions.length) * 100;
    const isLast = questionIdx === questions.length - 1;

    return (
      <div className="flex min-h-screen flex-col pt-10">
        <Header
          title={scale.label}
          onBack={() => (questionIdx > 0 ? goPrevQuestion() : setPhase("select"))}
          right={
            <button
              onClick={() => setPhase("select")}
              className="text-xs text-ink-muted transition-colors hover:text-ink"
            >
              退出
            </button>
          }
        />

        {/* 进度条（PRD §09：进度节点高亮仅在进度条到达时） */}
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-ink-muted">
            <span>
              第 {questionIdx + 1} / {questions.length} 题
            </span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-edge">
            <motion.div
              className="h-full bg-primary"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={questionIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {scale.full_name}
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-relaxed text-ink">
              {q.text}
            </h2>

            <div className="mt-10 space-y-3">
              {scale.options.map((opt) => {
                const selected = answers[questionIdx] === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => pickAnswer(opt.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-card border p-4 text-left transition-all duration-250 active:scale-[0.99]",
                      selected
                        ? "border-primary bg-primary-mist/50 shadow-glow"
                        : "border-edge bg-white/40 hover:bg-white/70",
                    )}
                  >
                    <span
                      className={cn(
                        "text-body",
                        selected ? "font-medium text-primary" : "text-ink",
                      )}
                    >
                      {opt.label}
                    </span>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        selected
                          ? "border-primary bg-primary"
                          : "border-ink-faint",
                      )}
                    >
                      {selected && (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pb-6 pt-6">
              {questionIdx > 0 && (
                <button
                  onClick={goPrevQuestion}
                  className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
                >
                  上一题
                </button>
              )}
              <p className="mt-3 text-center text-xs text-ink-muted">
                {isLast ? "选完最后一题将自动生成画像" : "选完自动进入下一题"}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ============ 阶段 3：结果画像 ============
  if (phase === "result" && result) {
    const scale = SCALES[result.scale_id];
    return (
      <div className="flex min-h-screen flex-col pt-10">
        <Header title="特质画像" onBack={() => setPhase("select")} />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex-1"
        >
          {/* 画像卡 */}
          <div
            className={cn(
              "rounded-bowl border border-edge p-6",
              levelBg(result.level),
            )}
          >
            <p className="text-xs uppercase tracking-widest text-ink-muted">
              {scale.label} · {scale.full_name}
            </p>
            <h2
              className={cn(
                "mt-2 font-serif text-3xl",
                levelColor(result.level),
              )}
            >
              {result.band_title}
            </h2>

            {/* 分数可视化 · 特质表达强度（非诊断阈值） */}
            <div className="mt-5">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl text-ink">
                  {result.score}
                </span>
                <span className="font-mono text-lg text-ink-muted">
                  / {result.max_score}
                </span>
              </div>
              <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/60">
                <motion.div
                  className={cn(
                    "h-full",
                    result.level === "low"
                      ? "bg-sage"
                      : result.level === "mid"
                        ? "bg-clay"
                        : "bg-primary",
                  )}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(result.score / result.max_score) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
                {/* 参考点刻度线（弱化 · 非警示色） */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-ink-faint/30"
                  style={{
                    left: `${(scale.cutoff / result.max_score) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-[11px] text-ink-faint">
                竖线为参考点——许多自评者在这个分数附近开始明显感受到特质影响。
                <br />
                这不是诊断标准，只是帮你定位自己的特质表达强度。
              </p>
            </div>

            <p className="mt-5 text-body leading-relaxed text-ink">
              {result.band_summary}
            </p>
          </div>

          {/* 非诊断声明 */}
          <div className="mt-5 flex gap-2.5 rounded-card border border-edge bg-white/40 p-4">
            <Info size={16} className="mt-0.5 shrink-0 text-clay" />
            <div className="flex-1">
              <p className="text-small leading-relaxed text-ink-muted">
                这是基于你作答的特质画像，<span className="text-ink">不是诊断</span>。
                量表来源：{scale.source}。
                如需专业评估，请联系医疗或心理专业人士。
              </p>
              <a
                href={scale.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline"
              >
                访问官方测试页面 ↗
              </a>
            </div>
          </div>

          {/* 推荐协议方向 */}
          <div className="mt-6">
            <p className="px-1 text-xs uppercase tracking-widest text-primary">
              适合你的协议方向
            </p>
            <p className="mt-1 px-1 text-small text-ink-muted">
              这是 AI 秘书基于你的特质画像给的参考，你可以稍后在协议页采纳或忽略。
            </p>
            <div className="mt-4 space-y-2.5">
              {result.recommended_protocols.map((proto, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                  className="rounded-card border border-dashed-candidate bg-white/40 p-4"
                >
                  <p className="font-mono text-xs text-primary">THEN</p>
                  <p className="mt-1.5 text-body leading-relaxed text-ink">
                    {proto}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 操作 */}
          <div className="mt-8 space-y-3 pb-6">
            <button
              onClick={saveAndExit}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
            >
              <Check size={18} /> 保存到我的特质画像
            </button>
            <button
              onClick={exitWithoutSave}
              className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
            >
              不保存，先看看
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}

// ============ 通用头部 ============
function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-white/50 transition-all duration-250 hover:bg-white/80 active:scale-[0.95]"
      >
        <ArrowLeft size={18} className="text-ink" />
      </button>
      <span className="text-small font-medium text-ink">{title}</span>
      <div className="min-w-9">{right ?? <span className="block w-9" />}</div>
    </div>
  );
}
