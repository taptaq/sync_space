import type { ScaleId, ScaleMeta, ScaleQuestion, ScaleResult } from "@/types";
import { SCALES, SCALE_QUESTIONS } from "@/lib/scales";

// 特质自评引擎（PRD §11 非诊断 · 纯画像计算）
// 支持两种官方计分模式：
//   binary：AQ-10 / ASRS v1.1 的"特定选项得 1 分"二分计分
//   likert：HSPS 的"选项 value 累加"Likert 计分
// 结果只输出"特质表达程度"，不输出"是否有 ASD/ADHD/HSP"

/**
 * 计算单题得分
 * - binary：选中的 option index 是否在该题 scored_options 中，是→1 分，否→0 分
 * - likert：选项 value 即得分
 */
export function scoreQuestion(
  scale: ScaleMeta,
  question: ScaleQuestion,
  optionIndex: number, // 用户选的 option 在 scale.options 中的 index
): number {
  if (scale.scoring === "likert") {
    return scale.options[optionIndex]?.value ?? 0;
  }
  // binary
  return question.scored_options?.includes(optionIndex) ? 1 : 0;
}

/**
 * 计算整份量表得分并匹配画像区间
 * @param rawAnswers 每题用户选的 option index（顺序对应 SCALE_QUESTIONS）
 */
export function computeResult(
  scaleId: ScaleId,
  rawAnswers: number[],
): ScaleResult {
  const scale: ScaleMeta = SCALES[scaleId];
  const questions: ScaleQuestion[] = SCALE_QUESTIONS[scaleId];

  // 累加每题得分
  const score = rawAnswers.reduce(
    (sum, optIdx, i) => sum + scoreQuestion(scale, questions[i], optIdx),
    0,
  );
  const maxScore =
    scale.scoring === "binary"
      ? questions.length // binary 满分 = 题数
      : questions.length * 4; // likert 满分 = 题数 × 4（5 点 0-4）

  // 匹配区间（bands 按 max 升序）
  const band = scale.bands.find((b) => score <= b.max) ?? scale.bands[scale.bands.length - 1];

  return {
    scale_id: scaleId,
    score,
    max_score: maxScore,
    level: band.level,
    band_title: band.title,
    band_summary: band.summary,
    recommended_protocols: band.recommended_protocols,
    answers: rawAnswers,
    taken_at: new Date().toISOString(),
  };
}

/**
 * 是否达到官方 cutoff（≥cutoff 分）
 * 仅作为"建议咨询专业人士"的提示，非诊断
 */
export function reachedCutoff(scaleId: ScaleId, score: number): boolean {
  return score >= SCALES[scaleId].cutoff;
}

/**
 * level → 颜色 token（用于 UI 渲染）
 * low: sage（稳定）mid: clay（留意）high: primary（明确需求）
 */
export function levelColor(level: ScaleResult["level"]): string {
  switch (level) {
    case "low":
      return "text-sage";
    case "mid":
      return "text-clay";
    case "high":
      return "text-primary";
  }
}

/**
 * level → 背景色 token
 */
export function levelBg(level: ScaleResult["level"]): string {
  switch (level) {
    case "low":
      return "bg-sage-mist/40";
    case "mid":
      return "bg-clay-mist/40";
    case "high":
      return "bg-primary-mist/40";
  }
}
