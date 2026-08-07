import React, { useEffect, useRef } from 'react';
import { WallpaperConfig } from '../types';
import { getWallpaperEffect, createParticles, dynamicPresets } from '../data/wallpaperEffects';
import MoltenMetalWallpaper from '../effects/MoltenMetal';
import { ThreadsWallpaper } from '../effects/Threads';
import { PlasmaWaveWallpaper } from '../effects/PlasmaWave';

interface Props {
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
}

export const DynamicWallpaperCanvas: React.FC<Props> = ({ wallpaper, isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 解析当前预设的有效深色模式：预设的 isDarkMode 配置优先，否则跟随全局。
  const presetConfig = dynamicPresets.find((p) => p.id === wallpaper.dynamicPreset);
  const effectiveDarkMode = presetConfig?.isDarkMode ?? isDarkMode;

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

    // Shared particle pool for effects that need it.
    const particles = createParticles(width, height);

    // Resolve the active effect by id so new backgrounds can be added
    // dynamically without touching this component.
    const effect = getWallpaperEffect(wallpaper.dynamicPreset || 'aurora');

    let time = 0;

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      effect.render({ ctx, width, height, time, isDarkMode: effectiveDarkMode, particles });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [wallpaper, effectiveDarkMode]);

  const filterStyle = {
    backdropFilter: `blur(${wallpaper.blur}px) brightness(${wallpaper.brightness}%)`,
    WebkitBackdropFilter: `blur(${wallpaper.blur}px) brightness(${wallpaper.brightness}%)`,
  };

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none">
      {wallpaper.type === 'dynamic' && wallpaper.dynamicPreset === 'molten-metal' ? (
        <MoltenMetalWallpaper className="absolute inset-0" />
      ) : wallpaper.type === 'dynamic' && wallpaper.dynamicPreset === 'threads' ? (
        <ThreadsWallpaper className="absolute inset-0" color={effectiveDarkMode ? [0.6, 0.6, 0.7] : [1, 1, 1]} />
      ) : wallpaper.type === 'dynamic' && wallpaper.dynamicPreset === 'plasma-wave' ? (
        <PlasmaWaveWallpaper
          className="absolute inset-0"
          colors={effectiveDarkMode ? ['#A855F7', '#22D3EE'] : ['#C084FC', '#67E8F9']}
        />
      ) : wallpaper.type === 'dynamic' ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      ) : wallpaper.imageUrl ? (
        <img
          src={wallpaper.imageUrl}
          alt="Desktop Wallpaper"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-700"
          style={{ background: wallpaper.gradient || 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }}
        />
      )}

      {/* Overlay Filters */}
      <div className="absolute inset-0 w-full h-full transition-[opacity,filter] duration-300" style={filterStyle} />
      
      {/* Soft Noise Grain Overlay for Apple Matte Finish */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
    </div>
  );
};
