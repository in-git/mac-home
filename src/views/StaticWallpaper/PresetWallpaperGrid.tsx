import type { WallpaperConfig } from '../../types';
import type { PresetStaticWallpaper } from '../../data/presetData';
import {
  WallpaperCard,
  isWallpaperItemSelected,
  type WallpaperCardItem,
} from './WallpaperCard';

interface PresetWallpaperGridProps {
  items: PresetStaticWallpaper[];
  wallpaper: WallpaperConfig;
  onSelect: (item: WallpaperCardItem) => void;
}

/** 系统预设壁纸网格：图片壁纸与渐变兜底壁纸共用 */
export const PresetWallpaperGrid: React.FC<PresetWallpaperGridProps> = ({
  items,
  wallpaper,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <WallpaperCard
          key={item.gradient}
          item={item}
          isSelected={isWallpaperItemSelected(wallpaper, item)}
          onClick={() => onSelect(item)}
        />
      ))}
    </div>
  );
};
