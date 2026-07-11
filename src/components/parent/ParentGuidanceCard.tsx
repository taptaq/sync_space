import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartHandshake,
  MessageCircleHeart,
  Ban,
  Home,
  ChevronDown,
} from "lucide-react";
import type { ParentGuidancePack } from "@/types";
import { useStore } from "@/store/useStore";
import { detectPhase, getPhaseConfig } from "@/lib/stageEngine";
import { getParentGuidance } from "@/lib/parentGuidance";
import { cn } from "@/lib/utils";

// 家长引导卡片 · 根据当前阶段展示四类建议
// 措施卡片 / 话术卡片 / 不要做清单 / 环境调整建议
// 可折叠分区，默认展开当前阶段最相关的（过载/预警期默认展开"不要做"）

type TabKey = "measures" | "scripts" | "avoid" | "environment";

const TABS: { key: TabKey; label: string; icon: typeof HeartHandshake }[] = [
  { key: "measures", label: "可以这样做", icon: HeartHandshake },
  { key: "scripts", label: "可以这样说", icon: MessageCircleHeart },
  { key: "avoid", label: "不要做", icon: Ban },
  { key: "environment", label: "环境调整", icon: Home },
];

export default function ParentGuidanceCard() {
  const currentWeather = useStore((s) => s.currentWeather);
  const crashMarks = useStore((s) => s.crashMarks);

  const phase = detectPhase(currentWeather.climate, crashMarks);
  const phaseCfg = getPhaseConfig(phase);
  const pack: ParentGuidancePack = getParentGuidance(phase);

  // 预警/过载期默认看"不要做"，其他默认看"措施"
  const [activeTab, setActiveTab] = useState<TabKey>(
    phase === "warning" || phase === "overload" ? "avoid" : "measures",
  );

  const items = pack[activeTab];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-card border border-edge bg-white/60 p-5 shadow-soft"
    >
      {/* 头部：阶段标签 + 叙事 */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              phaseCfg.badgeClass,
            )}
          >
            {phaseCfg.label}
          </span>
          <span className="text-xs text-ink-muted">家长引导</span>
        </div>
        <p className="mt-2 text-small leading-relaxed text-ink">
          {phaseCfg.narrative}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {phaseCfg.measureTone}
        </p>
      </div>

      {/* 标签切换 */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = pack[key].length;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-250",
                isActive
                  ? key === "avoid"
                    ? "bg-warn-mist/60 text-warn"
                    : "bg-primary-mist/60 text-primary"
                  : "bg-white/50 text-ink-muted hover:bg-white/70",
              )}
            >
              <Icon size={12} />
              {label}
              <span className="ml-0.5 text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 内容区 · 方向一致的滑动切换 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          {items.map((item, i) => (
            <GuidanceItem
              key={i}
              text={item.text}
              variant={activeTab}
              index={i}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 底部声明 */}
      <div className="mt-4 border-t border-edge/60 pt-3">
        <p className="text-center text-[11px] leading-relaxed text-ink-faint">
          这些是温柔的支持建议，不替代专业评估。
          <br />
          如出现自伤或伤人倾向，请保护安全并联系专业人士。
        </p>
      </div>
    </motion.section>
  );
}

// 单条建议条目
function GuidanceItem({
  text,
  variant,
  index,
}: {
  text: string;
  variant: TabKey;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 42;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        variant === "avoid"
          ? "border-warn/20 bg-warn-mist/20"
          : variant === "scripts"
            ? "border-primary/20 bg-primary-mist/20"
            : "border-edge bg-white/40",
      )}
    >
      <button
        onClick={() => isLong && setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-start gap-2 text-left",
          !isLong && "cursor-default",
        )}
      >
        <span
          className={cn(
            "mt-0.5 text-xs font-mono",
            variant === "avoid" ? "text-warn/60" : "text-ink-faint",
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "flex-1 text-small leading-relaxed text-ink",
            isLong && !expanded && "line-clamp-2",
          )}
        >
          {text}
        </span>
        {isLong && (
          <ChevronDown
            size={14}
            className={cn(
              "mt-1 shrink-0 text-ink-faint transition-transform duration-250",
              expanded && "rotate-180",
            )}
          />
        )}
      </button>
    </div>
  );
}
