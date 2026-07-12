import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, History, Layers, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import TrendChart from "@/components/climate/TrendChart";
import { useStore } from "@/store/useStore";
import { SCALES } from "@/lib/scales";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";
import { useVoice, useT } from "@/lib/i18n";
import RuleBook from "@/components/understand/RuleBook";
import type { Phase } from "@/types";

// 我的气候页 · 每周循环（PRD §05 页面2）
// 趋势回放 + AI 观察 + 协议管理 + 神经特质自评 + 简易周报
export default function Climate() {
  const navigate = useNavigate();
  const checkins = useStore((s) => s.checkins);
  const executions = useStore((s) => s.executions);
  const crashMarks = useStore((s) => s.crashMarks);
  const traitProfile = useStore((s) => s.traitProfile);
  const { isParent } = useVoice();
  const { tr } = useT();

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
    const dominantCfg = getPhaseConfig(dominantPhase as Phase);

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
    <div className="space-y-7 pt-12">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-1"
      >
        <p className="text-xs font-medium text-primary">{isParent ? tr("climate_label_parent") : tr("climate_label_self")}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{tr("climate_title")}</h1>
        <p className="mt-1 text-small text-ink-muted">
          {isParent ? tr("climate_desc_parent") : tr("climate_desc_self")}
        </p>
      </motion.header>

      <RuleBook />

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate("/review")}
          className="glass-card rounded-card border border-edge/60 p-5 text-left"
        >
          <History size={17} className="text-clay" />
          <p className="mt-3 text-sm font-medium text-ink">经历证据</p>
          <p className="mt-1 flex items-center text-xs text-ink-muted">查看时间线 <ChevronRight size={13} /></p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/protocol")}
          className="glass-card rounded-card border border-edge/60 p-5 text-left"
        >
          <Layers size={17} className="text-primary" />
          <p className="mt-3 text-sm font-medium text-ink">支持协议</p>
          <p className="mt-1 flex items-center text-xs text-ink-muted">查看行动规则 <ChevronRight size={13} /></p>
        </button>
      </div>

      {/* 简易周报（让进步可见） */}
      {weeklySummary && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-card border border-edge/60 p-5"
        >
          <p className="mb-3 text-xs uppercase tracking-widest text-primary">
            最近七天的证据
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

      {/* 唯一趋势视图：为个人规则提供证据 */}
      <TrendChart checkins={checkins} executions={executions} />

      {/* 已有特质画像展示（自评结果 · 非诊断） */}
      {traitProfile && traitProfile.results.length > 0 && (
        <div className="space-y-2.5">
          {traitProfile.results.map((r) => {
            const scale = SCALES[r.scale_id];
            return (
              <div
                key={r.scale_id}
                className="flex items-center justify-between rounded-card border border-edge/60 bg-white/40 px-4 py-3"
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

      {/* 神经特质自评 · 辅助入口（非主导航 · 了解自己补充画像） */}
      <button
        onClick={() => navigate("/screen")}
        className="mx-auto mb-6 flex items-center gap-1.5 text-xs text-ink-faint underline-offset-2 hover:text-primary hover:underline"
      >
        <Sparkles size={12} />
        {traitProfile && traitProfile.results.length > 0
          ? `${tr("climate_trait_done")} ${traitProfile.results.length} 份`
          : isParent
            ? tr("climate_self_assess_parent")
            : tr("climate_self_assess_self")}
      </button>
    </div>
  );
}
