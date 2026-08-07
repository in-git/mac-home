import React, { useEffect, useRef } from 'react';
import { WallpaperConfig } from '../types';
import { getWallpaperEffect, createParticles, isWebglWallpaper } from '../data/wallpaperEffects';
import MoltenMetalWallpaper from '../effects/MoltenMetal';
import ThreadsWallpaper from '../effects/Threads';

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

    // Shared particle pool for effects that need it.
    const particles = createParticles(width, height);

    // Resolve the active effect by id so new backgrounds can be added
    // dynamically without touching this component.
    const effect = getWallpaperEffect(wallpaper.dynamicPreset || 'aurora');

    let time = 0;

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, width, height);

      effect.render({ ctx, width, height, time, isDarkMode, particles });

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
      {wallpaper.type === 'dynamic' && wallpaper.dynamicPreset && isWebglWallpaper(wallpaper.dynamicPreset) ? (
        <MoltenMetalWallpaper className="absolute inset-0" />
      ) : wallpaper.dynamicPreset === 'threads' ? (
        <ThreadsWallpaper className="absolute inset-0" />
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
