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
  BellRing,
  Mic,
  MicVocal,
  Wand2,
  BookOpenText,
  ChevronLeft,
} from "lucide-react";
import NeuroTypeSelector, { useNeuroTypeSelector } from "@/components/common/NeuroTypeSelector";
import Disclaimer from "@/components/common/Disclaimer";
import SpotlightGuide from "@/components/common/SpotlightGuide";
import { ModalPortal } from "@/components/common/ModalPortal";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { requestReminderPermission } from "@/lib/reminderScheduler";
import WearableSettingsCard from "@/components/settings/WearableSettingsCard";

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
  const readingAidEnabled = useStore((s) => s.readingAidEnabled);
  const setReadingAidEnabled = useStore((s) => s.setReadingAidEnabled);
  const reminderEnabled = useStore((s) => s.reminderEnabled);
  const setReminderEnabled = useStore((s) => s.setReminderEnabled);
  const reminderTimes = useStore((s) => s.reminderTimes);
  const setReminderTimes = useStore((s) => s.setReminderTimes);
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

  const handleReadingAidToggle = () => {
    setReadingAidEnabled(!readingAidEnabled);
  };

  const handleReminderToggle = async () => {
    const next = !reminderEnabled;
    if (next) {
      const granted = await requestReminderPermission();
      if (!granted) {
        pushToast("error", tr("reminder_permission_denied"));
        return;
      }
    }
    setReminderEnabled(next);
    pushToast("success", next ? tr("reminder_toast_on") : tr("reminder_toast_off"));
  };

  const handleReminderTimeChange = (slot: "morning" | "noon" | "evening", value: string) => {
    setReminderTimes({ ...reminderTimes, [slot]: value });
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
      <section data-tour-id="settings-role" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
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
      <section data-tour-id="settings-language" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
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
      <section data-tour-id="settings-neurotype" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
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
      <section data-tour-id="settings-ai" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
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

        {/* AI 生效位置说明 · 简短清单 */}
        <div className="mt-4 space-y-2 border-t border-edge/70 pt-4">
          <p className="text-[11px] text-ink-faint">{tr("ai_scope_title")}</p>
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2 text-xs text-ink-muted">
              <Mic size={13} className="mt-0.5 shrink-0 text-primary" />
              <span><span className="text-ink">{tr("ai_scope_voice_checkin_label")}</span> · {tr("ai_scope_voice_checkin_desc")}</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-ink-muted">
              <MicVocal size={13} className="mt-0.5 shrink-0 text-primary" />
              <span><span className="text-ink">{tr("ai_scope_voice_crash_label")}</span> · {tr("ai_scope_voice_crash_desc")}</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-ink-muted">
              <Wand2 size={13} className="mt-0.5 shrink-0 text-primary" />
              <span><span className="text-ink">{tr("ai_scope_action_suggest_label")}</span> · {tr("ai_scope_action_suggest_desc")}</span>
            </li>
            <li className="flex items-start gap-2 text-xs text-ink-muted">
              <Sparkles size={13} className="mt-0.5 shrink-0 text-primary" />
              <span><span className="text-ink">{tr("ai_scope_slogan_label")}</span> · {tr("ai_scope_slogan_desc")}</span>
            </li>
          </ul>
          {!qwenEnabled && (
            <p className="pt-1 text-[11px] leading-relaxed text-ink-faint">{tr("ai_scope_off_hint")}</p>
          )}
        </div>
      </section>

      {/* 低感官模式 */}
      <section data-tour-id="settings-low-sensory" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
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

      {/* 阅读减负：可选，不默认套用实验性的半词加粗 */}
      <section data-tour-id="settings-reading-aid" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
              <BookOpenText size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-ink">{tr("reading_aid_title")}</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                {readingAidEnabled ? tr("reading_aid_on") : tr("reading_aid_off")}
              </p>
            </div>
          </div>
          <Toggle enabled={readingAidEnabled} onClick={handleReadingAidToggle} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">{tr("reading_aid_desc")}</p>
      </section>

      <WearableSettingsCard />

      {/* 每日锚点提醒（PWA · ASD 友好：解决"后知后觉"） */}
      <section data-tour-id="settings-reminder" className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-mist/50">
              <BellRing size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-ink">{tr("reminder_title")}</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                {reminderEnabled ? tr("reminder_on") : tr("reminder_off")}
              </p>
            </div>
          </div>
          <Toggle enabled={reminderEnabled} onClick={handleReminderToggle} />
        </div>

        {reminderEnabled && (
          <div className="mt-4 space-y-3 border-t border-edge/70 pt-4">
            <p className="text-xs text-ink-muted">{tr("reminder_times_desc")}</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "morning" as const, label: tr("reminder_morning") },
                { key: "noon" as const, label: tr("reminder_noon") },
                { key: "evening" as const, label: tr("reminder_evening") },
              ]).map((slot) => (
                <label key={slot.key} className="block">
                  <span className="mb-1 block text-[11px] text-ink-muted">{slot.label}</span>
                  <input
                    type="time"
                    value={reminderTimes[slot.key]}
                    onChange={(e) => handleReminderTimeChange(slot.key, e.target.value)}
                    className="w-full rounded-lg border border-edge bg-white/70 px-2 py-1.5 text-xs text-ink focus:border-primary/40"
                  />
                </label>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-ink-faint">{tr("reminder_limit_note")}</p>
          </div>
        )}
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

      <SpotlightGuide
        pageKey="settings"
        steps={[
          {
            targetId: "settings-role",
            titleKey: "guide_settings_role_title",
            bodyKey: "guide_settings_role_body",
          },
          {
            targetId: "settings-language",
            titleKey: "guide_settings_language_title",
            bodyKey: "guide_settings_language_body",
          },
          {
            targetId: "settings-neurotype",
            titleKey: "guide_settings_neurotype_title",
            bodyKey: "guide_settings_neurotype_body",
          },
          {
            targetId: "settings-ai",
            titleKey: "guide_settings_ai_title",
            bodyKey: "guide_settings_ai_body",
          },
          {
            targetId: "settings-low-sensory",
            titleKey: "guide_settings_low_sensory_title",
            bodyKey: "guide_settings_low_sensory_body",
          },
          {
            targetId: "settings-reading-aid",
            titleKey: "guide_settings_reading_aid_title",
            bodyKey: "guide_settings_reading_aid_body",
          },
          {
            targetId: "settings-wearable",
            titleKey: "guide_settings_wearable_title",
            bodyKey: "guide_settings_wearable_body",
          },
          {
            targetId: "settings-reminder",
            titleKey: "guide_settings_reminder_title",
            bodyKey: "guide_settings_reminder_body",
          },
        ]}
      />
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
