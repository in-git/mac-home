import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  wallpaperApi,
  WallpaperCategory,
  WallpaperItem,
} from '../../api/wallpaper';
import { PRESET_DATA } from '../../data/presetData';
import type { WallpaperConfig } from '../../types';

interface StaticWallpaperSectionProps {
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
}

/** 静态壁纸面板组件：支持分类筛选、在线壁纸列表分页以及本地预设壁纸 */
export const StaticWallpaperSection: React.FC<StaticWallpaperSectionProps> = ({
  wallpaper,
  onUpdateWallpaper,
}) => {
  const [categories, setCategories] = useState<WallpaperCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 加载壁纸分类列表
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

  const handleSelectWallpaper = (item: WallpaperItem) => {
    // 异步更新下载量
    wallpaperApi.recordDownload(item.id).catch(() => {});

    // thumbnailUrl 仅用于列表预览，实际壁纸用 imageUrl
    onUpdateWallpaper({
      type: 'static',
      imageUrl: item.imageUrl || item.thumbnailUrl,
      dynamicPreset: undefined,
    });
  };

  return (
    <section className="space-y-4">
      {/* 顶部分类 Tab 与刷新按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedCat('')}
            className={`rounded-lg px-2.5 py-1 transition-colors ${
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
              className={`rounded-lg px-2.5 py-1 transition-colors ${
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

      {/* 在线壁纸列表 */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">
          壁纸库
        </h4>
        {loading && items.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-slate-400">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((item) => {
                const imgSrc = item.thumbnailUrl || item.imageUrl;
                const isSelected =
                  wallpaper.type === 'static' &&
                  (wallpaper.imageUrl === item.imageUrl ||
                    wallpaper.imageUrl === item.thumbnailUrl);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectWallpaper(item)}
                    className={`group relative  min-h-[162px] overflow-hidden rounded-lg border bg-black/5 transition-transform dark:bg-white/5 ${
                      isSelected
                        ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                        : 'border-black/10 dark:border-white/10 overflow-hidden'
                    }`}
                    title={item.title}
                  >
                    {imgSrc && (
                      <img
                        src={imgSrc}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover hover:scale-105 transition-transform"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="truncate text-left text-font-sm font-medium text-white">
                        {item.title}
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
              })}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-end space-x-2 text-xs text-slate-500">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => fetchWallpapers(page - 1)}
                  className="rounded-md border px-2 py-1 disabled:opacity-40"
                >
                  上一页
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => fetchWallpapers(page + 1)}
                  className="rounded-md border px-2 py-1 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="py-4 text-center text-xs text-slate-400">
            暂无在线壁纸
          </p>
        )}
      </div>

      {/* 本地预设壁纸 */}
      <div className="pt-2">
        <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">
          系统预设
        </h4>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {PRESET_DATA.STATIC_WALLPAPERS.map((w) => {
            const isSelected =
              wallpaper.type === 'static' &&
              wallpaper.gradient === w.gradient &&
              (wallpaper.imageUrl ?? '') === (w.url ?? '');
            return (
              <button
                key={w.id}
                onClick={() =>
                  onUpdateWallpaper(
                    w.url
                      ? {
                          type: 'static',
                          gradient: w.gradient,
                          imageUrl: w.url,
                          dynamicPreset: undefined,
                        }
                      : {
                          type: 'static',
                          gradient: w.gradient,
                          imageUrl: undefined,
                          dynamicPreset: undefined,
                        },
                  )
                }
                className={`relative aspect-[4/3] overflow-hidden rounded-lg border transition-[transform,colors] ${
                  isSelected
                    ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                    : 'border-black/10 hover:scale-105 dark:border-white/10'
                }`}
                style={{ background: w.gradient }}
                title={w.name}
              >
                {w.url && (
                  <img
                    src={w.url}
                    alt={w.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {isSelected && (
                  <span className="absolute inset-0 inline-flex items-center justify-center bg-black/30">
                    <span className="rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-font-sm font-semibold text-white">
                      当前
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
