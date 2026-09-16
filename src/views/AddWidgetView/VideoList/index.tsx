import { Film, Loader2, Menu, Search } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VideoItem } from '@/api/video';
import { useVideoList } from '@/agent/request';
import { Button } from '@/components/Button/Button';
import { useScrollDirection } from '../useScrollDirection';
import { VideoCard } from './VideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';

/**
 * 视频列表排序（实测后端契约）。
 *
 * 后端只识别 **小写** `ascend` / `descend`：
 * 传 DESC / desc / DESCEND / ASCEND 一律返回 500「不支持该排序方式：xxx」。
 * 按创建时间倒序 → 最新视频排最前。
 */
const SORT_FIELD = 'createTime';
const SORT_ORDER = 'descend';

/** 每页条数 */
const PAGE_SIZE = 20;

interface VideoListProps {
  /**
   * 分类栏显隐变化（随列表滚动方向折叠 / 展开），
   * 供父级联动其它元素（如移动端顶部导航）。
   */
  onVisibilityChange?: (visible: boolean) => void;
  /** 移动端：点击三横杠，由父级打开全屏菜单抽屉 */
  onOpenMenu?: () => void;
}

/**
 * 视频列表（照 B 站布局）：
 * 顶部为「三横杠 + 搜索框」筛选行，其下是常规视频网格（封面 + 标题 + 播放量），
 * 点击卡片弹出播放器。移动端三横杠与搜索框同排。
 */
export const VideoList: React.FC<VideoListProps> = ({
  onVisibilityChange,
  onOpenMenu,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKw, setDebouncedKw] = useState('');
  const [searchNonce, setSearchNonce] = useState(0);
  /** 当前播放的视频；null 表示未打开播放器 */
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  const {
    items,
    loading,
    appendLoading,
    hasMore,
    fetchVideos,
    loadMore,
  } = useVideoList({
    autoFetch: false,
    defaultSortField: SORT_FIELD,
    defaultSortOrder: SORT_ORDER,
  });

  // 搜索变化时重新拉取首页
  useEffect(() => {
    fetchVideos(1, debouncedKw, PAGE_SIZE, SORT_FIELD, SORT_ORDER);
  }, [debouncedKw, searchNonce, fetchVideos]);

  // 搜索关键词 400ms 防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKw(searchKeyword), 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 点击搜索按钮 / 回车：立即搜索（同步防抖值并递增 nonce）
  const handleSearchSubmit = () => {
    setDebouncedKw(searchKeyword);
    setSearchNonce((n) => n + 1);
  };

  // 滚动：触底加载 + 按方向折叠筛选行
  const scrollRef = useRef<HTMLDivElement>(null);
  const { visible: showFilter, onScroll: handleDirectionScroll } =
    useScrollDirection(scrollRef);

  useEffect(() => {
    onVisibilityChange?.(showFilter);
  }, [showFilter, onVisibilityChange]);

  const loadRafRef = useRef<number | null>(null);
  const handleLoadMore = useCallback(() => {
    if (loadRafRef.current) return;
    loadRafRef.current = requestAnimationFrame(() => {
      loadRafRef.current = null;
      const el = scrollRef.current;
      if (!el || appendLoading || !hasMore) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        loadMore(debouncedKw, PAGE_SIZE, SORT_FIELD, SORT_ORDER);
      }
    });
  }, [appendLoading, hasMore, loadMore, debouncedKw]);

  useEffect(
    () => () => {
      if (loadRafRef.current !== null) cancelAnimationFrame(loadRafRef.current);
    },
    [],
  );

  const handleScroll = useCallback(() => {
    handleDirectionScroll();
    handleLoadMore();
  }, [handleDirectionScroll, handleLoadMore]);

  // 折叠态（向下滚动）：筛选行收窄
  const compact = !showFilter;

  return (
    <div className="flex h-full flex-col">
      {/* 筛选行：移动端「三横杠 + 搜索框」同排，桌面端仅搜索框且 50% 宽居中 */}
      <div
        className={`space-y-3 border-b border-black/5 px-5 transition-[padding] duration-300 ease-out dark:border-white/10 ${
          compact ? 'py-2' : 'py-4'
        }`}
      >
        <div className="mx-auto flex w-full items-center gap-2 sm:w-1/2">
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="打开菜单"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-slate-600 transition-colors hover:bg-black/10 active:scale-95 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20 sm:hidden"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
              placeholder="搜索视频"
              className={`w-full rounded-full bg-black/5 outline-none ring-[color:var(--accent)]/40 transition-[padding,font-size] duration-300 ease-out focus:ring-2 dark:bg-white/10 ${
                compact ? 'pl-4 pr-12 py-1.5' : 'pl-5 pr-14 py-3.5 text-base'
              }`}
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              disabled={loading}
              aria-label="搜索"
              className={`absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 text-white transition-[width,height] duration-300 ease-out hover:brightness-110 active:scale-95 disabled:opacity-60 ${
                compact ? 'h-7 w-7' : 'h-10 w-10'
              }`}
            >
              {loading ? (
                <Loader2 size={compact ? 15 : 18} className="animate-spin" />
              ) : (
                <Search size={compact ? 15 : 18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 视频网格 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto p-5"
      >
        {loading && items.length === 0 ? (
          <div className="flex min-h-[320px] h-40 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--accent)] border-t-transparent" />
              <span className="text-slate-400">加载中…</span>
            </div>
          </div>
        ) : items.length > 0 ? (
          <>
            {/* B 站式响应式网格：移动端 1 列，逐级到 4 列 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
              {items.map((item) => (
                <VideoCard key={item.id} item={item} onPlay={setPlaying} />
              ))}
            </div>

            <div className="flex justify-center py-4">
              {appendLoading ? (
                <span className="text-slate-400">加载中…</span>
              ) : hasMore ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    loadMore(debouncedKw, PAGE_SIZE, SORT_FIELD, SORT_ORDER)
                  }
                >
                  加载更多
                </Button>
              ) : (
                <span className="text-slate-400">没有更多了</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] h-40 flex-col items-center justify-center gap-2">
            <Film size={36} strokeWidth={1} />
            <p className="text-base">暂无视频</p>
          </div>
        )}
      </div>

      <VideoPlayerModal item={playing} onClose={() => setPlaying(null)} />
    </div>
  );
};

export default VideoList;
