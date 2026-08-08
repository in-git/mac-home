// Web Audio API feedback sounds for Apple HIG interaction feel

class SoundEngine {
  private ctx: AudioContext | null = null;
  /** Master switch controlled from the Settings widget. Defaults to on. */
  private enabled = true;

  /** Toggle all UI feedback sounds on/off. */
  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /** Current master switch state. */
  isEnabled() {
    return this.enabled;
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      // resume() 返回 Promise，但首次在用户手势内调用通常同步解锁，
      // 即便未就绪，play 也会在 state 变为 running 后发声。
      void this.ctx.resume();
    }
    return this.ctx;
  }

  // Soft Apple click sound
  playClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio fallback
    }
  }

  // Apple Task Done / Success Chime
  playChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Marimba/Chime notes (E5, B5)
      osc1.frequency.setValueAtTime(659.25, now);
      osc2.frequency.setValueAtTime(987.77, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  }

  // Reminder Alarm Alert Chime
  playAlert() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } catch {
      // Audio fallback
    }
  }

  // Warning buzz: two short descending beeps (distinct from playAlert's rising chime)
  playWarning() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const beeps: { f: number; t: number }[] = [
        { f: 740, t: 0 },
        { f: 540, t: 0.18 },
      ];
      beeps.forEach(({ f, t }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.0001, now + t);
        gain.gain.exponentialRampToValueAtTime(0.18, now + t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.15);
      });
    } catch {
      // Audio fallback
    }
  }
}

export const playSound = new SoundEngine();

/**
 * 全局点击音效（事件委托）。
 *
 * 在 document 上挂一个 click 监听，自动命中「任意 <button>」或带
 * `data-sound` 属性的非按钮元素，无需在每个组件里手动调 playClick()。
 * 由于使用事件委托，React 后续动态挂载的元素也能自动生效。
 *
 * 说明：过渡期内部分组件仍保留了显式 playSound.playClick() 调用，
 * 与新机制会「双响」；统一清理后可移除那些旧调用。
 */
export function initGlobalSound(): () => void {
  const handler = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // 命中 button 或显式标记 data-sound 的元素（含其任意子元素内点击）
    const hit = target.closest('button, [data-sound]');
    if (hit) {
      playSound.playClick();
    }
  };
  document.addEventListener('click', handler, true);
  // 返回卸载函数，便于在 React 严格模式下避免重复绑定
  return () => document.removeEventListener('click', handler, true);
}
