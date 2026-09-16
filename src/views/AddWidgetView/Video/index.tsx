import { Film } from 'lucide-react';
import React, { useState } from 'react';
import { VideoItem } from '@/api/video';
import { useVideoList } from '@/agent/request';
import { Button } from '@/components/Button/Button';
import { SearchBar } from '@/components/SearchBar';
import { SortBar, SortOption } from '@/components/SortBar/SortBar';
import { useListScroll } from '../hooks/useListScroll';
import { useSearch } from '../hooks/useSearch';
import { VideoCard } from './VideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';

/**
 * 排序选项（实测后端契约）。
 *
 * 后端只识别 **小写** `ascend` / `descend`：
 * 传 DESC / desc / DESCEND / ASCEND 一律返回 500「不支持该排序方式：xxx」。
 */
const SORT_OPTIONS: SortOption[] = [
  { field: 'createTime', order: 'descend', label: '最新发布' },
  { field: 'createTime', order: 'ascend', label: '最早上架' },
  { field: 'count', order: 'descend', label: '播放最多' },
  { field: 'count', order: 'ascend', label: '播放最少' },
];

/** 默认排序：最新发布 */
const DEFAULT_SORT = SORT_OPTIONS[0];

/** 每页条数 */
const PAGE_SIZE = 20;

interface VideoListProps {
  /**
   * 筛选区显隐变化（随列表滚动方向折叠 / 展开），
   * 供父级联动移动端顶部导航。
   */
  onVisibilityChange?: (visible: boolean) => void;
  /** 移动端：点击三横杠，由父级打开全屏菜单抽屉 */
  onOpenMenu?: () => void;
}

/**
 * 视频模块（照 B 站布局）：
 * 顶部为「三横杠 + 搜索框」筛选行，其下是响应式视频网格（封面 + 标题 + 播放量），
 * 点击卡片弹出播放器。移动端三横杠与搜索框同排。
 */
export const VideoList: React.FC<VideoListProps> = ({
  onVisibilityChange,
  onOpenMenu,
}) => {
  /** 当前播放的视频；null 表示未打开播放器 */
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  /** 当前排序 */
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);
  const { keyword, setKeyword, debouncedKw, nonce, submit } = useSearch();

  const { items, loading, appendLoading, hasMore, fetchVideos, loadMore } =
    useVideoList({
      autoFetch: false,
      defaultSortField: DEFAULT_SORT.field,
      defaultSortOrder: DEFAULT_SORT.order,
    });

  // 搜索 / 排序变化时重新拉取首页
  React.useEffect(() => {
    fetchVideos(1, debouncedKw, PAGE_SIZE, sort.field, sort.order);
  }, [debouncedKw, nonce, sort, fetchVideos]);

  // 滚动：触底加载下一页 + 按方向折叠 / 展开筛选行（并通知父级）
  const { scrollRef, onScroll, scrollVisible: showFilter } = useListScroll({
    canReachBottom: !appendLoading && hasMore,
    onReachBottom: () => loadMore(debouncedKw, PAGE_SIZE, sort.field, sort.order),
    onVisibilityChange,
  });

  // 折叠态（向下滚动）：筛选行收窄
  const compact = !showFilter;

  // 聚焦搜索框时强制展开，避免排序行在输入过程中被折叠
  const [searchFocused, setSearchFocused] = useState(false);
  const sortVisible = showFilter || searchFocused;

  return (
    <div className="flex h-full flex-col">
      {/* 筛选区：移动端「三横杠 + 搜索框」同排，桌面端搜索框 50% 宽居中 */}
      <div
        className={`space-y-3 border-b border-black/5 px-5 transition-[padding] duration-300 ease-out dark:border-white/10 ${
          compact ? 'py-2' : 'py-4'
        }`}
      >
        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onSubmit={submit}
          placeholder="搜索视频"
          loading={loading}
          compact={compact}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onOpenMenu={onOpenMenu}
        />

        {/* 排序筛选行：向下滚动时折叠，向上滚动或聚焦搜索框时展开 */}
        <div
          aria-hidden={!sortVisible}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            sortVisible
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <SortBar
              options={SORT_OPTIONS}
              value={sort}
              onChange={setSort}
              compact={compact}
            />
          </div>
        </div>
      </div>

      {/* 视频网格 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
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
                    loadMore(debouncedKw, PAGE_SIZE, sort.field, sort.order)
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
