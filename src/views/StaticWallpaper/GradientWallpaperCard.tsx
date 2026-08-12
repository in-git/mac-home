import clsx from 'clsx';

/** 渐变壁纸项（仅含 gradient 字段，与图片壁纸彻底分离） */
export interface GradientWallpaperItem {
  id: string;
  name?: string;
  gradient: string;
  theme?: 'light' | 'dark' | 'both';
}

interface GradientWallpaperCardProps {
  item: GradientWallpaperItem;
  isSelected: boolean;
  onSelect: (item: GradientWallpaperItem) => void;
}

export const GradientWallpaperCard: React.FC<GradientWallpaperCardProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const label = item.name || item.gradient;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={label}
      className="group relative flex flex-col overflow-hidden rounded-xl ring-1 ring-black/[0.06] dark:ring-white/[0.08] aspect-[16/9]"
    >
      {/* 渐变预览 */}
      <div
        className="aspect-[4/3] w-full"
        style={{ background: item.gradient }}
      />

      {/* 选中态遮罩 + 勾选 */}
      <div
        className={clsx(
          'absolute inset-0 flex items-center justify-center rounded-xl transition-opacity duration-200',
          isSelected
            ? 'bg-black/25 opacity-100'
            : 'bg-black/0 opacity-0 group-hover:bg-black/15 group-hover:opacity-100',
        )}
      >
        {isSelected && (
          <svg
            className="h-7 w-7 text-white drop-shadow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
};
