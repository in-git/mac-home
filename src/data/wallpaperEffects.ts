// Dynamic wallpaper canvas effects.
//
// Each effect is registered by a string id (matching `WallpaperConfig.dynamicPreset`)
// and exposes a single `render` function. The animation loop in DynamicWallpaperCanvas
// owns the shared frame state (time, canvas size, dark mode, particle pool) and passes
// it to the active effect every frame.
//
// To add a new background effect, just call `registerWallpaperEffect('my-effect', {...})`
// anywhere before it is needed, or extend the `WALLPAPER_EFFECTS` table below — no other
// code changes are required.

export interface WallpaperEffectContext {
  /** 2D drawing context for the background canvas. */
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Monotonically increasing animation clock (seconds-ish). */
  time: number;
  isDarkMode: boolean;
  /**
   * Shared particle pool (45 particles). Effects that don't use particles can
   * simply ignore it.
   */
  particles: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
}

export function createParticles(width: number, height: number): Particle[] {
  return Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 3 + 1,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.2,
  }));
}

export interface WallpaperEffect {
  id: string;
  render: (c: WallpaperEffectContext) => void;
}

// --- Effect implementations -------------------------------------------------

const aurora: WallpaperEffect = {
  id: 'aurora',
  render: ({ ctx, width, height, time, isDarkMode }) => {
    // macOS Sonoma Liquid Aurora Gradient
    const g1 = ctx.createRadialGradient(
      width * 0.3 + Math.sin(time) * 120,
      height * 0.3 + Math.cos(time * 0.8) * 100,
      20,
      width * 0.3,
      height * 0.3,
      width * 0.7
    );
    g1.addColorStop(0, isDarkMode ? 'rgba(76, 29, 149, 0.75)' : 'rgba(192, 132, 252, 0.65)');
    g1.addColorStop(0.5, isDarkMode ? 'rgba(30, 58, 138, 0.6)' : 'rgba(147, 197, 253, 0.55)');
    g1.addColorStop(1, isDarkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(245, 245, 247, 0.95)');

    const g2 = ctx.createRadialGradient(
      width * 0.7 + Math.cos(time * 1.2) * 150,
      height * 0.6 + Math.sin(time) * 120,
      30,
      width * 0.7,
      height * 0.6,
      width * 0.6
    );
    g2.addColorStop(0, isDarkMode ? 'rgba(13, 148, 136, 0.5)' : 'rgba(167, 243, 208, 0.6)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = isDarkMode ? '#090d16' : '#f5f5f7';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
  },
};

const dayNight: WallpaperEffect = {
  id: 'day-night',
  render: ({ ctx, width, height, isDarkMode }) => {
    // Time-based smooth daylight/sunset gradient
    const hour = new Date().getHours();
    let c1 = 'rgba(186, 230, 253, 0.8)';
    let c2 = 'rgba(224, 231, 255, 0.9)';

    if (hour >= 18 || hour < 6) {
      c1 = 'rgba(15, 23, 42, 0.95)';
      c2 = 'rgba(30, 27, 75, 0.9)';
    } else if (hour >= 16) {
      c1 = 'rgba(253, 186, 116, 0.8)';
      c2 = 'rgba(244, 114, 182, 0.8)';
    }

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  },
};

const particlesEffect: WallpaperEffect = {
  id: 'particles',
  render: ({ ctx, width, height, isDarkMode, particles }) => {
    // Zen Particles
    ctx.fillStyle = isDarkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = isDarkMode
        ? `rgba(255, 255, 255, ${p.alpha * 0.7})`
        : `rgba(0, 122, 255, ${p.alpha * 0.4})`;
      ctx.fill();
    });
  },
};

const meshWave: WallpaperEffect = {
  id: 'mesh-wave',
  render: ({ ctx, width, height, time, isDarkMode }) => {
    // Ambient Wave Spectrum
    ctx.fillStyle = isDarkMode ? '#090a0f' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      for (let x = 0; x <= width; x += 30) {
        const y =
          height * 0.5 +
          Math.sin(x * 0.003 + time + i) * 60 +
          Math.cos(x * 0.002 - time * 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
      if (i === 0) {
        waveGrad.addColorStop(0, 'rgba(0, 122, 255, 0.2)');
        waveGrad.addColorStop(1, 'rgba(168, 85, 247, 0.2)');
      } else if (i === 1) {
        waveGrad.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
        waveGrad.addColorStop(1, 'rgba(236, 72, 153, 0.15)');
      } else {
        waveGrad.addColorStop(0, 'rgba(52, 211, 153, 0.12)');
        waveGrad.addColorStop(1, 'rgba(99, 102, 241, 0.12)');
      }
      ctx.fillStyle = waveGrad;
      ctx.fill();
    }
  },
};

// --- Registry ---------------------------------------------------------------

const WALLPAPER_EFFECTS: Record<string, WallpaperEffect> = {
  [aurora.id]: aurora,
  [dayNight.id]: dayNight,
  [particlesEffect.id]: particlesEffect,
  [meshWave.id]: meshWave,
};

const DEFAULT_EFFECT = aurora;

export function registerWallpaperEffect(id: string, effect: WallpaperEffect): void {
  WALLPAPER_EFFECTS[id] = effect;
}

export function getWallpaperEffect(id: string): WallpaperEffect {
  return WALLPAPER_EFFECTS[id] ?? DEFAULT_EFFECT;
}
