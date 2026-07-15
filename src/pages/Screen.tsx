import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  Sparkles,
  ChevronRight,
  Check,
  Heart,
  Shield,
  CloudSun,
} from "lucide-react";
import type { ScaleId, ScaleResult } from "@/types";
import { SCALE_LIST, SCALE_QUESTIONS, SCALES } from "@/lib/scales";
import { computeResult, levelColor, levelBg, detectAdhdSubtype } from "@/lib/traitEngine";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 神经特质自评页（PRD §11 非诊断声明 · §03 可预测可退出）
// 三阶段：选量表 → 逐题作答 → 结果画像（保存到特质档案）
// 全程可跳过、可回退，结果只输出"特质表达程度"不输出"是否有 X"

type Phase = "select" | "quiz" | "result";

const NEURO_ICON: Record<string, typeof Brain> = {
  asd: Brain,
  adhd: Sparkles,
  hsp: Heart,
  ptsd: Shield,
  other: CloudSun,
};

export default function Screen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const saveTraitResult = useStore((s) => s.saveTraitResult);
  const traitProfile = useStore((s) => s.traitProfile);
  const setAdhdSubtype = useStore((s) => s.setAdhdSubtype);
  const pushToast = useStore((s) => s.pushToast);
  const { tr, tt } = useT();

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

  // URL 参数 ?scale=dsm5a18b → 自动启动指定量表（用于 ADHD 子类型检测引导）
  useEffect(() => {
    const scaleParam = searchParams.get("scale") as ScaleId | null;
    if (scaleParam && SCALE_QUESTIONS[scaleParam] && phase === "select") {
      startScale(scaleParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      // DSM-5 评估完成 → 自动推断 ADHD 子类型
      if (scaleId) {
        const detected = detectAdhdSubtype(scaleId, result.answers);
        if (detected) {
          setAdhdSubtype(detected);
          const typeLabel = detected === "inattentive"
            ? tr("adhd_subtype_inattentive")
            : detected === "hyperactive"
              ? tr("adhd_subtype_hyperactive")
              : detected === "combined"
                ? tr("adhd_subtype_combined")
                : tr("adhd_subtype_unknown");
          pushToast("success", tr("adhd_subtype_detected", { type: typeLabel }));
        }
      }
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
        <Header title={tr("screen_title")} onBack={() => navigate("/climate")} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex-1"
        >
          <h1 className="font-serif text-3xl leading-tight text-ink">
            {tr("screen_h1")}
          </h1>
          <p className="mt-3 text-body leading-relaxed text-ink-muted">
            {tr("screen_intro_1")}<span className="text-primary">{tr("screen_not_diagnosis")}</span>。
            {tr("screen_intro_2")}
          </p>

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
                  className="flex w-full items-center gap-4 rounded-card border border-edge bg-white/50 p-4 text-left transition-all duration-250 hover:border-primary hover:bg-primary-mist/30 active:scale-[0.99]"
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
                          {tr("screen_done")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {tt(scale.full_name)} · {scale.question_count} {tr("screen_questions_unit")}
                    </p>
                    {doneResult && (
                      <p className="mt-1 text-xs text-ink-faint">
                        {tr("screen_last")}{tt(doneResult.band_title)} · {doneResult.score}/{doneResult.max_score} {tr("screen_score_unit")}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-ink-faint"
                  />
                </button>
              );
            })}
          </div>

          <p className="mt-6 px-2 text-center text-xs leading-relaxed text-ink-muted">
            {tr("screen_scale_note_1")}
            <br />
            {tr("screen_scale_note_2")}
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
              {tr("screen_exit")}
            </button>
          }
        />

        {/* 进度条（PRD §09：进度节点高亮仅在进度条到达时） */}
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-ink-muted">
            <span>
              {tr("screen_progress", { cur: questionIdx + 1, total: questions.length })}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-1 flex-col"
          >
            <p className="text-xs uppercase tracking-widest text-primary">
              {tt(scale.full_name)}
            </p>
            <h2 className="mt-3 font-serif text-2xl leading-relaxed text-ink">
              {tt(q.text)}
            </h2>

            <div className="mt-10 space-y-3">
              {scale.options.map((opt, optIdx) => {
                const selected = answers[questionIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => pickAnswer(optIdx)}
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
                      {tt(opt.label)}
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
                  {tr("screen_prev")}
                </button>
              )}
              <p className="mt-3 text-center text-xs text-ink-muted">
                {isLast ? tr("screen_last_hint") : tr("screen_auto_next")}
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
        <Header title={tr("screen_result_title")} onBack={() => setPhase("select")} />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
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
              {scale.label} · {tt(scale.full_name)}
            </p>
            <h2
              className={cn(
                "mt-2 font-serif text-3xl",
                levelColor(result.level),
              )}
            >
              {tt(result.band_title)}
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
                {tr("screen_cutoff_hint_1")}
                {tr("screen_cutoff_hint_2")}
              </p>
            </div>

            <p className="mt-5 text-body leading-relaxed text-ink">
              {tt(result.band_summary)}
            </p>
          </div>

          {/* 推荐协议方向 */}
          <div className="mt-5">
            <p className="px-1 text-xs uppercase tracking-widest text-primary">
              {tr("screen_recommended")}
            </p>
            <div className="mt-3 space-y-2.5">
              {result.recommended_protocols.map((proto, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="rounded-card border border-dashed-candidate bg-white/40 p-4"
                >
                  <p className="font-mono text-xs text-primary">THEN</p>
                  <p className="mt-1.5 text-body leading-relaxed text-ink">
                    {tt(proto)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 非诊断声明 · 精简单行 */}
          <p className="mt-5 px-2 text-center text-[11px] leading-relaxed text-ink-faint">
            {tr("screen_result_disclaimer_1")}<span className="text-ink-muted">{tr("screen_not_diagnosis")}</span>。
            {tr("screen_result_disclaimer_2")}
          </p>

          {/* 操作 */}
          <div className="mt-6 space-y-3 pb-6">
            <button
              onClick={saveAndExit}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-body font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
            >
              <Check size={18} /> {tr("screen_save")}
            </button>
            <button
              onClick={exitWithoutSave}
              className="w-full text-center text-xs text-ink-muted underline-offset-2 hover:underline"
            >
              {tr("screen_dont_save")}
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
