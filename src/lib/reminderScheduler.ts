// PWA 每日锚点提醒调度器
//
// 工作原理：
// - 每 30 秒检查一次当前时间是否命中提醒时点（HH:MM 精确匹配）
// - 命中则通过 Notification API 推送一条系统通知
// - 同一时点当天只推一次（lastFiredKey 防重复）
//
// 限制说明（诚实告知用户）：
// - App 在前台或后台标签页时：所有平台都能收到
// - App 已关闭：依赖 service worker 存活（Android PWA 安装后通常 24h 内可推；iOS 16.4+ PWA 不支持后台推）
// - 真正的"App 关闭也能推"需要后端 Push 服务（VAPID + 推送服务器），是独立工程，未实现
//
// 调用方式：在 App 顶层 useReminderScheduler() 一次即可

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

const CHECK_INTERVAL_MS = 30 * 1000;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function currentHHMM(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function ensurePermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission === "denied") return Promise.resolve(false);
  return Notification.requestPermission().then((p) => p === "granted");
}

export function useReminderScheduler(): void {
  const reminderEnabled = useStore((s) => s.reminderEnabled);
  const reminderTimes = useStore((s) => s.reminderTimes);
  const lastFiredKeyRef = useRef<string>("");

  useEffect(() => {
    if (!reminderEnabled) return;
    // 浏览器不支持 Notification 时静默退出
    if (typeof Notification === "undefined") return;

    // 进入时立刻申请权限（避免错过首次命中）
    ensurePermission();

    const tick = () => {
      const now = currentHHMM();
      const dayKey = todayKey();
      const fireKey = `${dayKey}-${now}`;
      const matched = Object.values(reminderTimes).includes(now);
      if (!matched) return;
      if (lastFiredKeyRef.current === fireKey) return;
      lastFiredKeyRef.current = fireKey;
      if (Notification.permission === "granted") {
        try {
          const lang = useStore.getState().language;
          const title = lang === "en" ? "SyncSpace · 15-second check-in" : "SyncSpace · 15 秒看看自己";
          const body =
            lang === "en"
              ? "How are you right now? A quick check-in helps you catch signals before overload."
              : "现在怎样？花 15 秒看看自己，比过载后再修复轻松得多。";
          new Notification(title, {
            body,
            tag: "syncspace-anchor",
            icon: "/icon.svg",
          });
        } catch {
          // 静默失败：某些环境不允许直接 new Notification
        }
      }
    };

    tick();
    const timer = window.setInterval(tick, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [reminderEnabled, reminderTimes]);
}

// 主动申请权限的对外接口（设置页调用）
export async function requestReminderPermission(): Promise<boolean> {
  return ensurePermission();
}

// 推迟协议重弹调度器
//
// 工作原理：
// - 每 30 秒检查一次是否有待重弹的 postponedTrigger
// - 当当前时间 ≥ fireAfter 时，调用 checkPostponedTrigger 重新激活触发器
// - 应用重新挂载（如从后台恢复/重开）时也会立刻检查一次，避免错过时点
// - 每日上限 3 次仍由 store 内 checkPostponedTrigger 遵守
//
// 调用方式：在 App 顶层 usePostponedTriggerRecheck() 一次即可
export function usePostponedTriggerRecheck(): void {
  const checkPostponedTrigger = useStore((s) => s.checkPostponedTrigger);

  useEffect(() => {
    // 立刻检查一次（覆盖应用重开场景）
    checkPostponedTrigger();
    const timer = window.setInterval(checkPostponedTrigger, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [checkPostponedTrigger]);
}
