import { Film } from 'lucide-react';
import React, { useState } from 'react';
import { VideoItem, videoApi } from '@/api/video';
import { useVideoList } from '@/agent/request';
import { Button } from '@/components/Button/Button';
import { SearchBar } from '@/components/SearchBar';
import { SortBar, SortOption } from '@/components/SortBar/SortBar';
import { useListScroll } from '../hooks/useListScroll';
import { useSearch } from '../hooks/useSearch';
import { VideoCard } from './VideoCard';
import { VideoCardCompact } from './VideoCardCompact';
import { VideoBanner } from './VideoBanner';
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

/** hero 右侧的普通卡片数量（PC 为 2 列 × 3 行） */
const HERO_COL_CARDS = 6;

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
 * 视频模块（对齐设计稿的 B 站式首页）：
 * 顶部为搜索 + 排序筛选区；
 * 其下左侧是 hero 大图（占 50% 宽），右侧 6 张普通卡片（3 列 × 2 行）；
 * 再往下是常规卡片网格。
 * 点击任意卡片：先上报点击量（`/public/video/click`），再弹出播放器。
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

  const { items, loading, appendLoading, hasMore, fetchVideos, loadMore, patchItem } =
    useVideoList({
      autoFetch: false,
      defaultSortField: DEFAULT_SORT.field,
      defaultSortOrder: DEFAULT_SORT.order,
    });

  // 搜索 / 排序变化时重新拉取首页
  React.useEffect(() => {
    fetchVideos(1, debouncedKw, PAGE_SIZE, sort.field, sort.order);
  }, [debouncedKw, nonce, sort, fetchVideos]);

  /**
   * 用户点击视频：先上报点击量（`/public/video/click` 使 count 自增），再打开播放器。
   * 上报是「尽力而为」：失败不阻塞播放，只记录 warn；
   * 同时本地 +1 让播放量立刻可见（服务端下次返回会覆盖为权威值）。
   */
  const handlePlay = React.useCallback(
    (item: VideoItem) => {
      setPlaying(item);
      videoApi
        .click(item.id)
        .then(() => patchItem(item.id, (v) => ({ count: (v.count ?? 0) + 1 })))
        .catch((err) => {
          console.warn('[video] 点击量上报失败', item.id, err);
        });
    },
    [patchItem],
  );

  /** 自动连播 / 「下一个」按钮：取列表中的下一个，末尾则回到第一个 */
  const playNext = React.useCallback(() => {
    setPlaying((current) => {
      if (!current || items.length === 0) return current;
      const idx = items.findIndex((v) => v.id === current.id);
      const next = items[(idx + 1) % items.length];
      // 同样上报点击量（播放下一个也算一次点击）
      videoApi
        .click(next.id)
        .then(() => patchItem(next.id, (v) => ({ count: (v.count ?? 0) + 1 })))
        .catch(() => {
          /* 上报失败不阻塞播放 */
        });
      return next;
    });
  }, [items, patchItem]);

  /** 移动端下滑手势：取列表中的上一个，开头则回到最后一个 */
  const playPrev = React.useCallback(() => {
    setPlaying((current) => {
      if (!current || items.length === 0) return current;
      const idx = items.findIndex((v) => v.id === current.id);
      // idx 为 -1（列表已刷新丢当前项）时也回退到最后一个，避免卡住
      const prev = items[(idx - 1 + items.length) % items.length];
      videoApi
        .click(prev.id)
        .then(() => patchItem(prev.id, (v) => ({ count: (v.count ?? 0) + 1 })))
        .catch(() => {
          /* 上报失败不阻塞播放 */
        });
      return prev;
    });
  }, [items, patchItem]);



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

  // 推荐区：第 1 条做左侧 hero，紧随的 6 条做右侧普通卡片；其余进下方网格
  const [bannerItem, ...restItems] = items;
  const compactItems = restItems.slice(0, HERO_COL_CARDS);
  const gridItems = restItems.slice(HERO_COL_CARDS);
  const showHero = !!bannerItem;

  return (
    <div className="flex h-full flex-col">
      {/* 筛选区：移动端「三横杠 + 搜索框」同排，桌面端搜索框 50% 宽居中 */}
      <div
        className={`border-b border-black/5 px-3 sm:px-5 transition-[padding] duration-300 ease-out dark:border-white/10 ${
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

        {/* 排序：向下滚动时折叠，向上滚动或聚焦搜索框时展开 */}
        <div
          aria-hidden={!sortVisible}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            sortVisible
              ? 'mt-3 grid-rows-[1fr] opacity-100'
              : 'mt-0 grid-rows-[0fr] opacity-0'
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

      {/* 内容区 */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex-1 overflow-y-auto p-3 sm:p-5"
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
            {/* 推荐区（PC）：hero 固定占 50% 宽度，右侧 6 张普通卡片（横向 3 列 × 2 行）占另一半，两栏等高。
                移动端纵向堆叠：hero 在上，6 张卡片 2 列排布。
                间距：仅 < sm 收紧（12px），sm 起恢复原值。 */}
            {showHero && (
              <div className="mb-4 grid grid-cols-1 gap-3 sm:gap-4 lg:mb-5 lg:grid-cols-2 lg:items-stretch lg:gap-5">
                {/* hero：按 2:1 铺满左栏 */}
                <div className="aspect-[2/1] w-full">
                  <VideoBanner items={[bannerItem]} onPlay={handlePlay} />
                </div>
                {/* 右侧 6 张普通卡片：PC 横向 3 列 × 2 行等分撑满（与 hero 等高），移动端 2 列 */}
                <div className="grid grid-cols-2 gap-3 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-3 lg:grid-rows-2 lg:gap-4">
                  {compactItems.map((item) => (
                    <VideoCardCompact
                      key={item.id}
                      item={item}
                      onPlay={handlePlay}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 常规网格：移动端 2 列，逐级到 4 列 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-4 xl:gap-x-5">
              {gridItems.map((item) => (
                <VideoCard key={item.id} item={item} onPlay={handlePlay} />
              ))}
            </div>

            <div className="flex justify-center py-5">
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

      <VideoPlayerModal
        item={playing}
        onClose={() => setPlaying(null)}
        // 自动连播：切到列表中的下一个视频，最后一个则回到第一个
        hasNext={items.length > 1}
        onNext={playNext}
        // 移动端竖向轮播：上一个视频
        hasPrev={items.length > 1}
        onPrev={playPrev}
        // 移动端竖向轮播直接以列表为数据源（原生滚动 + scroll-snap 吸附）
        items={items}
        // 滑到接近尾部自动加载下一页（与网页模块触底加载同构）
        hasMore={hasMore}
        loadingMore={appendLoading}
        onLoadMore={() =>
          loadMore(debouncedKw, PAGE_SIZE, sort.field, sort.order)
        }
      />
    </div>
  );
};

export default VideoList;
