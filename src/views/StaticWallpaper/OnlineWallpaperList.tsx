import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
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
    wallpaperApi
      .getCategoryList()
      .then((res) => {
        if (Array.isArray(res)) setCategories(res);
      })
      .catch(() => {});
  }, []);

  // 加载壁纸列表
  const fetchWallpapers = (p = 1, cat = selectedCat) => {
    setLoading(true);
    wallpaperApi
      .getPage({ current: p, size: 12, categoryTag: cat || undefined })
      .then((res) => {
        if (res && Array.isArray(res.records)) {
          setItems(res.records);
          setPage(res.current ?? p);
          setTotalPages(res.pages ?? 1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWallpapers(1, selectedCat);
  }, [selectedCat]);

  // 当前选中的壁纸（用于顶部独立预览行），可能不在当前分类/分页列表中
  const selectedItem: WallpaperItem | null = selectedKey
    ? (() => {
        const found = items.find(
          (it) => (it.thumbnailUrl ?? it.imageUrl) === selectedKey,
        );
        if (found) return found;
        // 选中项不在当前列表：构造预览项
        return {
          id: '__selected__',
          title: '当前壁纸',
          imageUrl: selectedKey,
          thumbnailUrl: selectedKey,
        } as WallpaperItem;
      })()
    : null;

  return (
    <>
      {/* 顶部独立「当前壁纸」预览行（苹果风格） */}
      {selectedItem && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Check size={13} className="text-[color:var(--accent)]" />
            当前壁纸
          </div>
          <div className="flex gap-2">
            <ImageWallpaperCard
              item={{
                id: selectedItem.id,
                name: selectedItem.title,
                imageUrl: selectedItem.imageUrl,
                thumbnailUrl: selectedItem.thumbnailUrl,
              }}
              isSelected={false}
              onSelect={onSelect}
              compact
            />
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {totalPages > 1 && (
            <>
              <span className="tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                disabled={page <= 1 || loading}
                onClick={() => fetchWallpapers(page - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[var(--card-radius)] border border-black/10 transition-colors hover:text-[color:var(--accent)] disabled:opacity-40 dark:border-white/15"
                title="上一页"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => fetchWallpapers(page, selectedCat)}
            className="flex items-center gap-1 text-slate-500 transition-colors hover:text-[color:var(--accent)]"
            title="刷新"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          {totalPages > 1 && (
            <button
              disabled={page >= totalPages || loading}
              onClick={() => fetchWallpapers(page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--card-radius)] border border-black/10 transition-colors hover:text-[color:var(--accent)] disabled:opacity-40 dark:border-white/15"
              title="下一页"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
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
                isSelected={
                  item.imageUrl === selectedKey ||
                  item.thumbnailUrl === selectedKey
                }
                onSelect={onSelect}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="py-4 text-center text-xs ">暂无在线壁纸</p>
      )}
    </>
  );
};
