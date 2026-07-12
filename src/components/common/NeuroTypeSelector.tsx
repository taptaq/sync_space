import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Sparkles, CloudSun, X } from "lucide-react";
import type { NeuroType } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

// 神经特质选择器（轻量 · 非 Onboarding · 让用户随时调整）
// 选择后立即生效：气候模型 / 疗法库 / 协议模板全部按新特质重新计算
const OPTIONS: { key: NeuroType; label: string; desc: string; icon: typeof Brain; switchHint: string }[] = [
  { key: "asd", label: "ASD", desc: "感官敏感 · 需要可预测性", icon: Brain, switchHint: "已切换到 ASD 视角 · 侧重视官预算与可预测性" },
  { key: "adhd", label: "ADHD", desc: "注意力起伏 · 启动困难", icon: Sparkles, switchHint: "已切换到 ADHD 视角 · 侧重执行功能与多巴胺电量" },
  { key: "other", label: "其他", desc: "我还不太确定 · 两套工具都可见", icon: CloudSun, switchHint: "已切换到通用视角 · ASD 和 ADHD 的工具都可见，按需选用" },
];

export default function NeuroTypeSelector({ onClose }: { onClose: () => void }) {
  const neuroType = useStore((s) => s.neuroType);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const pushToast = useStore((s) => s.pushToast);
  const [selected, setSelected] = useState<NeuroType>(neuroType);

  const confirm = () => {
    if (selected !== neuroType) {
      setOnboarded(selected);
      const hint = OPTIONS.find((o) => o.key === selected)?.switchHint;
      pushToast("success", hint ?? "已切换");
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/80 p-5 backdrop-blur-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">更改神经特质</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-ink-muted transition-colors hover:bg-edge/40"
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>

      <p className="mb-4 text-xs text-ink-muted">
        切换后，气候模型、疗法协议推荐会按新特质重新计算。不影响已有签到数据。
      </p>

      <div className="space-y-2">
        {OPTIONS.map(({ key, label, desc, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-250",
              selected === key
                ? "border-primary bg-primary-mist/30"
                : "border-edge bg-white/40 hover:bg-white/60",
            )}
          >
            <Icon
              size={18}
              className={cn(selected === key ? "text-primary" : "text-ink-muted")}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-[11px] text-ink-muted">{desc}</p>
            </div>
            {selected === key && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="h-2 w-2 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-full border border-edge py-2 text-sm text-ink-muted transition-colors hover:bg-edge/30"
        >
          取消
        </button>
        <button
          onClick={confirm}
          disabled={selected === neuroType}
          className={cn(
            "flex-1 rounded-full py-2 text-sm font-medium transition-all duration-250",
            selected !== neuroType
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
              : "cursor-not-allowed bg-edge text-ink-muted",
          )}
        >
          确认
        </button>
      </div>
    </motion.div>
  );
}

// 用于在 Today 页声明区弹出的封装
export function useNeuroTypeSelector() {
  const [showSelector, setShowSelector] = useState(false);
  return {
    showSelector,
    openSelector: () => setShowSelector(true),
    closeSelector: () => setShowSelector(false),
  };
}
