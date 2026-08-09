import type { WallpaperConfig } from '../../types';

/** 壁纸卡片渲染项：在线壁纸（WallpaperItem）与系统预设（PresetStaticWallpaper）共用 */
export type WallpaperCardItem = {
  id?: string;
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  gradient?: string;
};

interface WallpaperCardProps {
  item: WallpaperCardItem;
  isSelected: boolean;
  onClick: () => void;
}

/** 单个壁纸卡片（在线壁纸与预设共用，均以 gradient 作为唯一标识） */
export const WallpaperCard: React.FC<WallpaperCardProps> = ({
  item,
  isSelected,
  onClick,
}) => {
  const imgSrc = item.thumbnailUrl || item.imageUrl;
  const label = item.title ?? item.gradient ?? '';

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[16/9] overflow-hidden rounded-[var(--card-radius)] border transition-transform ${
        isSelected
          ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
          : 'border-black/10 hover:scale-105 dark:border-white/10'
      }`}
      title={label}
      style={!imgSrc && item.gradient ? { background: item.gradient } : undefined}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt={label}
          loading="lazy"
          className="h-full w-full object-cover hover:scale-105 transition-transform"
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
        <p className="truncate text-left text-font-sm font-medium text-white">
          {label}
        </p>
      </div>
      {isSelected && (
        <span className="absolute inset-0 inline-flex items-center justify-center bg-black/30">
          <span className="rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-font-sm font-semibold text-white">
            当前
          </span>
        </span>
      )}
    </button>
  );
};

/** 判断某项是否为当前选中的静态壁纸 */
export const isWallpaperItemSelected = (
  wallpaper: WallpaperConfig,
  item: WallpaperCardItem,
): boolean =>
  wallpaper.type === 'static' &&
  (wallpaper.imageUrl === item.imageUrl ||
    wallpaper.imageUrl === item.thumbnailUrl);
