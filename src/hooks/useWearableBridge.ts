import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { getWearableAdapter } from "@/lib/wearableBridge";

const POLL_INTERVAL_MS = 60_000;

// 只有用户选择“软件 + 手环”且已经授权连接后才读取线索。
// Adapter 返回的信号不会自动改变状态；Today 页必须由用户确认。
export function useWearableBridge() {
  const mode = useStore((state) => state.wearableMode);
  const status = useStore((state) => state.wearableConnectionStatus);
  const setPendingSignal = useStore((state) => state.setPendingWearableSignal);
  const lastCapturedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== "software_with_wearable" || status !== "connected") return;

    let cancelled = false;
    const readSignal = async () => {
      try {
        const signal = await getWearableAdapter().readLatestSignal();
        if (
          cancelled
          || !signal
          || signal.captured_at === lastCapturedAtRef.current
        ) return;
        lastCapturedAtRef.current = signal.captured_at;
        setPendingSignal({ ...signal, requires_user_confirmation: true });
      } catch {
        // 短暂断连不覆盖用户设置，也不制造错误提醒；下次轮询会重试。
      }
    };

    void readSignal();
    const timer = window.setInterval(readSignal, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [mode, setPendingSignal, status]);
}
