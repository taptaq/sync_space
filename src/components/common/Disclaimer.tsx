import { motion } from "framer-motion";
import { ChevronDown, Sparkles, RotateCcw, Languages } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// 底部声明 + 设置（低感官模式 + 更改神经特质 + 语言切换）
// 提取为独立组件，减轻 Today 页复杂度
// openSelector 由父组件传入，确保状态一致
export default function Disclaimer({
  showDisclaimer,
  setShowDisclaimer,
  isParentProxy,
  onOpenNeuroTypeSelector,
}: {
  showDisclaimer: boolean;
  setShowDisclaimer: (v: boolean) => void;
  isParentProxy: boolean;
  onOpenNeuroTypeSelector: () => void;
}) {
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  const setLowSensoryMode = useStore((s) => s.setLowSensoryMode);
  const pushToast = useStore((s) => s.pushToast);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const { tr } = useT();

  const toggleLanguage = () => {
    const next = language === "zh" ? "en" : "zh";
    setLanguage(next);
    pushToast("info", next === "en" ? "Switched to English" : "已切换到中文");
  };

  return (
    <>
      <button
        onClick={() => setShowDisclaimer(!showDisclaimer)}
        className="flex w-full items-center justify-center gap-1 text-xs text-ink-muted/70 transition-colors hover:text-ink-muted"
      >
        SyncSpace 不是医疗工具，不做任何诊断
        <ChevronDown
          size={12}
          className={cn("transition-transform duration-250", showDisclaimer && "rotate-180")}
        />
      </button>
      {showDisclaimer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-2 space-y-3"
        >
          <p className="px-4 text-center text-xs leading-relaxed text-ink-muted">
            {isParentProxy ? (
              <>
                家长引导建议是温柔的支持，不替代专业评估。
                <br />
                如孩子出现自伤或伤人倾向，请保护安全并联系专业人士。
                <br />
                孩子的所有数据仅存储在家长设备本地。
              </>
            ) : (
              <>
                如果你正在经历严重困扰，请联系专业人士。
                <br />
                SyncSpace 面向能自主签到的人（建议 13+）。
                <br />
                你的所有数据仅存储在本地，只有你自己可见。
              </>
            )}
          </p>

          {/* 低感官模式切换 */}
          <button
            onClick={() => {
              const next = !lowSensoryMode;
              setLowSensoryMode(next);
              pushToast("info", next ? "已开启低感官模式" : "已关闭低感官模式");
            }}
            className={cn(
              "mx-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all duration-250",
              lowSensoryMode
                ? "border-primary/30 bg-primary-mist/40 text-primary"
                : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
            )}
          >
            <Sparkles size={12} />
            {lowSensoryMode ? "低感官模式已开启" : "开启低感官模式"}
          </button>
          <p className="px-4 text-center text-[11px] leading-relaxed text-ink-faint">
            降低色彩饱和度、减少动效和阴影。如果你对光/动效敏感，或正在过载恢复期，这个模式可能更舒适。
          </p>

          {/* 更改神经特质入口 */}
          <button
            onClick={onOpenNeuroTypeSelector}
            className="mx-auto flex items-center gap-2 rounded-full border border-edge bg-white/40 px-4 py-2 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
          >
            <RotateCcw size={12} />
            {tr("change_neurotype")}
          </button>
          <p className="px-4 text-center text-[11px] leading-relaxed text-ink-faint">
            {tr("change_neurotype_desc")}
          </p>

          {/* 语言切换 */}
          <button
            onClick={toggleLanguage}
            className="mx-auto flex items-center gap-2 rounded-full border border-edge bg-white/40 px-4 py-2 text-xs text-ink-muted transition-all duration-250 hover:bg-white/60"
          >
            <Languages size={12} />
            {tr("change_lang")}
          </button>
        </motion.div>
      )}
    </>
  );
}
