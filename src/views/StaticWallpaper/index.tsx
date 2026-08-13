import type { WallpaperConfig } from '../../types';
import { OnlineWallpaperList } from './OnlineWallpaperList';
import type { ImageWallpaperItem } from './ImageWallpaperCard';

interface StaticWallpaperSectionProps {
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

/** 静态壁纸面板：直接展示在线壁纸（系统预设图片已移除） */
export const StaticWallpaperSection: React.FC<StaticWallpaperSectionProps> = ({
  wallpaper,
  onUpdateWallpaper,
}) => {
  const handleSelect = (item: ImageWallpaperItem) => {
    onUpdateWallpaper({
      type: 'static',
      imageUrl: item.imageUrl,
      gradient: undefined,
    });
  };

  // 当前已选图片壁纸的标识（缩略图优先，回退原图），用于列表高亮。
  // 卡片内部以 (thumbnailUrl ?? imageUrl) 作为比较键，这里保持一致。
  const selectedKey = wallpaper.imageUrl ?? ''; 

  return (
    <div className="space-y-6">
      <OnlineWallpaperList selectedKey={selectedKey} onSelect={handleSelect} />
    </div>
  );
};
