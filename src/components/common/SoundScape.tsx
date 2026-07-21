import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Music, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { soundScape, SOUND_OPTIONS, type SoundType } from "@/lib/soundEngine";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { StringKey } from "@/lib/translations";

// 全局音景控制器
// 设计原则：
// - 永不自动播放（用户交互后才创建 AudioContext）
// - lowSensoryMode 开启时自动停止
// - 渐入渐出 0.5s（不突然开始/停止）
// - 记忆偏好（音景类型 + 音量持久化）
// - 底栏悬浮入口，不占主内容空间

const SOUND_LABEL_KEYS: Record<SoundType, StringKey> = {
  brown_noise: "soundscape_opt_brown_noise_label",
  pink_noise: "soundscape_opt_pink_noise_label",
  white_noise: "soundscape_opt_white_noise_label",
  rain: "soundscape_opt_rain_label",
  ocean: "soundscape_opt_ocean_label",
  fire: "soundscape_opt_fire_label",
  lofi: "soundscape_opt_lofi_label",
  silence: "soundscape_opt_silence_label",
};

const SOUND_DESC_KEYS: Record<SoundType, StringKey> = {
  brown_noise: "soundscape_opt_brown_noise_desc",
  pink_noise: "soundscape_opt_pink_noise_desc",
  white_noise: "soundscape_opt_white_noise_desc",
  rain: "soundscape_opt_rain_desc",
  ocean: "soundscape_opt_ocean_desc",
  fire: "soundscape_opt_fire_desc",
  lofi: "soundscape_opt_lofi_desc",
  silence: "soundscape_opt_silence_desc",
};

export default function SoundScape() {
  const { tr } = useT();
  const [showPanel, setShowPanel] = useState(false);
  const soundScapeType = useStore((s) => s.soundScapeType);
  const soundScapeVolume = useStore((s) => s.soundScapeVolume);
  const soundScapeEnabled = useStore((s) => s.soundScapeEnabled);
  const lowSensoryMode = useStore((s) => s.lowSensoryMode);
  const setSoundScape = useStore((s) => s.setSoundScape);
  const setSoundScapeVolume = useStore((s) => s.setSoundScapeVolume);
  const stopSoundScape = useStore((s) => s.stopSoundScape);
  const pushToast = useStore((s) => s.pushToast);

  const prevLowSensory = useRef(lowSensoryMode);

  // lowSensoryMode 开启时自动停止音景
  useEffect(() => {
    if (lowSensoryMode && !prevLowSensory.current && soundScapeEnabled) {
      soundScape.stop();
      stopSoundScape();
      pushToast("info", tr("soundscape_paused_low_sensory"));
    }
    prevLowSensory.current = lowSensoryMode;
  }, [lowSensoryMode, soundScapeEnabled, stopSoundScape, pushToast, tr]);

  // 页面卸载时停止
  useEffect(() => {
    return () => {
      soundScape.stop();
    };
  }, []);

  // 音量调节实时生效
  const handleVolumeChange = (vol: number) => {
    setSoundScapeVolume(vol);
    soundScape.setVolume(vol);
  };

  // 切换音景
  const handleSelect = (type: SoundType) => {
    if (type === "silence") {
      soundScape.stop();
      stopSoundScape();
      pushToast("info", tr("soundscape_switched_silence"));
      return;
    }

    // 如果点击的是当前正在播放的，则停止
    if (soundScapeType === type && soundScapeEnabled) {
      soundScape.stop();
      stopSoundScape();
      return;
    }

    // 播放新音景
    soundScape.play(type, soundScapeVolume);
    setSoundScape(type);
    const opt = SOUND_OPTIONS.find((o) => o.type === type);
    pushToast("info", tr("soundscape_now_playing", { name: opt ? tr(SOUND_LABEL_KEYS[opt.type]) : type }));
  };

  const currentOption = SOUND_OPTIONS.find((o) => o.type === soundScapeType);
  // 入口默认常驻左下角：未播放时显示柔和的"待启动"状态，播放时显示高亮+脉冲
  const isPlaying = soundScapeEnabled && soundScapeType !== "silence";

  return (
    <>
      {/* 底栏悬浮入口 · 常驻（未播放也可见，点击进入面板选择） */}
      <button
        onClick={() => setShowPanel(true)}
        className={cn(
          "fixed bottom-24 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-soft transition-all duration-250 active:scale-95",
          isPlaying
            ? "bg-primary text-white"
            : "bg-white/70 text-primary hover:bg-white/90",
        )}
        aria-label={tr("soundscape_aria_control")}
      >
        {isPlaying ? (
          <Volume2 size={16} className="animate-pulse-slow" />
        ) : (
          <Music size={15} />
        )}
      </button>

      {/* 音景选择面板 */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] flex items-end justify-center bg-ink/30 backdrop-blur-sm"
            onClick={() => setShowPanel(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-t-2xl border-t border-white/30 bg-base/95 p-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-ink">{tr("soundscape_title")}</h3>
                  <p className="text-xs text-ink-muted">{tr("soundscape_subtitle")}</p>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50 text-ink-muted"
                >
                  <X size={16} />
                </button>
              </div>

              {/* 当前播放状态 · 未播放时显示提示，引导用户点选 */}
              {isPlaying && currentOption ? (
                <div className="mb-4 rounded-card bg-primary-mist/30 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentOption.icon}</span>
                    <span className="text-sm font-medium text-primary">
                      {tr("phase_action_playing")}{tr(SOUND_LABEL_KEYS[currentOption.type])}
                    </span>
                    {/* 声波动画 */}
                    <div className="ml-auto flex items-end gap-0.5">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.span
                          key={i}
                          className="w-0.5 rounded-full bg-primary/60"
                          animate={{ height: [4, 12, 6, 10, 4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut",
                          }}
                          style={{ height: 4 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-card bg-white/40 px-4 py-3">
                  <p className="text-xs text-ink-muted">{tr("soundscape_not_playing")}</p>
                </div>
              )}

              {/* 音景选择网格 */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                {SOUND_OPTIONS.map((opt) => {
                  const isActive = soundScapeType === opt.type && soundScapeEnabled;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => handleSelect(opt.type)}
                      className={cn(
                        "rounded-card border p-3 text-left transition-all duration-250",
                        isActive
                          ? "border-primary/40 bg-primary-mist/30"
                          : "border-edge/60 bg-white/40 hover:bg-white/60",
                      )}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-base">{opt.icon}</span>
                        <span className={cn(
                          "text-sm font-medium",
                          isActive ? "text-primary" : "text-ink",
                        )}>
                          {tr(SOUND_LABEL_KEYS[opt.type])}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-ink-muted">{tr(SOUND_DESC_KEYS[opt.type])}</p>
                    </button>
                  );
                })}
              </div>

              {/* 音量滑块 · 仅在播放时显示 */}
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-2 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-2">
                    <VolumeX size={14} className="shrink-0 text-ink-faint" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={soundScapeVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <Volume2 size={14} className="shrink-0 text-ink-faint" />
                  </div>
                  <p className="mt-1 text-center text-[10px] text-ink-faint">
                    {tr("soundscape_volume_pct", { pct: Math.round(soundScapeVolume * 100) })}
                  </p>
                </motion.div>
              )}

              {/* 停止按钮 · 仅在播放时显示 */}
              {isPlaying && (
                <button
                  onClick={() => {
                    soundScape.stop();
                    stopSoundScape();
                  }}
                  className="w-full rounded-full border border-edge/60 bg-white/40 py-2.5 text-sm text-ink-muted transition-all duration-250 hover:bg-white/60"
                >
                  {tr("soundscape_stop")}
                </button>
              )}

              {/* 说明 */}
              <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
                {tr("soundscape_footnote_1")}<br />
                {tr("soundscape_footnote_2")}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
