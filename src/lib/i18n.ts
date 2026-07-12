// 全局文案 helper（家长代理模式 vs 自主模式 + 中英文切换）
// 家长模式下：你 → 孩子 / 我的 → 孩子的 / 自己 → 孩子
// 使用：const { t, isParent } = useVoice(); const { lang, tr } = useT();
import { useStore } from "@/store/useStore";
import { STRINGS, type StringKey } from "@/lib/translations";

export interface VoiceText {
  you: string;       // "你" | "孩子"
  your: string;      // "你的" | "孩子的"
  myself: string;    // "自己" | "孩子"
  my: string;        // "我的" | "孩子的"
  observe: string;   // "签到" | "观察签到"
  record: string;    // "记录" | "观察记录"
  hasRecorded: string; // "已记录" | "已观察"
}

const SELF: VoiceText = {
  you: "你",
  your: "你的",
  myself: "自己",
  my: "我的",
  observe: "签到",
  record: "记录",
  hasRecorded: "已记录",
};

const PARENT: VoiceText = {
  you: "孩子",
  your: "孩子的",
  myself: "孩子",
  my: "孩子的",
  observe: "观察签到",
  record: "观察记录",
  hasRecorded: "已观察",
};

export function useVoice(): { t: VoiceText; isParent: boolean } {
  const appMode = useStore((s) => s.appMode);
  const isParent = appMode === "parent_proxy";
  return { t: isParent ? PARENT : SELF, isParent };
}

export function getVoice(appMode: string): { t: VoiceText; isParent: boolean } {
  const isParent = appMode === "parent_proxy";
  return { t: isParent ? PARENT : SELF, isParent };
}

// ===== 中英文切换 =====
// useT() 返回 { lang, tr } · tr(key) 读取当前语言翻译
export function useT() {
  const lang = useStore((s) => s.language) ?? "zh";
  const tr = (key: StringKey): string => STRINGS[key]?.[lang] ?? STRINGS[key]?.zh ?? key;
  return { lang, tr };
}
