import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import TrendChart from "@/components/climate/TrendChart";
import ClimateWanderer from "@/components/climate/ClimateWanderer";
import ClimateChromatography from "@/components/climate/ClimateChromatography";
import AIObservationCard from "@/components/ai/AIObservationCard";
import SmartGuidance from "@/components/qwen/SmartGuidance";
import { useStore } from "@/store/useStore";
import { SCALES } from "@/lib/scales";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";

// 我的气候页 · 每周循环（PRD §05 页面2）
// 趋势回放 + AI 观察 + 协议管理 + 神经特质自评 + 简易周报
export default function Climate() {
  const navigate = useNavigate();
  const checkins = useStore((s) => s.checkins);
  const executions = useStore((s) => s.executions);
  const crashMarks = useStore((s) => s.crashMarks);
  const observation = useStore((s) => s.observation);
  const traitProfile = useStore((s) => s.traitProfile);
  const qwenEnabled = useStore((s) => s.qwenEnabled);

  // 简易周报数据
  const weeklySummary = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const weekCheckins = checkins.filter(
      (c) => new Date(c.checkin_at) >= weekAgo,
    );
    if (weekCheckins.length === 0) return null;

    // 阶段分布
    const phaseCounts: Record<string, number> = {};
    weekCheckins.forEach((c) => {
      const phase = detectPhase(c.weather_snapshot.climate, crashMarks);
      phaseCounts[phase] = (phaseCounts[phase] ?? 0) + 1;
    });
    const dominantPhase = Object.entries(phaseCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0];
    const dominantCfg = getPhaseConfig(dominantPhase as any);

    // 协议执行次数
    const weekExecutions = executions.filter(
      (e) => new Date(e.executed_at) >= weekAgo && e.action_taken === "executed",
    );

    // 感官负载变化（最近 vs 7 天前）
    const sorted = [...weekCheckins].sort(
      (a, b) =>
        new Date(a.checkin_at).getTime() - new Date(b.checkin_at).getTime(),
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const sensoryDelta = last.axis_sensory - first.axis_sensory;

    return {
      dominantLabel: dominantCfg.label,
      dominantClass: dominantCfg.badgeClass,
      checkinCount: weekCheckins.length,
      executionCount: weekExecutions.length,
      sensoryDelta,
    };
  }, [checkins, crashMarks, executions]);

  return (
    <div className="space-y-6 pt-10">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-1"
      >
        <p className="text-xs uppercase tracking-widest text-primary">每周循环</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">我的气候</h1>
        <p className="mt-1 text-small text-ink-muted">
          看见趋势 · 管理协议 · AI 发现规律
        </p>
      </motion.header>

      {/* 简易周报（让进步可见） */}
      {weeklySummary && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
        >
          <p className="mb-3 text-xs uppercase tracking-widest text-primary">
            本周小结
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  weeklySummary.dominantClass,
                )}
              >
                {weeklySummary.dominantLabel}
              </span>
              <span className="text-small text-ink">
                主要处于{weeklySummary.dominantLabel}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span>{weeklySummary.checkinCount} 次签到</span>
              <span>·</span>
              <span>{weeklySummary.executionCount} 次协议</span>
            </div>
          </div>
          {weeklySummary.checkinCount >= 2 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              {weeklySummary.sensoryDelta < -0.5 ? (
                <TrendingDown size={14} className="text-sage" />
              ) : weeklySummary.sensoryDelta > 0.5 ? (
                <TrendingUp size={14} className="text-warn" />
              ) : (
                <Minus size={14} className="text-ink-faint" />
              )}
              <span>
                感官负载
                {weeklySummary.sensoryDelta < -0.5
                  ? "有所下降"
                  : weeklySummary.sensoryDelta > 0.5
                    ? "有所上升"
                    : "基本稳定"}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* 本周色谱（七天的颜色记忆 · 一眼看出情绪走向） */}
      <ClimateChromatography checkins={checkins} crashMarks={crashMarks} />

      {/* 趋势回放（叠加协议执行标记） */}
      <TrendChart checkins={checkins} executions={executions} />

      {/* 气候游记（旅程地图 · 避雨亭 · 篝火） */}
      <ClimateWanderer
        checkins={checkins}
        crashMarks={crashMarks}
        executions={executions}
      />

      {/* 已有特质画像展示（自评结果 · 非诊断） */}
      {traitProfile && traitProfile.results.length > 0 && (
        <div className="space-y-2.5">
          {traitProfile.results.map((r) => {
            const scale = SCALES[r.scale_id];
            return (
              <div
                key={r.scale_id}
                className="flex items-center justify-between rounded-card border border-edge bg-white/40 px-4 py-3"
              >
                <div>
                  <p className="text-small font-medium text-ink">
                    {scale.label}
                  </p>
                  <p className="text-xs text-ink-muted">{r.band_title}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-ink">
                    {r.score}/{r.max_score}
                  </p>
                  <p className="text-xs text-ink-faint">非诊断</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI 观察 */}
      {observation && observation.status === "pending" && (
        <AIObservationCard observation={observation} />
      )}

      {/* Qwen 智能建议（基于阶段+趋势生成个性化引导 · 仅 qwenEnabled） */}
      {qwenEnabled && <SmartGuidance />}

      {/* 神经特质自评 · 辅助入口（非主导航 · 了解自己补充画像） */}
      <button
        onClick={() => navigate("/screen")}
        className="mx-auto mb-6 flex items-center gap-1.5 text-xs text-ink-faint underline-offset-2 hover:text-primary hover:underline"
      >
        <Sparkles size={12} />
        {traitProfile && traitProfile.results.length > 0
          ? `特质画像 · 已完成 ${traitProfile.results.length} 份`
          : "想更了解自己？做一份神经特质自评"}
      </button>
    </div>
  );
}
