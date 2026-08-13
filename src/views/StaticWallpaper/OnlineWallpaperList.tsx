import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { wallpaperApi, WallpaperCategory, WallpaperItem } from '../../api/wallpaper';
import { ImageWallpaperCard, type ImageWallpaperItem } from './ImageWallpaperCard';

interface OnlineWallpaperListProps {
  /** 当前已选图片壁纸的标识（thumbnailUrl/imageUrl），用于高亮选中项 */
  selectedKey?: string;
  onSelect: (item: ImageWallpaperItem) => void;
}

/** 在线壁纸：接口数据，支持分类筛选与分页 */
export const OnlineWallpaperList: React.FC<OnlineWallpaperListProps> = ({
  selectedKey,
  onSelect,
}) => {
  const [categories, setCategories] = useState<WallpaperCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载分类列表
  useEffect(() => {
    const load = async () => {
      try {
        const res = await wallpaperApi.getCategoryList();
        if (Array.isArray(res)) setCategories(res);
      } catch {
        // 忽略分类加载失败
      }
    };
    load();
  }, []);

  // 加载壁纸列表
  const fetchWallpapers = async (p = 1, cat = selectedCat) => {
    setLoading(true);
    try {
      const res = await wallpaperApi.getPage({
        current: p,
        size: 12,
        categoryTag: cat || undefined,
      });
      if (res && Array.isArray(res.records)) {
        setItems(res.records);
        setPage(res.current ?? p);
        setTotalPages(res.pages ?? 1);
      }
    } catch {
      // 忽略壁纸加载失败
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallpapers(1, selectedCat);
  }, [selectedCat]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedCat('')}
            className={`rounded-[var(--card-radius)] px-2.5 py-1 transition-colors ${
              selectedCat === ''
                ? 'bg-[color:var(--accent)] font-medium text-white'
                : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCat(c.value)}
              className={`rounded-[var(--card-radius)] px-2.5 py-1 transition-colors ${
                selectedCat === c.value
                  ? 'bg-[color:var(--accent)] font-medium text-white'
                  : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => fetchWallpapers(page, selectedCat)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-[color:var(--accent)]"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex h-32 items-center justify-center ">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) => (
              <ImageWallpaperCard
                key={item.id}
                item={{
                  id: item.id,
                  name: item.title,
                  imageUrl: item.imageUrl,
                  thumbnailUrl: item.thumbnailUrl,
                }}
                isSelected={(item.thumbnailUrl ?? item.imageUrl) === selectedKey}
                onSelect={onSelect}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end space-x-2 text-xs text-slate-500">
              <button
                disabled={page <= 1 || loading}
                onClick={() => fetchWallpapers(page - 1)}
                className="rounded-[var(--card-radius)] border px-2 py-1 disabled:opacity-40"
              >
                上一页
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => fetchWallpapers(page + 1)}
                className="rounded-[var(--card-radius)] border px-2 py-1 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="py-4 text-center text-xs ">暂无在线壁纸</p>
      )}
    </>
  );
};
