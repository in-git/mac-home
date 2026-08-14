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
      id: item.id,
      imageUrl: item.imageUrl,
      gradient: undefined,
    });
  };

  // 当前已选图片壁纸的标识（用于列表高亮），使用在线库中的唯一 id。
  // 仅当当前壁纸类型为 static 时才视为「选中」，避免切到动态/渐变后残留 id 误勾所有项。
  const selectedKey =
    wallpaper.type === 'static' ? wallpaper.id ?? '' : '';

  return (
    <div className="space-y-6">
      <OnlineWallpaperList selectedKey={selectedKey} onSelect={handleSelect} />
    </div>
  );
};
