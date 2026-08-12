import { useMemo } from 'react';
import { PRESET_DATA } from '../../data/presetData';
import type { WallpaperConfig } from '../../types';
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
      // 选择具体壁纸后取消"随机"标记
      random: false,
      // 清空图片相关字段，避免与渐变冲突
      imageUrl: undefined,
      thumbnailUrl: undefined,
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {gradientWallpapers.map((w) => (
        <GradientWallpaperCard
          key={w.gradient}
          item={w}
          isSelected={
            wallpaper.type === 'gradient' &&
            !wallpaper.random &&
            wallpaper.gradient === w.gradient
          }
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};
