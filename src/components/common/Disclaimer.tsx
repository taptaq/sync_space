import { motion } from "framer-motion";
import { ChevronDown, Sparkles, Languages } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

// 底部声明 + 设置（低感官模式 + 语言切换）
// 更改神经特质入口已上提至 Today 页右上角，避免折叠后难以发现
export default function Disclaimer({
  showDisclaimer,
  setShowDisclaimer,
  isParentProxy,
}: {
  showDisclaimer: boolean;
  setShowDisclaimer: (v: boolean) => void;
  isParentProxy: boolean;
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
    pushToast("info", next === "en" ? tr("lang_toast_en") : tr("lang_toast_zh"));
  };

  return (
    <>
      <button
        onClick={() => setShowDisclaimer(!showDisclaimer)}
        className="flex w-full items-center justify-center gap-1 text-xs text-ink-muted/70 transition-colors hover:text-ink-muted"
      >
        {tr("disclaimer_text")}
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
                {tr("disclaimer_parent")}
                <br />
                {tr("disclaimer_parent_2")}
                <br />
                {tr("disclaimer_parent_3")}
              </>
            ) : (
              <>
                {tr("disclaimer_self")}
                <br />
                {tr("disclaimer_self_2")}
                <br />
                {tr("disclaimer_self_3")}
              </>
            )}
          </p>

          {/* 低感官模式切换 */}
          <button
            onClick={() => {
              const next = !lowSensoryMode;
              setLowSensoryMode(next);
              pushToast("info", next ? tr("low_sensory_toast_on") : tr("low_sensory_toast_off"));
            }}
            className={cn(
              "mx-auto flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all duration-250",
              lowSensoryMode
                ? "border-primary/30 bg-primary-mist/40 text-primary"
                : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
            )}
          >
            <Sparkles size={12} />
            {tr(lowSensoryMode ? "low_sensory_on" : "low_sensory_off")}
          </button>
          <p className="px-4 text-center text-[11px] leading-relaxed text-ink-faint">
            {tr("low_sensory_desc")}
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
