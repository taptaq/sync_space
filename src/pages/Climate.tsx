import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, History } from "lucide-react";
import TrendChart from "@/components/climate/TrendChart";
import SupportRulePanel from "@/components/understand/SupportRulePanel";
import CaptureInbox from "@/components/understand/CaptureInbox";
import EnergyArchive from "@/components/climate/EnergyArchive";
import { useStore } from "@/store/useStore";
import { useVoice, useT } from "@/lib/i18n";

// 理解页只保留同一条闭环：收下经历 → 建立支持规则 → 验证是否有效。
export default function Climate() {
  const navigate = useNavigate();
  const checkins = useStore((state) => state.checkins);
  const executions = useStore((state) => state.executions);
  const neuroType = useStore((state) => state.neuroType);
  const { isParent } = useVoice();
  const { tr } = useT();

  return (
    <div className="space-y-7 pt-12">
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

      <SupportRulePanel />

      <button
        type="button"
        onClick={() => navigate("/review")}
        className="glass-card flex w-full items-center gap-4 rounded-card border border-edge/60 p-4 text-left"
      >
        <History size={17} className="text-clay" />
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">{tr("climate_evidence")}</p>
          <p className="mt-1 text-xs text-ink-muted">{tr("climate_evidence_desc")}</p>
        </div>
        <ChevronRight size={15} className="text-ink-faint" />
      </button>

      <details className="border-t border-edge/70 pt-2">
        <summary className="min-h-12 cursor-pointer py-3 text-sm text-ink-muted">
          {tr("climate_week_title")}
        </summary>
        <TrendChart checkins={checkins} executions={executions} />
      </details>

      {/* ASD 能量档案 · 理解什么能让自己充电 */}
      {neuroType === "asd" && !isParent && <EnergyArchive />}
    </div>
  );
}
