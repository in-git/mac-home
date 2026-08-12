import type { WallpaperConfig } from '../../types';
import { OnlineWallpaperList } from './OnlineWallpaperList';
import type { ImageWallpaperItem } from './ImageWallpaperCard';

interface StaticWallpaperSectionProps {
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

/** 静态壁纸面板：直接展示在线壁纸（系统预设图片已移除） */
export const StaticWallpaperSection: React.FC<StaticWallpaperSectionProps> = ({
  onUpdateWallpaper,
}) => {
  const handleSelect = (item: ImageWallpaperItem) => {
    onUpdateWallpaper({
      type: 'image',
      imageUrl: item.imageUrl,
      thumbnailUrl: item.thumbnailUrl,
      random: false,
      gradient: undefined,
    });
  };

  return (
    <div className="space-y-6">
      <OnlineWallpaperList onSelect={handleSelect} />
    </div>
  );
};
