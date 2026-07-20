import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, ChevronRight, History, BarChart3, Sparkles } from "lucide-react";
import TrendChart from "@/components/climate/TrendChart";
import SupportRulePanel from "@/components/understand/SupportRulePanel";
import CaptureInbox from "@/components/understand/CaptureInbox";
import EnergyArchive from "@/components/climate/EnergyArchive";
import ProtocolEffectivenessCard from "@/components/climate/ProtocolEffectivenessCard";
import SupportRuleEffectivenessCard from "@/components/climate/SupportRuleEffectivenessCard";
import ClimateInsightsCard from "@/components/climate/ClimateInsightsCard";
import WeeklyMilestoneCard from "@/components/climate/WeeklyMilestoneCard";
import AIObservationCard from "@/components/ai/AIObservationCard";
import SpotlightGuide from "@/components/common/SpotlightGuide";
import { useStore } from "@/store/useStore";
import { useVoice, useT } from "@/lib/i18n";

// 理解页只保留同一条闭环：收下经历 → 建立支持规则 → 验证是否有效。
// 统计类卡片（4 张）合并到一个 <details> 默认折叠，降低首屏信息过载（ASD/ADHD 友好）。
export default function Climate() {
  const navigate = useNavigate();
  const checkins = useStore((state) => state.checkins);
  const executions = useStore((state) => state.executions);
  const connectionMoments = useStore((state) => state.connectionMoments);
  const neuroType = useStore((state) => state.neuroType);
  const traitProfile = useStore((state) => state.traitProfile);
  const observation = useStore((state) => state.observation);
  const { isParent } = useVoice();
  const { tr } = useT();
  const completedCount = traitProfile?.results.length ?? 0;

  return (
    <div className="space-y-6 pt-12">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="px-1"
      >
        <p className="text-xs font-medium text-primary">
          {isParent ? tr("climate_label_parent") : tr("climate_label_self")}
        </p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{tr("climate_title")}</h1>
        <p className="mt-1 text-small text-ink-muted">
          {isParent ? tr("climate_desc_parent") : tr("climate_desc_self")}
        </p>
      </motion.header>

      {neuroType === "adhd" && <CaptureInbox />}

      {/* 核心功能：建立/编辑支持规则 */}
      <div data-tour-id="climate-support-panel">
        <SupportRulePanel />
      </div>

      {/* AI 模式观察 · 攒够两周数据后 AI 在周日生成观察建议 */}
      {observation && observation.status === "pending" && (
        <AIObservationCard observation={observation} />
      )}

      {/* 数据与回顾 · 默认折叠（4 张统计卡合并） */}
      <details data-tour-id="climate-protocol-effect" className="rounded-card border border-edge/60 bg-white/40">
        <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 py-3 text-sm text-ink-muted">
          <BarChart3 size={14} className="text-primary" />
          <span className="flex-1">{tr("climate_stats_summary")}</span>
          <ChevronRight size={14} className="text-ink-faint" />
        </summary>
        <div className="space-y-4 border-t border-edge/50 px-4 py-4">
          <ClimateInsightsCard />
          <WeeklyMilestoneCard />
          <ProtocolEffectivenessCard />
          <SupportRuleEffectivenessCard />

          {/* AI 给你的新视角 · 回看历次 self-connection 自动保存的 ai_understanding */}
          {connectionMoments.filter((m) => m.mode === "self" && m.ai_understanding).length > 0 && (
            <section className="rounded-lg border border-edge/40 bg-white/40 p-3">
              <header className="mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" />
                <h3 className="text-xs font-medium text-ink-muted">{tr("connection_past_understandings")}</h3>
              </header>
              <ul className="space-y-2">
                {connectionMoments
                  .filter((m) => m.mode === "self" && m.ai_understanding)
                  .slice(0, 5)
                  .map((m) => (
                    <li key={m.id} className="rounded-lg bg-white/50 px-3 py-2">
                      <p className="text-xs text-ink-faint">
                        {new Date(m.connected_at).toLocaleDateString()}
                        {m.feedback === "helpful" && ` · ${tr("connection_past_helpful_badge")}`}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink">{m.ai_understanding}</p>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/* 过去的记录 · 完整时间线入口（合并到数据与回顾区，避免重复） */}
          <button
            type="button"
            onClick={() => navigate("/review")}
            className="flex w-full items-center gap-3 rounded-lg border border-edge/40 bg-white/40 p-3 text-left transition-colors hover:bg-white/60"
          >
            <History size={15} className="text-clay" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{tr("climate_evidence")}</p>
              <p className="text-xs text-ink-muted">{tr("climate_evidence_desc")}</p>
            </div>
            <ChevronRight size={14} className="text-ink-faint" />
          </button>
        </div>
      </details>

      {/* 神经特质自评入口 · 10 份公开量表 · 非诊断 */}
      <button
        type="button"
        onClick={() => navigate("/screen")}
        className="glass-card flex w-full items-center gap-4 rounded-card border border-edge/60 p-4 text-left"
      >
        <Brain size={17} className="text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            {tr("climate_assess_title")}
            {completedCount > 0 && (
              <span className="ml-2 align-middle text-xs font-normal text-primary">
                · {tr("climate_trait_done")} {completedCount} {tr("climate_assess_count")}
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {isParent ? tr("climate_assess_desc_parent") : tr("climate_assess_desc_self")}
          </p>
        </div>
        <ChevronRight size={15} className="text-ink-faint" />
      </button>

      {/* ASD 能量档案 · 理解什么能让自己充电 */}
      {neuroType === "asd" && !isParent && <EnergyArchive />}

      {/* 趋势图 · 折叠在最后 */}
      <details className="border-t border-edge/70 pt-2">
        <summary className="min-h-12 cursor-pointer py-3 text-sm text-ink-muted">
          {tr("climate_week_title")}
        </summary>
        <TrendChart checkins={checkins} executions={executions} />
      </details>

      <SpotlightGuide
        pageKey="climate"
        steps={[
          {
            targetId: "climate-support-panel",
            titleKey: "guide_climate_support_title",
            bodyKey: "guide_climate_support_body",
          },
          {
            targetId: "climate-protocol-effect",
            titleKey: "guide_climate_effect_title",
            bodyKey: "guide_climate_effect_body",
          },
        ]}
      />
    </div>
  );
}
