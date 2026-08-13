import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { wallpaperApi } from '../../api/wallpaper';
import type { WallpaperConfig } from '../../types';
import { ImageWallpaperCard, type ImageWallpaperItem } from './ImageWallpaperCard';

interface StaticWallpaperRowProps {
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

/** 静态壁纸：置于渐变壁纸上方的一行 4 个缩略图 */
export const StaticWallpaperRow: React.FC<StaticWallpaperRowProps> = ({
  wallpaper,
  onUpdateWallpaper,
}) => {
  const [items, setItems] = useState<ImageWallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    wallpaperApi
      .getPage({ current: 1, size: 4 })
      .then((res) => {
        if (!active || !res || !Array.isArray(res.records)) return;
        setItems(
          res.records.map((r) => ({
            id: r.id,
            name: r.title,
            imageUrl: r.imageUrl,
            thumbnailUrl: r.thumbnailUrl,
          })),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = (item: ImageWallpaperItem) => {
    onUpdateWallpaper({
      type: 'static',
      imageUrl: item.imageUrl,
      gradient: undefined,
    });
  };

  const selectedKey = wallpaper.imageUrl;

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        静态壁纸
      </h3>
      {loading ? (
        <div className="flex h-[88px] items-center justify-center ">
          <Loader2 className="animate-spin" size={18} />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {items.map((item) => (
            <ImageWallpaperCard
              key={item.id}
              item={item}
              isSelected={(item.thumbnailUrl ?? item.imageUrl) === selectedKey}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <p className="py-3 text-center text-xs ">暂无静态壁纸</p>
      )}
    </section>
  );
};
