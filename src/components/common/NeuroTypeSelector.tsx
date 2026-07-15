import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Sparkles, CloudSun, X, ChevronRight } from "lucide-react";
import type { NeuroType, ADHDSubtype } from "@/types";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// 神经特质选择器（轻量 · 非 Onboarding · 让用户随时调整）
// 选择后立即生效：气候模型 / 疗法库 / 协议模板全部按新特质重新计算
const OPTIONS: { key: NeuroType; icon: typeof Brain; labelKey: StringKey; descKey: StringKey; switchHintKey: StringKey }[] = [
  { key: "asd", icon: Brain, labelKey: "neuro_asd", descKey: "neuro_asd_desc", switchHintKey: "neuro_selector_switch_asd" },
  { key: "adhd", icon: Sparkles, labelKey: "neuro_adhd", descKey: "neuro_adhd_desc", switchHintKey: "neuro_selector_switch_adhd" },
  { key: "other", icon: CloudSun, labelKey: "neuro_other", descKey: "neuro_other_desc", switchHintKey: "neuro_selector_switch_other" },
];

const SUBTYPE_OPTIONS: { key: ADHDSubtype; labelKey: StringKey; descKey: StringKey; toastKey: StringKey }[] = [
  { key: "inattentive", labelKey: "adhd_subtype_inattentive", descKey: "adhd_subtype_inattentive_desc", toastKey: "adhd_subtype_toast_inattentive" },
  { key: "hyperactive", labelKey: "adhd_subtype_hyperactive", descKey: "adhd_subtype_hyperactive_desc", toastKey: "adhd_subtype_toast_hyperactive" },
  { key: "combined", labelKey: "adhd_subtype_combined", descKey: "adhd_subtype_combined_desc", toastKey: "adhd_subtype_toast_combined" },
  { key: "unknown", labelKey: "adhd_subtype_unknown", descKey: "adhd_subtype_unknown_desc", toastKey: "adhd_subtype_toast_unknown" },
];

function NeuroTypeSelector({ onClose }: { onClose: () => void }) {
  const { tr } = useT();
  const navigate = useNavigate();
  const neuroType = useStore((s) => s.neuroType);
  const adhdSubtype = useStore((s) => s.adhdSubtype);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setAdhdSubtype = useStore((s) => s.setAdhdSubtype);
  const pushToast = useStore((s) => s.pushToast);
  const [selected, setSelected] = useState<NeuroType>(neuroType);
  const [subType, setSubType] = useState<ADHDSubtype>(adhdSubtype);

  const confirm = () => {
    if (selected !== neuroType) {
      setOnboarded(selected);
      const hintKey = OPTIONS.find((o) => o.key === selected)?.switchHintKey;
      pushToast("success", hintKey ? tr(hintKey) : tr("neuro_selector_switched"));
    }
    // ADHD 子类型设置（无论是否切换特质都允许更新子类型）
    if (selected === "adhd" && subType !== adhdSubtype) {
      if (subType === "unknown") {
        // 不确定 → 跳转到 DSM-5 评估页，自动启动量表
        setAdhdSubtype("unknown");
        onClose();
        navigate("/screen?scale=dsm5a18b");
        return;
      }
      setAdhdSubtype(subType);
      const toastKey = SUBTYPE_OPTIONS.find((o) => o.key === subType)?.toastKey;
      pushToast("success", toastKey ? tr(toastKey) : "");
    }
    onClose();
  };

  const canConfirm = selected !== neuroType || (selected === "adhd" && subType !== adhdSubtype);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg text-ink">{tr("neuro_selector_title")}</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-ink-muted transition-colors hover:bg-edge/40"
          aria-label={tr("close")}
        >
          <X size={16} />
        </button>
      </div>

      <p className="mb-4 text-xs text-ink-muted">
        {tr("neuro_selector_desc")}
      </p>

      <div className="space-y-2">
        {OPTIONS.map(({ key, labelKey, descKey, icon: Icon }) => (
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
              <p className="text-sm font-medium text-ink">{tr(labelKey)}</p>
              <p className="text-[11px] text-ink-muted">{tr(descKey)}</p>
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

      {/* ADHD 子类型选择 · 仅当选了 ADHD 时显示 */}
      {selected === "adhd" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          <p className="mb-1 text-xs font-medium text-primary">
            {tr("adhd_subtype_title")}
          </p>
          <p className="mb-3 text-[11px] text-ink-muted">
            {tr("adhd_subtype_desc")}
          </p>
          <div className="space-y-2">
            {SUBTYPE_OPTIONS.map(({ key, labelKey, descKey }) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "unknown") {
                    // 不确定 → 直接跳转到 DSM-5 评估页，无需点确认
                    setAdhdSubtype("unknown");
                    onClose();
                    navigate("/screen?scale=dsm5a18b");
                    return;
                  }
                  setSubType(key);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-250",
                  subType === key
                    ? "border-primary bg-primary-mist/20"
                    : "border-edge bg-white/30 hover:bg-white/50",
                )}
              >
                <div className="flex-1">
                  <p className="text-xs font-medium text-ink">{tr(labelKey)}</p>
                  <p className="text-[10px] text-ink-muted">{tr(descKey)}</p>
                </div>
                {subType === key && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
                {key === "unknown" && subType === key && (
                  <ChevronRight size={14} className="text-primary" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-full border border-edge py-2 text-sm text-ink-muted transition-colors hover:bg-edge/30"
        >
          {tr("neuro_cancel")}
        </button>
        <button
          onClick={confirm}
          disabled={!canConfirm}
          className={cn(
            "flex-1 rounded-full py-2 text-sm font-medium transition-all duration-250",
            canConfirm
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
              : "cursor-not-allowed bg-edge text-ink-muted",
          )}
        >
          {tr("neuro_confirm")}
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

export default NeuroTypeSelector;
