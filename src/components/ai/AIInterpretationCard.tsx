import { motion } from "framer-motion";
import { Edit3, FileText, Heart, Sparkles } from "lucide-react";
import type { AIInterpretation } from "@/types";
import { cn } from "@/lib/utils";

// AI 解读三段式（PRD §05 F-09：事件描述 / 情绪翻译 / 需求识别）
// 情绪翻译是核心：把"他总是不理我"翻译成"当沟通突然停止时，我会焦虑"
const SECTIONS = [
  { key: "event", label: "事件", icon: FileText, color: "text-clay" },
  { key: "emotion", label: "情绪翻译", icon: Sparkles, color: "text-primary" },
  { key: "need", label: "需求识别", icon: Heart, color: "text-sage" },
] as const;

export default function AIInterpretationCard({
  interpretation,
  onSettle,
  loading,
}: {
  interpretation: AIInterpretation | null;
  onSettle?: () => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-card border border-edge bg-white/60 p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <span className="text-small font-medium text-ink">AI 解读中</span>
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-2 h-3 w-20 rounded-full bg-edge" />
              <div className="h-4 w-full rounded bg-edge/60" />
              <div className="mt-1.5 h-4 w-4/5 rounded bg-edge/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!interpretation) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-6 shadow-soft"
    >
      <div className="mb-5 flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h3 className="font-serif text-xl text-ink">AI 解读</h3>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(({ key, label, icon: Icon, color }) => (
          <div key={key}>
            <div className="mb-1.5 flex items-center gap-2">
              <Icon size={14} className={color} />
              <span className={cn("text-xs font-medium uppercase tracking-wider", color)}>
                {label}
              </span>
            </div>
            <p className="text-body leading-relaxed text-ink">
              {interpretation[key]}
            </p>
          </div>
        ))}
      </div>

      {onSettle && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={onSettle}
            className="flex-1 rounded-full bg-primary py-2.5 text-small font-medium text-white transition-all duration-250 hover:bg-primary/90 active:scale-[0.98]"
          >
            沉淀为协议
          </button>
          <button className="flex items-center gap-1.5 rounded-full border border-edge px-4 py-2.5 text-small text-ink-muted transition-all duration-250 hover:bg-white/50">
            <Edit3 size={14} /> 编辑
          </button>
        </div>
      )}
    </motion.section>
  );
}
