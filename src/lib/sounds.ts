// Web Audio API procedural sound synthesizer (0ms latency, zero assets download, auto-suspending)

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private suspendTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chatyy_sound_muted");
      this.isMuted = saved === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.scheduleSuspend();
    return this.ctx;
  }

  // Auto-suspend AudioContext after 400ms idle to completely free the browser audio thread
  private scheduleSuspend() {
    if (this.suspendTimer) clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      if (this.ctx && this.ctx.state === "running") {
        this.ctx.suspend();
      }
    }, 400);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("chatyy_sound_muted", String(this.isMuted));
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Subtle upward pop when sending a message
  public playSend() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
      this.scheduleSuspend();
    } catch {
      // Audio playback blocked or not supported
    }
  }

  // Soft two-tone bubble pop when receiving a message
  public playReceive() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
      this.scheduleSuspend();
    } catch {
      // Audio playback blocked
    }
  }

  // Satisfying mechanical unlock chime
  public playUnlock() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // First click
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(480, now + 0.05);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Harmonious chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(587.33, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain2.gain.setValueAtTime(0.12, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.25);
      this.scheduleSuspend();
    } catch {
      // Audio playback blocked
    }
  }

  // Soft low thud for incorrect password attempts
  public playError() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
      this.scheduleSuspend();
    } catch {
      // Audio playback blocked
    }
  }
}

export const soundManager = new SoundManager();
