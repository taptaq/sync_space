import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings as SettingsIcon,
  User,
  Users,
  Globe,
  RotateCcw,
  Sparkles,
  Moon,
  ChevronLeft,
} from "lucide-react";
import NeuroTypeSelector, { useNeuroTypeSelector } from "@/components/common/NeuroTypeSelector";
import Disclaimer from "@/components/common/Disclaimer";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 设置页 · 收纳从 Today 页迁出的偏好设置
// 角色 / 语言 / 神经特质 / AI 增强 / 低感官模式
export default function Settings() {
  const navigate = useNavigate();
  const { tr } = useT();

  const appMode = useStore((s) => s.appMode);
  const setAppMode = useStore((s) => s.setAppMode);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const neuroType = useStore((s) => s.neuroType);
  const qwenEnabled = useStore((s) => s.qwenEnabled);
  const setQwenEnabled = useStore((s) => s.setQwenEnabled);
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  const setLowSensoryMode = useStore((s) => s.setLowSensoryMode);
  const pushToast = useStore((s) => s.pushToast);

  const { showSelector, openSelector, closeSelector } = useNeuroTypeSelector();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const isParentProxy = appMode === "parent_proxy";
  const neuroTypeLabel =
    neuroType === "asd" ? tr("neuro_asd")
      : neuroType === "adhd" ? tr("neuro_adhd")
        : tr("neuro_other");

  const handleRoleSwitch = (mode: "self" | "parent_proxy") => {
    if (mode === appMode) return;
    setAppMode(mode);
    pushToast(
      "success",
      mode === "parent_proxy" ? tr("today_role_switched_parent") : tr("today_role_switched_self"),
    );
  };

  const handleLanguageSwitch = (lang: "zh" | "en") => {
    if (lang === language) return;
    setLanguage(lang);
    pushToast("success", lang === "en" ? tr("lang_toast_en") : tr("lang_toast_zh"));
  };

  const handleAIToggle = () => {
    const next = !qwenEnabled;
    setQwenEnabled(next);
    pushToast("success", next ? tr("today_ai_switched_on") : tr("today_ai_switched_off"));
  };

  const handleLowSensoryToggle = () => {
    const next = !lowSensoryMode;
    setLowSensoryMode(next);
    pushToast("success", next ? tr("low_sensory_toast_on") : tr("low_sensory_toast_off"));
  };

  return (
    <div className="space-y-6 pt-5">
      {/* 顶部：返回 + 标题 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/today")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-edge bg-white/50 text-ink-muted transition-all duration-250 hover:bg-white/70"
          aria-label="返回"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="flex items-center gap-2 font-serif text-xl text-ink">
          <SettingsIcon size={18} className="text-primary" />
          设置
        </h1>
      </div>

      {/* 角色切换 */}
      <section className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
            <User size={15} className="text-primary" />
          </div>
          <h2 className="text-sm font-medium text-ink">角色切换</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRoleSwitch("self")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm transition-all duration-250",
              appMode === "self"
                ? "border-primary/40 bg-primary-mist/40 text-primary"
                : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
            )}
          >
            <User size={15} />
            {tr("today_role_self")}
          </button>
          <button
            onClick={() => handleRoleSwitch("parent_proxy")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm transition-all duration-250",
              appMode === "parent_proxy"
                ? "border-primary/40 bg-primary-mist/40 text-primary"
                : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
            )}
          >
            <Users size={15} />
            {tr("today_role_parent")}
          </button>
        </div>
      </section>

      {/* 语言切换 */}
      <section className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
            <Globe size={15} className="text-primary" />
          </div>
          <h2 className="text-sm font-medium text-ink">语言切换</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleLanguageSwitch("zh")}
            className={cn(
              "flex items-center justify-center rounded-2xl border py-3 text-sm transition-all duration-250",
              language === "zh"
                ? "border-primary/40 bg-primary-mist/40 text-primary"
                : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
            )}
          >
            中文
          </button>
          <button
            onClick={() => handleLanguageSwitch("en")}
            className={cn(
              "flex items-center justify-center rounded-2xl border py-3 text-sm transition-all duration-250",
              language === "en"
                ? "border-primary/40 bg-primary-mist/40 text-primary"
                : "border-edge bg-white/40 text-ink-muted hover:bg-white/60",
            )}
          >
            English
          </button>
        </div>
      </section>

      {/* 神经特质 */}
      <section className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
            <RotateCcw size={15} className="text-primary" />
          </div>
          <h2 className="text-sm font-medium text-ink">神经特质</h2>
        </div>
        <button
          onClick={openSelector}
          className="flex w-full items-center justify-between rounded-2xl border border-edge bg-white/40 px-4 py-3 text-left transition-all duration-250 hover:bg-white/60"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{neuroTypeLabel}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{tr("neuro_selector_desc")}</p>
          </div>
          <span className="ml-3 shrink-0 rounded-full bg-primary-mist/40 px-3 py-1 text-xs font-medium text-primary">
            {tr("today_change_neurotype")}
          </span>
        </button>
      </section>

      {/* AI 增强 */}
      <section className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
              <Sparkles size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-ink">AI 增强</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                {qwenEnabled ? tr("today_ai_on") : tr("today_ai_off")}
              </p>
            </div>
          </div>
          <Toggle enabled={qwenEnabled} onClick={handleAIToggle} />
        </div>
      </section>

      {/* 低感官模式 */}
      <section className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
              <Moon size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-ink">低感官模式</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                {lowSensoryMode ? tr("low_sensory_on") : tr("low_sensory_off")}
              </p>
            </div>
          </div>
          <Toggle enabled={lowSensoryMode} onClick={handleLowSensoryToggle} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">{tr("low_sensory_desc")}</p>
      </section>

      {/* 底部声明 */}
      <div className="pt-2">
        <Disclaimer
          showDisclaimer={showDisclaimer}
          setShowDisclaimer={setShowDisclaimer}
          isParentProxy={isParentProxy}
        />
      </div>

      {/* 神经特质选择器弹窗 */}
      <AnimatePresence>
        {showSelector && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center"
              onClick={closeSelector}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-2xl border-t border-white/30 bg-base/95 p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:mb-0 sm:rounded-2xl"
              >
                <NeuroTypeSelector onClose={closeSelector} />
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </div>
  );
}

// 圆润柔和的开关按钮（治愈风格）
function Toggle({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={enabled}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-all duration-250",
        enabled ? "bg-primary" : "bg-edge",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft transition-all duration-250",
          enabled ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}
