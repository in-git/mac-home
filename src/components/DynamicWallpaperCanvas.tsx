import React, { useEffect, useRef } from 'react';
import {
  createParticles,
  dynamicPresets,
  getWallpaperEffect,
} from '../data/wallpaperEffects';
import MoltenMetalWallpaper from '../effects/MoltenMetal';
import { PlasmaWaveWallpaper } from '../effects/PlasmaWave';
import { ThreadsWallpaper } from '../effects/Threads';
import { WallpaperConfig } from '../types';
import { buildWallpaperFilter } from '../utils/wallpaperFilter';

interface Props {
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  /** 屏幕亮度（10-100，100 为原始），与壁纸亮度叠加作用于背景层 */
  screenBrightness?: number;
}

export const DynamicWallpaperCanvas: React.FC<Props> = ({
  wallpaper,
  isDarkMode,
  screenBrightness = 100,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 解析当前预设的有效深色模式：预设的 isDarkMode 配置优先，否则跟随全局。
  const presetConfig = dynamicPresets.find(
    (p) => p.id === wallpaper.dynamicPreset,
  );
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

      effect.render({
        ctx,
        width,
        height,
        time,
        isDarkMode: effectiveDarkMode,
        particles,
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [wallpaper, effectiveDarkMode]);

  // 屏幕亮度与壁纸亮度叠加：两者均为百分比，乘积 / 100 得综合亮度。
  // 作用于整个壁纸层，动态画布、静态图片与渐变背景表现完全一致。
  const effectiveBrightness = (wallpaper.brightness * screenBrightness) / 100;

  const filterStyle = {
    backdropFilter: buildWallpaperFilter({
      blur: wallpaper.blur,
      brightness: effectiveBrightness,
      contrast: wallpaper.contrast ?? 1,
      saturation: wallpaper.saturation ?? 1,
      hue: wallpaper.hue ?? 0,
      sepia: wallpaper.sepia ?? 0,
      grayscale: wallpaper.grayscale ?? 0,
      invert: wallpaper.invert ?? 0,
    }),
    WebkitBackdropFilter: buildWallpaperFilter({
      blur: wallpaper.blur,
      brightness: effectiveBrightness,
      contrast: wallpaper.contrast ?? 1,
      saturation: wallpaper.saturation ?? 1,
      hue: wallpaper.hue ?? 0,
      sepia: wallpaper.sepia ?? 0,
      grayscale: wallpaper.grayscale ?? 0,
      invert: wallpaper.invert ?? 0,
    }),
  };

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none">
      {wallpaper.type === 'dynamic' &&
      wallpaper.dynamicPreset === 'molten-metal' ? (
        <MoltenMetalWallpaper className="absolute inset-0" />
      ) : wallpaper.type === 'dynamic' &&
        wallpaper.dynamicPreset === 'threads' ? (
        <ThreadsWallpaper
          className="absolute inset-0"
          color={effectiveDarkMode ? [0.6, 0.6, 0.7] : [1, 1, 1]}
        />
      ) : wallpaper.type === 'dynamic' &&
        wallpaper.dynamicPreset === 'plasma-wave' ? (
        <PlasmaWaveWallpaper
          className="absolute inset-0"
          colors={
            effectiveDarkMode ? ['#A855F7', '#22D3EE'] : ['#C084FC', '#67E8F9']
          }
        />
      ) : wallpaper.type === 'dynamic' ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : wallpaper.imageUrl ? (
        <img
          src={wallpaper.imageUrl}
          alt="Desktop Wallpaper"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full transition-opacity duration-700"
          style={{
            background:
              wallpaper.gradient ||
              'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
          }}
        />
      )}

      {/* Overlay Filters */}
      <div
        className="absolute inset-0 w-full h-full transition-[opacity,filter] duration-300"
        style={filterStyle}
      />

      {/* Soft Noise Grain Overlay for Apple Matte Finish */}
      <div className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
    </div>
  );
};
