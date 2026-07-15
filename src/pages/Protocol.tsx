import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Plus, X } from "lucide-react";
import ProtocolTemplateLibrary from "@/components/protocol/ProtocolTemplateLibrary";
import ProtocolCard from "@/components/protocol/ProtocolCard";
import { useStore } from "@/store/useStore";
import { useVoice, useT } from "@/lib/i18n";

// 协议页 · 集中管理协议与疗法（拆分自 Climate · 降低单页信息密度）
// 三块：协议模板库（一键导入） / 循证疗法库（转协议） / 我的协议（管理）
export default function Protocol() {
  const navigate = useNavigate();
  const protocols = useStore((s) => s.protocols);
  const executions = useStore((s) => s.executions);
  const { isParent } = useVoice();
  const { tr } = useT();
  const [showLibrary, setShowLibrary] = useState(false);

  // 排序：候选在前，按最近执行时间
  const sortedProtocols = useMemo(() => {
    return [...protocols].sort((a, b) => {
      if (a.status === "candidate" && b.status !== "candidate") return -1;
      if (b.status === "candidate" && a.status !== "candidate") return 1;
      const aTime = a.last_executed_at ? new Date(a.last_executed_at).getTime() : 0;
      const bTime = b.last_executed_at ? new Date(b.last_executed_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [protocols]);

  const executedCount = executions.filter((e) => e.action_taken === "executed").length;

  return (
    <div className="space-y-7 pt-12">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-1"
      >
        <p className="text-xs uppercase tracking-widest text-primary">{tr("protocol_label")}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{isParent ? tr("protocol_title_parent") : tr("protocol_title_self")}</h1>
        <p className="mt-1 text-small text-ink-muted">
          {protocols.length > 0
            ? `${protocols.length} ${tr("protocol_subtitle")} ${executedCount} ${tr("protocol_executed_times")}`
            : isParent
              ? tr("protocol_empty_parent")
              : tr("protocol_empty_self")}
        </p>
      </motion.header>

      {/* 我的协议 */}
      <section>
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="font-serif text-xl text-ink">{tr("protocol_existing")}</h2>
          <button
            onClick={() => navigate("/protocol/new")}
            className="flex items-center gap-1 rounded-full border border-edge bg-white/50 px-3.5 py-1.5 text-xs text-primary transition-all duration-250 hover:bg-primary-mist/40 active:scale-[0.98]"
          >
            <Plus size={14} /> {tr("protocol_new")}
          </button>
        </div>

        <div className="space-y-3">
          {sortedProtocols.map((p) => (
            <ProtocolCard key={p.id} protocol={p} />
          ))}
        </div>

        {protocols.length === 0 && (
          <div className="rounded-card border border-dashed-candidate p-8 text-center">
            <p className="text-small text-ink-muted">
              {tr("protocol_empty_state")}
              <br />
              {isParent ? tr("protocol_empty_def_parent") : tr("protocol_empty_def_self")}
            </p>
            <button
              onClick={() => navigate("/protocol/new")}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90"
            >
              {tr("protocol_create_first")}
            </button>
          </div>
        )}
      </section>

      <section className="border-t border-edge/70 pt-5">
        <button
          type="button"
          onClick={() => setShowLibrary((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-ink">
            {showLibrary ? <X size={16} /> : <BookOpen size={16} />}
            {showLibrary ? tr("protocol_library_collapse") : tr("protocol_library_expand")}
          </span>
          <span className="text-xs text-ink-muted">{tr("protocol_library_hint")}</span>
        </button>
        {showLibrary && <div className="mt-3"><ProtocolTemplateLibrary /></div>}
      </section>

      <p className="px-4 pb-4 text-center text-xs leading-relaxed text-ink-muted">
        {tr("protocol_footer_1")}
        <br />
        {isParent ? tr("protocol_footer_2_parent") : tr("protocol_footer_2_self")}
      </p>
    </div>
  );
}
