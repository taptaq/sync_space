import type { WearableContextSignal, WearableProvider } from "@/types";

export interface WearableCapabilities {
  readHeartRateChange: boolean;
  readMovementChange: boolean;
  receiveManualMarker: boolean;
  sendHapticNudge: boolean;
}

/**
 * 原生 App、HarmonyOS 穿戴应用或其他设备宿主可实现并注册此接口。
 * Web/PWA 默认使用 software-only adapter，不会偷偷扫描、配对或读取设备。
 */
export interface WearableAdapter {
  provider: WearableProvider | "software_only";
  capabilities: WearableCapabilities;
  isAvailable(): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  readLatestSignal(): Promise<WearableContextSignal | null>;
  sendHapticNudge(pattern: "gentle" | "double" | "long"): Promise<void>;
}

const softwareOnlyAdapter: WearableAdapter = {
  provider: "software_only",
  capabilities: {
    readHeartRateChange: false,
    readMovementChange: false,
    receiveManualMarker: false,
    sendHapticNudge: false,
  },
  async isAvailable() { return false; },
  async connect() { throw new Error("wearable_adapter_unavailable"); },
  async disconnect() {},
  async readLatestSignal() { return null; },
  async sendHapticNudge() {},
};

let registeredAdapter: WearableAdapter = softwareOnlyAdapter;

export function registerWearableAdapter(adapter: WearableAdapter): () => void {
  registeredAdapter = adapter;
  return () => {
    if (registeredAdapter === adapter) registeredAdapter = softwareOnlyAdapter;
  };
}

export function getWearableAdapter(): WearableAdapter {
  return registeredAdapter;
}
