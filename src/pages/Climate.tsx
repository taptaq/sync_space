import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, History, Layers, TrendingUp, TrendingDown, Minus, ClipboardList } from "lucide-react";
import TrendChart from "@/components/climate/TrendChart";
import { useStore } from "@/store/useStore";
import { SCALES } from "@/lib/scales";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { cn } from "@/lib/utils";
import { useVoice, useT } from "@/lib/i18n";
import RuleBook from "@/components/understand/RuleBook";
import CaptureInbox from "@/components/understand/CaptureInbox";
import type { Phase } from "@/types";

// 我的气候页 · 每周循环（PRD §05 页面2）
// 趋势回放 + AI 观察 + 协议管理 + 神经特质自评 + 简易周报
export default function Climate() {
  const navigate = useNavigate();
  const checkins = useStore((s) => s.checkins);
  const executions = useStore((s) => s.executions);
  const crashMarks = useStore((s) => s.crashMarks);
  const traitProfile = useStore((s) => s.traitProfile);
  const neuroType = useStore((s) => s.neuroType);
  const { isParent } = useVoice();
  const { tr, tt } = useT();

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

      {neuroType === "adhd" && <CaptureInbox />}

      <RuleBook />

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => navigate("/review")}
          className="glass-card rounded-card border border-edge/60 p-5 text-left"
        >
          <History size={17} className="text-clay" />
          <p className="mt-3 text-sm font-medium text-ink">{tr("climate_evidence")}</p>
          <p className="mt-1 flex items-center text-xs text-ink-muted">{tr("climate_evidence_desc")} <ChevronRight size={13} /></p>
        </button>
        <button
          type="button"
          onClick={() => navigate("/protocol")}
          className="glass-card rounded-card border border-edge/60 p-5 text-left"
        >
          <Layers size={17} className="text-primary" />
          <p className="mt-3 text-sm font-medium text-ink">{tr("climate_protocols")}</p>
          <p className="mt-1 flex items-center text-xs text-ink-muted">{tr("climate_protocols_desc")} <ChevronRight size={13} /></p>
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
            {tr("climate_week_title")}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs",
                  weeklySummary.dominantClass,
                )}
              >
                {tt(weeklySummary.dominantLabel)}
              </span>
              <span className="text-small text-ink">
                {tr("climate_week_dominant")}{tt(weeklySummary.dominantLabel)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span>{weeklySummary.checkinCount} {tr("climate_week_checkins")}</span>
              <span>·</span>
              <span>{weeklySummary.executionCount} {tr("climate_week_protocols")}</span>
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
                {tr("climate_sensory_label")}
                {weeklySummary.sensoryDelta < -0.5
                  ? tr("climate_sensory_down")
                  : weeklySummary.sensoryDelta > 0.5
                    ? tr("climate_sensory_up")
                    : tr("climate_sensory_stable")}
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
                  <p className="text-xs text-ink-muted">{tt(r.band_title)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-ink">
                    {r.score}/{r.max_score}
                  </p>
                  <p className="text-xs text-ink-faint">{tr("climate_non_diagnosis")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 神经特质自评 · 卡片入口（10 份公开量表 · 非诊断） */}
      <button
        onClick={() => navigate("/screen")}
        className="glass-card flex w-full items-center gap-4 rounded-card border border-edge/60 p-5 text-left transition-all duration-250 hover:border-primary/40 hover:bg-primary-mist/20 active:scale-[0.99]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-mist/50">
          <ClipboardList size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-body font-medium text-ink">{tr("climate_assess_title")}</p>
            {traitProfile && traitProfile.results.length > 0 && (
              <span className="rounded-full bg-sage-mist/60 px-2 py-0.5 text-[10px] text-sage">
                {traitProfile.results.length} {tr("climate_assess_count")}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            {isParent ? tr("climate_assess_desc_parent") : tr("climate_assess_desc_self")}
          </p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" />
      </button>
    </div>
  );
}
