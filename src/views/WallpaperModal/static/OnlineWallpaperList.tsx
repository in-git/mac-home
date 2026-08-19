import { Heart, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../../../components/Button/Button';
import { wallpaperApi, WallpaperCategory, WallpaperItem } from '../../../api/wallpaper';
import { ImageWallpaperCard, type ImageWallpaperItem } from './ImageWallpaperCard';

/** 用户使用过的壁纸持久化 key */
const MY_WALLPAPER_KEY = 'my-wallpapers';

/** 我的壁纸项（与 ImageWallpaperItem 兼容，附带使用时间用于排序） */
interface MyWallpaperItem extends ImageWallpaperItem {
  usedAt: number;
}

/** 读取本地存储的「我的壁纸」 */
function readMyWallpapers(): MyWallpaperItem[] {
  try {
    const raw = localStorage.getItem(MY_WALLPAPER_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as MyWallpaperItem[]) : [];
  } catch {
    return [];
  }
}

/** 将使用过的壁纸记录到本地存储（去重 + 按使用时间倒序，最多保留 60 张） */
function saveMyWallpaper(item: ImageWallpaperItem): void {
  try {
    const list = readMyWallpapers();
    const next = list.filter((it) => it.id !== item.id);
    next.unshift({ ...item, usedAt: Date.now() });
    const trimmed = next.slice(0, 60);
    localStorage.setItem(MY_WALLPAPER_KEY, JSON.stringify(trimmed));
  } catch {
    // 忽略存储异常
  }
}

interface OnlineWallpaperListProps {
  /** 当前已选图片壁纸的标识（thumbnailUrl/imageUrl），用于高亮选中项 */
  selectedKey?: string;
  onSelect: (item: ImageWallpaperItem) => void;
}

/** 顶部 tab：全部 / 我的壁纸 / 各分类 */
type TabKey = 'all' | 'mine' | string;

/** 在线壁纸：接口数据，支持分类筛选与滚动触底加载 */
export const OnlineWallpaperList: React.FC<OnlineWallpaperListProps> = ({
  selectedKey,
  onSelect,
}) => {
  const [categories, setCategories] = useState<WallpaperCategory[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [items, setItems] = useState<WallpaperItem[]>([]);
  const [mineItems, setMineItems] = useState<ImageWallpaperItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [appendLoading, setAppendLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // 用 ref 保存最新分页值，避免回调闭包滞后导致并发重复加载
  const pageRef = useRef(page);
  const totalPagesRef = useRef(totalPages);
  const loadingRef = useRef(false);
  pageRef.current = page;
  totalPagesRef.current = totalPages;
  const hasMore = page < totalPages;
  const PAGE_SIZE = 20;

  const isMine = tab === 'mine';
  // 当前展示的数据源：我的壁纸为本地数据，其余为在线数据
  const displayItems: ImageWallpaperItem[] = isMine
    ? mineItems
    : items.map((item) => ({
        id: item.id,
        name: item.title,
        imageUrl: item.imageUrl,
        thumbnailUrl: item.thumbnailUrl,
      }));

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

  // 首屏/筛选加载：保留原数组，加载完成后整体替换
  const fetchWallpapers = async (p = 1, cat = selectedCat) => {
    setLoading(true);
    try {
      const res = await wallpaperApi.getPage({
        current: p,
        size: PAGE_SIZE,
        categoryTag: cat || undefined,
      });
      if (res && Array.isArray(res.records)) {
        setItems(res.records);
        setPage(res.current ?? p);
        pageRef.current = res.current ?? p;
        setTotalPages(res.pages ?? 1);
        totalPagesRef.current = res.pages ?? 1;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 触底加载：拉取下一页并追加（不清空）
  const loadMore = useCallback(async (cat = selectedCat) => {
    if (loadingRef.current) return;
    const next = pageRef.current + 1;
    if (next > totalPagesRef.current) return;
    loadingRef.current = true;
    setAppendLoading(true);
    try {
      const res = await wallpaperApi.getPage({
        current: next,
        size: PAGE_SIZE,
        categoryTag: cat || undefined,
      });
      if (res && Array.isArray(res.records)) {
        setItems((prev) => [...prev, ...res.records]);
        setPage(res.current ?? next);
        pageRef.current = res.current ?? next;
        setTotalPages(res.pages ?? 1);
        totalPagesRef.current = res.pages ?? 1;
      }
    } catch {
      // ignore
    } finally {
      setAppendLoading(false);
      loadingRef.current = false;
    }
  }, [selectedCat]);

  // 滚动触底自动加载
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el || isMine || appendLoading || !hasMore) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        loadMore(selectedCat);
      }
    });
  }, [appendLoading, hasMore, isMine, loadMore, selectedCat]);

  useEffect(() => {
    if (isMine) return;
    fetchWallpapers(1, selectedCat);
  }, [selectedCat, isMine]);

  // 切到「我的壁纸」时从本地存储加载
  useEffect(() => {
    if (isMine) setMineItems(readMyWallpapers());
  }, [isMine]);

  // 选中壁纸：记录到「我的壁纸」后再向上传递
  const handleSelect = useCallback(
    (item: ImageWallpaperItem) => {
      saveMyWallpaper(item);
      if (isMine) setMineItems(readMyWallpapers());
      onSelect(item);
    },
    [isMine, onSelect],
  );

  // 当前选中的壁纸若不在列表内，则构造占位项前置到列表最前面并高亮
  const leadingItem: ImageWallpaperItem | null =
    !isMine && selectedKey && !items.some((it) => it.id === selectedKey)
      ? { id: selectedKey, name: '当前壁纸', imageUrl: undefined, thumbnailUrl: undefined }
      : null;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Button
            size="sm"
            variant={isMine ? 'primary' : 'secondary'}
            icon={<Heart size={12} />}
            onClick={() => setTab('mine')}
            className="!h-7 !px-2.5"
          >
            我的壁纸
          </Button>
          <span className="mx-0.5 h-4 w-px bg-black/10 dark:bg-white/15" />
          <Button
            size="sm"
            variant={tab === 'all' ? 'primary' : 'secondary'}
            onClick={() => {
              setTab('all');
              setSelectedCat('');
            }}
            className="!h-7 !px-2.5"
          >
            全部
          </Button>
          {categories.map((c) => (
            <Button
              key={c.value}
              size="sm"
              variant={tab === c.value ? 'primary' : 'secondary'}
              onClick={() => {
                setTab(c.value);
                setSelectedCat(c.value);
              }}
              className="!h-7 !px-2.5"
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs ">
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={12} />}
            loading={loading}
            onClick={() =>
              isMine
                ? setMineItems(readMyWallpapers())
                : fetchWallpapers(1, selectedCat)
            }
            title="刷新"
            className="!h-7"
          >
            刷新
          </Button>
        </div>
      </div>

      {!isMine && loading && items.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : displayItems.length > 0 || leadingItem ? (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {leadingItem && (
              <ImageWallpaperCard
                key={leadingItem.id}
                item={leadingItem}
                isSelected
                onSelect={handleSelect}
              />
            )}
            {displayItems.map((item) => (
              <ImageWallpaperCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedKey}
                onSelect={handleSelect}
              />
            ))}
          </div>
          {/* 底部：我的壁纸为本地数据无分页；在线列表触底自动加载 */}
          {!isMine && (
            <div className="py-4 flex justify-center">
              {appendLoading ? (
                <span className="text-xs text-slate-400">加载中…</span>
              ) : hasMore ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => loadMore(selectedCat)}
                >
                  加载更多
                </Button>
              ) : (
                <span className="text-xs text-slate-400">没有更多了</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-slate-400">
          {isMine ? '还没有使用过的壁纸，去「全部」挑一张吧' : '没有数据'}
        </p>
      )}
    </div>
  );
};
