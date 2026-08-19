import { useMemo } from 'react';
import { PRESET_DATA } from '@/data/presetData';
import type { WallpaperConfig } from '@/types';
import type { GradientWallpaperItem } from './GradientWallpaperCard';
import { GradientWallpaperCard } from './GradientWallpaperCard';

interface GradientWallpaperGridProps {
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

/** 仅渲染系统预设的「渐变壁纸」，置于左侧侧边栏（系统预设） */
export const GradientWallpaperGrid: React.FC<GradientWallpaperGridProps> = ({
  wallpaper,
  isDarkMode,
  onUpdateWallpaper,
}) => {
  const presetFilter = useMemo(() => {
    const current = isDarkMode ? 'dark' : 'light';
    return (theme?: 'light' | 'dark' | 'both') =>
      !theme || theme === 'both' || theme === current;
  }, [isDarkMode]);

  const gradientWallpapers = useMemo(
    () => PRESET_DATA.STATIC_WALLPAPERS.filter((w) => presetFilter(w.theme)),
    [presetFilter],
  );

  const handleSelect = (item: GradientWallpaperItem) => {
    onUpdateWallpaper({
      type: 'gradient',
      gradient: item.gradient,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {gradientWallpapers.map((w, index) => (
        <GradientWallpaperCard
          key={w.gradient}
          item={{ ...w, id: `preset-gradient-${index}` }}
          isSelected={
            wallpaper.type === 'gradient' && wallpaper.gradient === w.gradient
          }
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};
