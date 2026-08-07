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

import { DynamicPreset } from "../types";

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

// --- 新增效果 1：星空漂移 (Starfield) ---
const starfield: WallpaperEffect = {
    id: 'starfield',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#030712' : '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const numStars = 60;
        for (let i = 0; i < numStars; i++) {
            const x = (Math.sin(i * 99.1) * 10000 + time * (10 + (i % 5))) % width;
            const y = (Math.cos(i * 33.3) * 10000) % height;
            const radius = (i % 3) + 0.8;
            const alpha = Math.sin(time * 2 + i) * 0.3 + 0.5;

            ctx.beginPath();
            ctx.arc(x < 0 ? x + width : x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isDarkMode ? `rgba(255, 255, 255, ${alpha})` : `rgba(15, 23, 42, ${alpha * 0.6})`;
            ctx.fill();
        }
    },
};

// --- 新增效果 2：赛博网格 (Cyber Grid Perspective) ---
const cyberGrid: WallpaperEffect = {
    id: 'cyber-grid',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#05050a' : '#f1f5f9';
        ctx.fillRect(0, 0, width, height);

        const horizonY = height * 0.6;
        const gridColor = isDarkMode ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)';

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        const offset = (time * 40) % 30;
        for (let y = horizonY; y < height; y += (y - horizonY) * 0.1 + 5) {
            ctx.beginPath();
            ctx.moveTo(0, y + offset);
            ctx.lineTo(width, y + offset);
            ctx.stroke();
        }

        const numLines = 20;
        const centerX = width / 2;
        for (let i = -numLines; i <= numLines; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, horizonY);
            ctx.lineTo(centerX + i * 120, height);
            ctx.stroke();
        }
    },
};

// --- 新增效果 3：量子呼吸光晕 (Quantum Glow) ---
const quantumGlow: WallpaperEffect = {
    id: 'quantum-glow',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#020617' : '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.max(width, height) * 0.6;

        for (let i = 4; i > 0; i--) {
            const r = maxR * (i / 4) + Math.sin(time + i) * 50;
            const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, Math.abs(r));

            if (isDarkMode) {
                grad.addColorStop(0, `rgba(14, 165, 233, ${0.15 * i})`);
                grad.addColorStop(1, `rgba(99, 102, 241, 0)`);
            } else {
                grad.addColorStop(0, `rgba(168, 85, 247, ${0.1 * i})`);
                grad.addColorStop(1, `rgba(59, 130, 246, 0)`);
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.abs(r), 0, Math.PI * 2);
            ctx.fill();
        }
    },
};

// --- 新增效果 4：正弦双生波 (Dual Sine Waves) ---
const dualSine: WallpaperEffect = {
    id: 'dual-sine',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#030712' : '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const drawWave = (speed: number, amp: number, color: string) => {
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            for (let x = 0; x <= width; x += 10) {
                const y = height / 2 + Math.sin(x * 0.005 + time * speed) * amp + Math.cos(x * 0.003 - time) * (amp * 0.5);
                ctx.lineTo(x, y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        };

        drawWave(1.2, 80, isDarkMode ? 'rgba(52, 211, 153, 0.5)' : 'rgba(16, 185, 129, 0.4)');
        drawWave(0.8, 100, isDarkMode ? 'rgba(129, 140, 248, 0.5)' : 'rgba(99, 102, 241, 0.4)');
    },
};

// --- 新增效果 5：黑客帝国数字雨 (Matrix Rain) ---
const matrixRain: WallpaperEffect = {
    id: 'matrix-rain',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? 'rgba(3, 7, 18, 0.2)' : 'rgba(248, 250, 252, 0.2)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = isDarkMode ? '#34d399' : '#059669';
        ctx.font = '14px monospace';

        const cols = Math.floor(width / 25);
        for (let i = 0; i < cols; i++) {
            const x = i * 25;
            const y = ((time * 80 + i * 37) % (height + 200)) - 100;
            const char = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
            ctx.fillText(char, x, y);
        }
    },
};

// --- 新增效果 6：脉冲同心圆 (Pulse Rings) ---
const pulseRings: WallpaperEffect = {
    id: 'pulse-rings',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#020617' : '#ffffff';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.max(width, height) * 0.7;

        for (let i = 0; i < 5; i++) {
            const progress = ((time * 0.5 + i * 0.2) % 1);
            const r = progress * maxRadius;
            const alpha = (1 - progress) * 0.6;

            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = isDarkMode ? `rgba(56, 189, 248, ${alpha})` : `rgba(14, 165, 233, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    },
};

// --- 新增效果 7：流星划过 (Shooting Stars) ---
const shootingStars: WallpaperEffect = {
    id: 'shooting-stars',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#030712' : '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 4; i++) {
            const progress = ((time * 0.4 + i * 1.7) % 3);
            if (progress > 1) continue; // 留出间歇期

            const startX = width * (0.2 + i * 0.2);
            const startY = height * 0.1;
            const x = startX + progress * 400;
            const y = startY + progress * 300;

            const grad = ctx.createLinearGradient(x - 100, y - 75, x, y);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 23, 42, 0.7)');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 100, y - 75);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    },
};

// --- 新增效果 8：多维矩阵网格 (Constellation Mesh) ---
const constellation: WallpaperEffect = {
    id: 'constellation',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#090d16' : '#f1f5f9';
        ctx.fillRect(0, 0, width, height);

        const pts = 12;
        const coords = Array.from({ length: pts }, (_, i) => ({
            x: width * 0.5 + Math.sin(time * 0.5 + i * 1.5) * (width * 0.35),
            y: height * 0.5 + Math.cos(time * 0.4 + i * 2.1) * (height * 0.35),
        }));

        for (let i = 0; i < pts; i++) {
            for (let j = i + 1; j < pts; j++) {
                const dx = coords[i].x - coords[j].x;
                const dy = coords[i].y - coords[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 180) {
                    const alpha = (1 - dist / 180) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(coords[i].x, coords[i].y);
                    ctx.lineTo(coords[j].x, coords[j].y);
                    ctx.strokeStyle = isDarkMode ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    },
};

// --- 新增效果 9：呼吸光点 (Breathing Orbs) ---
const breathingOrbs: WallpaperEffect = {
    id: 'breathing-orbs',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#0b0f19' : '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const orbs = [
            { x: width * 0.3, y: height * 0.4, baseColor: isDarkMode ? '168, 85, 247' : '216, 180, 254' },
            { x: width * 0.7, y: height * 0.6, baseColor: isDarkMode ? '56, 189, 248' : '186, 230, 253' },
        ];

        orbs.forEach((o, index) => {
            const r = 120 + Math.sin(time + index * 2) * 40;
            const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
            grad.addColorStop(0, `rgba(${o.baseColor}, 0.4)`);
            grad.addColorStop(1, `rgba(${o.baseColor}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    },
};

// --- 新增效果 10：浮动几何块 (Floating Geometry) ---
const floatingGeometry: WallpaperEffect = {
    id: 'floating-geometry',
    render: ({ ctx, width, height, time, isDarkMode }) => {
        ctx.fillStyle = isDarkMode ? '#030712' : '#ffffff';
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < 6; i++) {
            const size = 40 + (i * 15);
            const x = (width * 0.15 * (i + 1) + Math.sin(time * 0.5 + i) * 50) % width;
            const y = (height * 0.2 * ((i % 3) + 1) + Math.cos(time * 0.3 + i) * 40) % height;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(time * 0.2 + i);

            ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-size / 2, -size / 2, size, size);
            ctx.restore();
        }
    },
};

// --- Registry ---------------------------------------------------------------

const WALLPAPER_EFFECTS: Record<string, WallpaperEffect> = {
    [aurora.id]: aurora,
    [dayNight.id]: dayNight,
    [particlesEffect.id]: particlesEffect,
    [meshWave.id]: meshWave,
    [starfield.id]: starfield,
    [cyberGrid.id]: cyberGrid,
    [quantumGlow.id]: quantumGlow,
    [dualSine.id]: dualSine,
    [matrixRain.id]: matrixRain,
    [pulseRings.id]: pulseRings,
    [shootingStars.id]: shootingStars,
    [constellation.id]: constellation,
    [breathingOrbs.id]: breathingOrbs,
    [floatingGeometry.id]: floatingGeometry,
};

const DEFAULT_EFFECT = aurora;

export function registerWallpaperEffect(id: string, effect: WallpaperEffect): void {
    WALLPAPER_EFFECTS[id] = effect;
}

export function getWallpaperEffect(id: string): WallpaperEffect {
    return WALLPAPER_EFFECTS[id] ?? DEFAULT_EFFECT;
}

export const dynamicPresets: { id: DynamicPreset; name: string; desc: string; previewColor: string }[] = [
    {
        id: 'aurora',
        name: 'Sonoma 极光流彩 (Aurora)',
        desc: 'macOS 动态渐变与流光流动',
        previewColor: 'from-purple-400 via-pink-400 to-blue-400',
    },
    {
        id: 'day-night',
        name: '时间天空 (Sky Shift)',
        desc: '随真实时间变化日落与星空',
        previewColor: 'from-amber-300 via-sky-400 to-indigo-600',
    },
    {
        id: 'particles',
        name: '禅意浮光 (Zen Particles)',
        desc: '柔和浮动微粒与极致静谧',
        previewColor: 'from-slate-300 to-blue-300',
    },
    {
        id: 'mesh-wave',
        name: '声浪波形 (Wave Spectrum)',
        desc: '流畅正弦波形重叠流体',
        previewColor: 'from-cyan-400 via-blue-500 to-indigo-500',
    },
   
];