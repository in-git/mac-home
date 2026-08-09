import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  wallpaperApi,
  WallpaperCategory,
  WallpaperItem,
} from '../../api/wallpaper';
import { GlassTabs } from '../../components/GlassTabs';
import { PRESET_DATA } from '../../data/presetData';
import type { WallpaperConfig } from '../../types';

/** 壁纸卡片渲染项：在线壁纸（WallpaperItem）与系统预设（PresetStaticWallpaper）共用 */
type WallpaperCardItem = {
  id?: string;
  title?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  gradient?: string;
};

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
  const [sourceTab, setSourceTab] = useState<'online' | 'preset'>('online');

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

  const handleSelectWallpaper = (item: WallpaperCardItem) => {
    // 在线壁纸（带 id）异步更新下载量；系统预设以 gradient 为标识，无 id，跳过上报
    if (item.id) wallpaperApi.recordDownload(item.id).catch(() => {});

    // thumbnailUrl 仅用于列表预览，实际壁纸用 imageUrl；无图时用 gradient 兜底
    onUpdateWallpaper({
      type: 'static',
      imageUrl: item.imageUrl || item.thumbnailUrl,
      gradient: item.gradient,
      dynamicPreset: undefined,
    });
  };

  // 壁纸卡片统一渲染（在线壁纸与预设共用，均以 gradient 作为唯一标识）
  const renderWallpaperCard = (item: WallpaperCardItem) => {
    const imgSrc = item.thumbnailUrl || item.imageUrl;
    const isSelected =
      wallpaper.type === 'static' &&
      (wallpaper.imageUrl === item.imageUrl ||
        wallpaper.imageUrl === item.thumbnailUrl);
    const label = item.title ?? item.gradient ?? '';

    return (
      <button
        key={item.gradient ?? item.id}
        onClick={() => handleSelectWallpaper(item)}
        className={`group relative aspect-[16/9] overflow-hidden rounded-[var(--card-radius)] border transition-transform ${
          isSelected
            ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
            : 'border-black/10 hover:scale-105 dark:border-white/10'
        }`}
        title={label}
        style={
          !imgSrc && item.gradient ? { background: item.gradient } : undefined
        }
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

  return (
    <section className="space-y-4">
      {/* 壁纸来源 Tab：默认优先展示接口壁纸，预设作为本地兜底 */}
      <GlassTabs
        items={[
          { id: 'online', label: '在线壁纸' },
          { id: 'preset', label: '系统预设' },
        ]}
        activeKey={sourceTab}
        onChange={(key) => setSourceTab(key as 'online' | 'preset')}
      />

      {/* 在线壁纸：接口数据，支持分类与分页 */}
      {sourceTab === 'online' && (
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
            <div className="flex h-32 items-center justify-center text-slate-400">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map(renderWallpaperCard)}
              </div>

              {/* 分页控制 */}
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
            <p className="py-4 text-center text-xs text-slate-400">
              暂无在线壁纸
            </p>
          )}
        </>
      )}

      {/* 系统预设：静态图片壁纸 + 渐变兜底壁纸 */}
      {sourceTab === 'preset' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {PRESET_DATA.STATIC_IMAGE_WALLPAPERS.map(renderWallpaperCard)}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {PRESET_DATA.STATIC_WALLPAPERS.map(renderWallpaperCard)}
          </div>
        </div>
      )}
    </section>
  );
};
