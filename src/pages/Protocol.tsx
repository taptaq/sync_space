import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import ProtocolTemplateLibrary from "@/components/protocol/ProtocolTemplateLibrary";
import TherapyLibrary from "@/components/therapy/TherapyLibrary";
import ProtocolCard from "@/components/protocol/ProtocolCard";
import { useStore } from "@/store/useStore";

// 协议页 · 集中管理协议与疗法（拆分自 Climate · 降低单页信息密度）
// 三块：协议模板库（一键导入） / 循证疗法库（转协议） / 我的协议（管理）
export default function Protocol() {
  const navigate = useNavigate();
  const protocols = useStore((s) => s.protocols);
  const executions = useStore((s) => s.executions);

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
    <div className="space-y-6 pt-10">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-1"
      >
        <p className="text-xs uppercase tracking-widest text-primary">协议与疗法</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">我的协议</h1>
        <p className="mt-1 text-small text-ink-muted">
          {protocols.length > 0
            ? `${protocols.length} 份协议 · 执行过 ${executedCount} 次`
            : "从模板库选一个开始，或自己写一份"}
        </p>
      </motion.header>

      {/* 协议模板库（循证预设 · 一键导入 · 降低配置认知门槛） */}
      <ProtocolTemplateLibrary />

      {/* 循证疗法库（按神经特质 + 阶段推荐 · 可一键转为协议） */}
      <TherapyLibrary />

      {/* 我的协议 */}
      <section>
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="font-serif text-xl text-ink">已有协议</h2>
          <button
            onClick={() => navigate("/protocol/new")}
            className="flex items-center gap-1 rounded-full border border-edge bg-white/50 px-3.5 py-1.5 text-xs text-primary transition-all duration-250 hover:bg-primary-mist/40 active:scale-[0.98]"
          >
            <Plus size={14} /> 新协议
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
              还没有协议。
              <br />
              协议是"当 X 发生时，我给自己约定 Y"。
            </p>
            <button
              onClick={() => navigate("/protocol/new")}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90"
            >
              创建第一份协议
            </button>
          </div>
        )}
      </section>

      <p className="px-4 pb-4 text-center text-xs leading-relaxed text-ink-muted">
        AI 永远不会修改协议，只能建议。
        <br />
        协议的触发、执行、暂停、删除全部由你决定。
      </p>
    </div>
  );
}
