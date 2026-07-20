import { useEffect, useState } from "react";
import { Bluetooth, Check, Smartphone, Watch } from "lucide-react";
import type { WearableMode, WearableProvider } from "@/types";
import { useStore } from "@/store/useStore";
import { useT } from "@/lib/i18n";
import { getWearableAdapter } from "@/lib/wearableBridge";
import { cn } from "@/lib/utils";

export default function WearableSettingsCard() {
  const { tr } = useT();
  const mode = useStore((state) => state.wearableMode);
  const provider = useStore((state) => state.wearableProvider);
  const status = useStore((state) => state.wearableConnectionStatus);
  const setMode = useStore((state) => state.setWearableMode);
  const setProvider = useStore((state) => state.setWearableProvider);
  const setStatus = useStore((state) => state.setWearableConnectionStatus);
  const pushToast = useStore((state) => state.pushToast);
  const [adapterAvailable, setAdapterAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const adapter = getWearableAdapter();
    adapter.isAvailable().then((available) => {
      if (cancelled) return;
      const matchesProvider = adapter.provider === provider;
      setAdapterAvailable(available && matchesProvider);
      if ((!available || !matchesProvider) && status === "connected") {
        setStatus("not_connected");
      }
    });
    return () => { cancelled = true; };
  }, [provider, setStatus, status]);

  const changeMode = (nextMode: WearableMode) => {
    setMode(nextMode);
    if (nextMode === "software_only" && status === "connected") {
      getWearableAdapter().disconnect().finally(() => setStatus("not_connected"));
    }
  };

  const connect = async () => {
    const adapter = getWearableAdapter();
    setStatus("connecting");
    try {
      await adapter.connect();
      setStatus("connected");
    } catch {
      setStatus("error");
      pushToast("info", tr("wearable_connect_failed"));
    }
  };

  const disconnect = async () => {
    await getWearableAdapter().disconnect();
    setStatus("not_connected");
  };

  return (
    <section className="rounded-card border border-edge bg-white/60 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-mist/50">
          <Watch size={15} className="text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-ink">{tr("wearable_title")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{tr("wearable_desc")}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <ModeChoice
          active={mode === "software_only"}
          icon={Smartphone}
          title={tr("wearable_software_only")}
          description={tr("wearable_software_only_desc")}
          onClick={() => changeMode("software_only")}
        />
        <ModeChoice
          active={mode === "software_with_wearable"}
          icon={Watch}
          title={tr("wearable_with_device")}
          description={tr("wearable_with_device_desc")}
          onClick={() => changeMode("software_with_wearable")}
        />
      </div>

      {mode === "software_with_wearable" && (
        <div className="mt-4 rounded-xl border border-primary/15 bg-primary-mist/15 p-4">
          <label className="block">
            <span className="mb-1.5 block text-xs text-ink-muted">{tr("wearable_provider_label")}</span>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value as WearableProvider);
                setStatus("not_connected");
              }}
              className="min-h-11 w-full rounded-lg border border-edge bg-white/75 px-3 text-sm text-ink"
            >
              <option value="huawei_health">{tr("wearable_provider_huawei")}</option>
              <option value="other">{tr("wearable_provider_other")}</option>
            </select>
          </label>

          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={cn(
              "h-2 w-2 rounded-full",
              status === "connected" ? "bg-sage" : status === "connecting" ? "bg-clay" : "bg-edge",
            )} />
            <span className="text-ink-muted">
              {status === "connected"
                ? tr("wearable_status_connected")
                : status === "connecting"
                  ? tr("wearable_status_connecting")
                  : tr("wearable_status_not_connected")}
            </span>
          </div>

          {adapterAvailable ? (
            <button
              type="button"
              onClick={status === "connected" ? disconnect : connect}
              disabled={status === "connecting"}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm text-white disabled:opacity-50"
            >
              <Bluetooth size={16} />
              {status === "connected" ? tr("wearable_disconnect") : tr("wearable_connect")}
            </button>
          ) : (
            <p className="mt-3 rounded-lg bg-white/65 px-3 py-2.5 text-xs leading-5 text-ink-muted">
              {tr("wearable_status_unavailable")}
            </p>
          )}

          <details className="mt-3 border-t border-edge/70 pt-2">
            <summary className="min-h-11 cursor-pointer py-2.5 text-xs font-medium text-primary">
              {tr("wearable_boundary_title")}
            </summary>
            <ul className="space-y-2 pb-2 text-xs leading-5 text-ink-muted">
              <li>{tr("wearable_boundary_1")}</li>
              <li>{tr("wearable_boundary_2")}</li>
              <li>{tr("wearable_boundary_3")}</li>
            </ul>
            <p className="border-t border-edge/60 pt-2 text-[11px] leading-5 text-ink-faint">
              {tr("wearable_privacy")}
            </p>
          </details>
        </div>
      )}
    </section>
  );
}

function ModeChoice({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Smartphone;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left",
        active ? "border-primary/35 bg-primary-mist/25" : "border-edge bg-white/45",
      )}
    >
      <Icon size={17} className={active ? "text-primary" : "text-ink-muted"} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-ink-muted">{description}</span>
      </span>
      {active && <Check size={16} className="shrink-0 text-primary" />}
    </button>
  );
}
