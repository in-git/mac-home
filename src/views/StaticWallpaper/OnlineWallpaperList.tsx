import { Check, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
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
    (async () => {
      try {
        const res = await wallpaperApi.getCategoryList();
        if (Array.isArray(res)) setCategories(res);
      } catch {
        // ignore
      }
    })();
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
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallpapers(1, selectedCat);
  }, [selectedCat]);

  // 当前选中的壁纸（用于顶部独立预览行），可能不在当前分类/分页列表中
  const selectedItem: WallpaperItem | null = selectedKey
    ? (() => {
        const found = items.find((it) => it.id === selectedKey);
        if (found) return found;
        // 选中项不在当前列表：仅保留 id 与地址占位，用于顶部预览
        return {
          id: selectedKey,
          title: '当前壁纸',
          imageUrl: undefined,
          thumbnailUrl: undefined,
        } as WallpaperItem;
      })()
    : null;

  return (
    <>
      {/* 顶部独立「当前壁纸」预览行（苹果风格） */}
      {selectedItem && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs   ">
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
          <Button
            size="sm"
            variant={selectedCat === '' ? 'primary' : 'secondary'}
            onClick={() => setSelectedCat('')}
            className="!h-7 !px-2.5"
          >
            全部
          </Button>
          {categories.map((c) => (
            <Button
              key={c.value}
              size="sm"
              variant={selectedCat === c.value ? 'primary' : 'secondary'}
              onClick={() => setSelectedCat(c.value)}
              className="!h-7 !px-2.5"
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs ">
          {totalPages > 1 && (
            <>
              <span className="tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                iconOnly
                disabled={page <= 1 || loading}
                icon={<ChevronLeft size={14} />}
                onClick={() => fetchWallpapers(page - 1)}
                title="上一页"
                className="!h-7 !w-7"
              />
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={12} />}
            loading={loading}
            onClick={() => fetchWallpapers(page, selectedCat)}
            title="刷新"
            className="!h-7"
          >
            刷新
          </Button>
          {totalPages > 1 && (
            <Button
              size="sm"
              variant="secondary"
              iconOnly
              disabled={page >= totalPages || loading}
              icon={<ChevronRight size={14} />}
              onClick={() => fetchWallpapers(page + 1)}
              title="下一页"
              className="!h-7 !w-7"
            />
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
                isSelected={item.id === selectedKey}
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
