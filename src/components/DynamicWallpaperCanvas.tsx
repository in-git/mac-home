import React, { useEffect, useRef } from 'react';
import { WallpaperConfig } from '../types';

interface Props {
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
}

export const DynamicWallpaperCanvas: React.FC<Props> = ({ wallpaper, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (wallpaper.type !== 'dynamic') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle system for Zen Particles
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    let time = 0;

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      const preset = wallpaper.dynamicPreset || 'aurora';

      if (preset === 'aurora') {
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
      } else if (preset === 'day-night') {
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
      } else if (preset === 'particles') {
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
      } else if (preset === 'mesh-wave') {
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
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [wallpaper, isDarkMode]);

  const filterStyle = {
    backdropFilter: `blur(${wallpaper.blur}px) brightness(${wallpaper.brightness}%)`,
    WebkitBackdropFilter: `blur(${wallpaper.blur}px) brightness(${wallpaper.brightness}%)`,
  };

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none">
      {wallpaper.type === 'dynamic' ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      ) : wallpaper.imageUrl ? (
        <img
          src={wallpaper.imageUrl}
          alt="Desktop Wallpaper"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full transition-all duration-700"
          style={{ background: wallpaper.gradient || 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }}
        />
      )}

      {/* Overlay Filters */}
      <div className="absolute inset-0 w-full h-full transition-all duration-300" style={filterStyle} />
      
      {/* Soft Noise Grain Overlay for Apple Matte Finish */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
    </div>
  );
};
