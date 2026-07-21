// 纯 Web Audio API 音景生成器
// 零音频文件 · 零网络请求 · 零版权风险
// 所有声音通过数学算法实时合成
//
// 移动端兼容：用 AudioBufferSourceNode 替代已废弃的 ScriptProcessorNode
// iOS Safari 要求 AudioContext 在用户交互的同步上下文里创建/resume

export type SoundType =
  | "brown_noise"
  | "pink_noise"
  | "white_noise"
  | "rain"
  | "ocean"
  | "fire"
  | "lofi"
  | "silence";

export interface SoundOption {
  type: SoundType;
  label: string;
  desc: string;
  icon: string;
  // 适合的人群
  forNeuroTypes: string[];
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    type: "brown_noise",
    label: "棕噪音",
    desc: "低频持续嗡鸣，像远处的大海",
    icon: "🌊",
    forNeuroTypes: ["asd", "adhd"],
  },
  {
    type: "pink_noise",
    label: "粉噪音",
    desc: "均匀柔和，像持续的雨声",
    icon: "🌧️",
    forNeuroTypes: ["asd", "adhd"],
  },
  {
    type: "white_noise",
    label: "白噪音",
    desc: "全频段沙沙声，强力屏蔽",
    icon: "🌫️",
    forNeuroTypes: ["asd"],
  },
  {
    type: "rain",
    label: "雨声",
    desc: "棕噪音底 + 随机水滴",
    icon: "☔",
    forNeuroTypes: ["asd", "adhd"],
  },
  {
    type: "ocean",
    label: "海浪",
    desc: "棕噪音 + 慢速潮汐调制",
    icon: "🏖️",
    forNeuroTypes: ["asd"],
  },
  {
    type: "fire",
    label: "篝火",
    desc: "棕噪音 + 随机爆裂噼啪",
    icon: "🔥",
    forNeuroTypes: ["adhd"],
  },
  {
    type: "lofi",
    label: "Lo-fi 节拍",
    desc: "低频鼓点 + 柔和和弦",
    icon: "🎵",
    forNeuroTypes: ["adhd"],
  },
  {
    type: "silence",
    label: "纯静音",
    desc: "不想听任何声音时",
    icon: "🤍",
    forNeuroTypes: ["asd", "adhd"],
  },
];

// 协议推荐音景映射
export const PROTOCOL_SOUND_MAP: Record<string, SoundType> = {
  sensory_grounding: "brown_noise",
  sensory_withdrawal: "pink_noise",
  deep_pressure: "brown_noise",
  executive_5min_start: "lofi",
  executive_dopamine_brake: "ocean",
  executive_body_reset: "silence",
  executive_externalize_brain: "lofi",
  social_decompression: "rain",
  predictability_anchoring: "ocean",
};

export function getRecommendedSound(protocolName: string): SoundType | null {
  return PROTOCOL_SOUND_MAP[protocolName] ?? null;
}

// 阶段 → 推荐音景（按神经类型差异化）
// ASD 路线侧重感官预算：稳定/累积期柔和屏蔽，警告/过载期深度低频
// ADHD 路线侧重多巴胺电量：稳定期保持节奏，过载期彻底降负荷
export const PHASE_SOUND_RECOMMENDATION: Record<
  "stable" | "accumulating" | "warning" | "overload" | "recovery",
  Partial<Record<"asd" | "adhd", { sound: SoundType; reason: string }>>
> = {
  stable: {
    asd: { sound: "ocean", reason: "潮汐节奏帮你维持感官稳态" },
    adhd: { sound: "lofi", reason: "轻节拍保持多巴胺基础线" },
  },
  accumulating: {
    asd: { sound: "pink_noise", reason: "柔和屏蔽正在累积的感官输入" },
    adhd: { sound: "brown_noise", reason: "低频嗡鸣降低任务负荷" },
  },
  warning: {
    asd: { sound: "brown_noise", reason: "深度低频屏蔽，减缓感官预算消耗" },
    adhd: { sound: "rain", reason: "雨声节奏提供执行功能外部锚点" },
  },
  overload: {
    asd: { sound: "brown_noise", reason: "最低频屏蔽，隔离一切输入" },
    adhd: { sound: "silence", reason: "多巴胺见底，此刻零输入是最大的支持" },
  },
  recovery: {
    asd: { sound: "ocean", reason: "慢潮汐帮你慢慢恢复感官基线" },
    adhd: { sound: "rain", reason: "柔和节奏陪你慢慢回到节奏" },
  },
};

export function getPhaseSound(
  phase: "stable" | "accumulating" | "warning" | "overload" | "recovery",
  neuroType: string,
): { sound: SoundType; reason: string } | null {
  // 非 ADHD 用户（asd / hsp / ptsd / other）：默认走 ASD 推荐路线（感官屏蔽更普适）
  const type = neuroType === "adhd" ? "adhd" : "asd";
  return PHASE_SOUND_RECOMMENDATION[phase]?.[type] ?? null;
}

// 可停止的源节点（AudioBufferSourceNode / OscillatorNode 都有 stop）
interface StoppableSource extends AudioNode {
  stop: (when?: number) => void;
}

interface ActiveSound {
  source: StoppableSource;
  gain: GainNode;
  cleanup: () => void;
}

// 音景引擎 · 单例
class SoundScapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private active: ActiveSound | null = null;
  private currentType: SoundType | null = null;
  private fadeTimer: number | null = null;
  // 缓存预生成的噪音 buffer（同类型复用，避免重复计算）
  private bufferCache: Map<string, AudioBuffer> = new Map();

  // 懒初始化 AudioContext（浏览器要求用户交互后才能创建）
  // 必须在用户点击的同步调用栈里调用，iOS 才允许 resume
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    }
    // 移动端：AudioContext 可能处于 suspended 状态，需要 resume
    // resume() 是异步的，但不 await 也能工作 —— AudioContext 会自己恢复
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {
        // 忽略：某些浏览器在非用户交互调用时会拒绝
      });
    }
    return this.ctx;
  }

  isPlaying(): boolean {
    return this.active !== null && this.currentType !== null;
  }

  getCurrentType(): SoundType | null {
    return this.currentType;
  }

  // 预生成噪音 buffer（2 秒循环）
  // 用 AudioBufferSourceNode 替代 ScriptProcessorNode，移动端兼容性更好
  private getNoiseBuffer(ctx: AudioContext, type: "white" | "brown" | "pink"): AudioBuffer {
    const cacheKey = `${type}:${ctx.sampleRate}`;
    const cached = this.bufferCache.get(cacheKey);
    if (cached) return cached;

    const durationSec = 2;
    const length = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === "brown") {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
    } else {
      // pink
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  // 播放指定音景（渐入 0.5s）
  play(type: SoundType, volume: number = 0.3) {
    // 先停止当前
    this.stopInternal(false);

    if (type === "silence") {
      this.currentType = "silence";
      return;
    }

    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const sound = this.createSound(type, ctx);
    if (!sound) return;

    sound.gain.connect(this.masterGain);
    this.active = sound;
    this.currentType = type;

    // 渐入
    const now = ctx.currentTime;
    sound.gain.gain.setValueAtTime(0, now);
    sound.gain.gain.linearRampToValueAtTime(volume, now + 0.5);

    // 主增益渐入
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(1, now + 0.5);
  }

  // 停止（渐出 0.5s）
  stop() {
    this.stopInternal(true);
  }

  private stopInternal(fade: boolean) {
    if (!this.ctx || !this.active || !this.masterGain) {
      this.currentType = null;
      return;
    }

    const ctx = this.ctx;
    const active = this.active;
    const now = ctx.currentTime;

    if (fade) {
      // 渐出后清理
      active.gain.gain.cancelScheduledValues(now);
      active.gain.gain.setValueAtTime(active.gain.gain.value, now);
      active.gain.gain.linearRampToValueAtTime(0, now + 0.5);

      if (this.fadeTimer) clearTimeout(this.fadeTimer);
      this.fadeTimer = window.setTimeout(() => {
        try {
          active.source.stop();
        } catch {
          // 忽略：可能已经停止
        }
        active.cleanup();
        this.active = null;
        this.currentType = null;
      }, 600);
    } else {
      try {
        active.source.stop();
      } catch {
        // 忽略
      }
      active.cleanup();
      this.active = null;
      this.currentType = null;
    }
  }

  // 设置音量（实时调节，不中断播放）
  setVolume(volume: number) {
    if (!this.ctx || !this.active || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.active.gain.gain.cancelScheduledValues(now);
    this.active.gain.gain.setValueAtTime(this.active.gain.gain.value, now);
    this.active.gain.gain.linearRampToValueAtTime(volume, now + 0.15);
  }

  // 创建指定类型的音景节点
  private createSound(type: SoundType, ctx: AudioContext): ActiveSound | null {
    switch (type) {
      case "brown_noise":
        return this.createBrownNoise(ctx);
      case "pink_noise":
        return this.createPinkNoise(ctx);
      case "white_noise":
        return this.createWhiteNoise(ctx);
      case "rain":
        return this.createRain(ctx);
      case "ocean":
        return this.createOcean(ctx);
      case "fire":
        return this.createFire(ctx);
      case "lofi":
        return this.createLofi(ctx);
      default:
        return null;
    }
  }

  // 棕噪音：低频增强的白噪音
  // 用预生成 buffer + AudioBufferSourceNode（循环播放）
  private createBrownNoise(ctx: AudioContext): ActiveSound {
    const buffer = this.getNoiseBuffer(ctx, "brown");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gain);
    source.start();

    return {
      source,
      gain,
      cleanup: () => {
        try { source.stop(); } catch { /* 已停止 */ }
        source.disconnect();
        filter.disconnect();
      },
    };
  }

  // 粉噪音：中频增强
  private createPinkNoise(ctx: AudioContext): ActiveSound {
    const buffer = this.getNoiseBuffer(ctx, "pink");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    source.connect(gain);
    source.start();

    return {
      source,
      gain,
      cleanup: () => {
        try { source.stop(); } catch { /* 已停止 */ }
        source.disconnect();
      },
    };
  }

  // 白噪音
  private createWhiteNoise(ctx: AudioContext): ActiveSound {
    const buffer = this.getNoiseBuffer(ctx, "white");
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 4000;

    source.connect(filter);
    filter.connect(gain);
    source.start();

    return {
      source,
      gain,
      cleanup: () => {
        try { source.stop(); } catch { /* 已停止 */ }
        source.disconnect();
        filter.disconnect();
      },
    };
  }

  // 雨声：棕噪音底 + 随机水滴高频尖峰
  private createRain(ctx: AudioContext): ActiveSound {
    const brown = this.createBrownNoise(ctx);
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0.6;

    // 水滴层：用定时器随机触发短促高频振荡
    let dropletTimer: number | null = null;
    const scheduleDroplet = () => {
      const delay = 50 + Math.random() * 200;
      dropletTimer = window.setTimeout(() => {
        if (Math.random() > 0.3) {
          this.playDroplet(ctx, rainGain);
        }
        scheduleDroplet();
      }, delay);
    };
    scheduleDroplet();

    brown.gain.connect(rainGain);

    return {
      source: brown.source,
      gain: rainGain,
      cleanup: () => {
        if (dropletTimer) clearTimeout(dropletTimer);
        brown.cleanup();
        rainGain.disconnect();
      },
    };
  }

  // 单个水滴声
  private playDroplet(ctx: AudioContext, dest: AudioNode) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = 2000 + Math.random() * 4000;
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.05);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08 + Math.random() * 0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 海浪：棕噪音 + 慢速 LFO 调制振幅
  private createOcean(ctx: AudioContext): ActiveSound {
    const brown = this.createBrownNoise(ctx);
    const oceanGain = ctx.createGain();
    oceanGain.gain.value = 0.5;

    // LFO 调制
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1; // 10 秒一个周期
    lfoGain.gain.value = 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(oceanGain.gain);
    lfo.start();

    brown.gain.connect(oceanGain);

    return {
      source: brown.source,
      gain: oceanGain,
      cleanup: () => {
        try { lfo.stop(); } catch { /* 已停止 */ }
        lfo.disconnect();
        lfoGain.disconnect();
        brown.cleanup();
        oceanGain.disconnect();
      },
    };
  }

  // 篝火：棕噪音底 + 随机爆裂声
  private createFire(ctx: AudioContext): ActiveSound {
    const brown = this.createBrownNoise(ctx);
    const fireGain = ctx.createGain();
    fireGain.gain.value = 0.4;

    // 爆裂层
    let crackleTimer: number | null = null;
    const scheduleCrackle = () => {
      const delay = 100 + Math.random() * 500;
      crackleTimer = window.setTimeout(() => {
        if (Math.random() > 0.2) {
          this.playCrackle(ctx, fireGain);
        }
        scheduleCrackle();
      }, delay);
    };
    scheduleCrackle();

    brown.gain.connect(fireGain);

    return {
      source: brown.source,
      gain: fireGain,
      cleanup: () => {
        if (crackleTimer) clearTimeout(crackleTimer);
        brown.cleanup();
        fireGain.disconnect();
      },
    };
  }

  // 单个爆裂声（用 buffer source 替代 ScriptProcessor）
  private playCrackle(ctx: AudioContext, dest: AudioNode) {
    const bufferSize = 256;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const duration = 0.03 + Math.random() * 0.05;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1000 + Math.random() * 3000;
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.2, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    source.start(now);
    source.stop(now + duration + 0.1);
  }

  // Lo-fi 节拍：低频鼓点 + 柔和和弦
  private createLofi(ctx: AudioContext): ActiveSound {
    const lofiGain = ctx.createGain();
    lofiGain.gain.value = 0.5;

    // 鼓点定时器
    let beatTimer: number | null = null;
    let beatCount = 0;
    const BPM = 72;
    const beatInterval = (60 / BPM) * 1000;

    const scheduleBeat = () => {
      beatTimer = window.setTimeout(() => {
        // 鼓点
        this.playKick(ctx, lofiGain, beatCount);
        // 和弦（每 4 拍换一次）
        if (beatCount % 4 === 0) {
          this.playChord(ctx, lofiGain, beatCount / 4);
        }
        beatCount++;
        scheduleBeat();
      }, beatInterval);
    };
    scheduleBeat();

    // 用一个占位 oscillator 作为 source（Lo-fi 的实际声音由定时器触发的 kick/chord 产生）
    // 这样 stop() 时能正确停止
    const placeholder = ctx.createOscillator();
    placeholder.frequency.value = 0; // 无声
    const placeholderGain = ctx.createGain();
    placeholderGain.gain.value = 0;
    placeholder.connect(placeholderGain);
    placeholder.start();

    return {
      source: placeholder,
      gain: lofiGain,
      cleanup: () => {
        if (beatTimer) clearTimeout(beatTimer);
        try { placeholder.stop(); } catch { /* 已停止 */ }
        placeholder.disconnect();
        placeholderGain.disconnect();
        lofiGain.disconnect();
      },
    };
  }

  // 底鼓
  private playKick(ctx: AudioContext, dest: AudioNode, beat: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const vol = beat % 2 === 0 ? 0.3 : 0.15;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 柔和和弦
  private playChord(ctx: AudioContext, dest: AudioNode, index: number) {
    // 简单和弦进行：Am - F - C - G
    const chords = [
      [220, 262, 330], // Am
      [175, 220, 262], // F
      [262, 330, 392], // C
      [196, 247, 294], // G
    ];
    const chord = chords[index % chords.length];
    const now = ctx.currentTime;

    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 2.1);
    });
  }
}

// 单例导出
export const soundScape = new SoundScapeEngine();
