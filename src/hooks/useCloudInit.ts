// 云端数据初始化 + 自动同步 Hook
// 在 App 根组件调用一次，负责：
// 1. 匿名登录 Supabase
// 2. 从云端加载用户数据（如有）
// 3. 设置 debounced 自动同步（store 变更 → 1.5s 后同步到 Supabase）
// 未配置 Supabase 时自动降级为纯 localStorage 模式

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { ensureAnonymousSession, isSupabaseConfigured } from "@/lib/supabase";
import { loadAllData, syncAllData, type SyncPayload } from "@/lib/db";

type CloudStatus = "loading" | "ready" | "offline";

// 模块级标志：防止初始加载期间触发同步
let cloudSyncEnabled = false;

// 从 store state 提取需要同步的字段
function extractPayload(state: ReturnType<typeof useStore.getState>): SyncPayload {
  return {
    onboarded: state.onboarded,
    neuroType: state.neuroType,
    adhdSubtype: state.adhdSubtype,
    appMode: state.appMode,
    collaborator: state.collaborator,
    qwenEnabled: state.qwenEnabled,
    lowSensoryMode: state.lowSensoryMode,
    language: state.language,
    sessionMode: state.sessionMode,
    lastDifficultyType: state.lastDifficultyType,
    supportRules: state.supportRules,
    soundScapeType: state.soundScapeType,
    soundScapeVolume: state.soundScapeVolume,
    soundScapeEnabled: state.soundScapeEnabled,
    observation: state.observation,
    connectionPreferences: state.connectionPreferences,
    traitProfile: state.traitProfile,
    currentWeather: state.currentWeather,
    checkins: state.checkins,
    protocols: state.protocols,
    executions: state.executions,
    crashMarks: state.crashMarks,
    personalRules: state.personalRules,
    connectionMoments: state.connectionMoments,
    captureItems: state.captureItems,
  };
}

export function useCloudInit(): CloudStatus {
  const [status, setStatus] = useState<CloudStatus>(
    isSupabaseConfigured ? "loading" : "offline",
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("offline");
      return;
    }

    let unsub: (() => void) | null = null;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      // 1. 匿名登录
      const userId = await ensureAnonymousSession();
      if (!userId) {
        console.warn("[SyncSpace] 匿名登录失败，降级为离线模式");
        setStatus("offline");
        return;
      }

      // 2. 从云端加载
      const cloudData = await loadAllData();
      if (cloudData) {
        // 云端有数据 → 覆盖本地（云端为 source of truth）
        useStore.setState(cloudData);
      } else if (useStore.getState().onboarded || useStore.getState().checkins.length > 0) {
        // 云端无数据但本地有 → 把本地数据推到云端
        syncAllData(extractPayload(useStore.getState()));
      }

      // 3. 启用自动同步
      cloudSyncEnabled = true;

      // 4. 设置 debounced 同步订阅
      unsub = useStore.subscribe((state) => {
        if (!cloudSyncEnabled) return;
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(() => {
          syncAllData(extractPayload(state)).catch((err) =>
            console.warn("[SyncSpace] 自动同步失败:", err),
          );
        }, 1500);
      });

      setStatus("ready");
    })();

    return () => {
      cloudSyncEnabled = false;
      if (syncTimer) clearTimeout(syncTimer);
      if (unsub) unsub();
    };
  }, []);

  return status;
}
