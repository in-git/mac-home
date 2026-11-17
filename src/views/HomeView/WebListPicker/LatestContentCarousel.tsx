import React from 'react';
import { SiteItem } from '@/api/site';
import latestContentTitle from '@/assets/最新内容.webp';
import { SiteCard } from './SiteCard';
import {
  GridBreakpoint,
  useLoadMoreRows,
  ViewMoreTile,
} from './LoadMoreGrid';

/** 各断点列数，须与下方网格类名一致：<lg 2 列、lg 4 列、2xl 5 列 */
const BREAKPOINTS: GridBreakpoint[] = [
  { cols: 2, hideBelow: '' },
  { cols: 4, hideBelow: 'max-lg:hidden' },
  { cols: 5, hideBelow: 'max-2xl:hidden' },
];

interface LatestContentCarouselProps {
  items: SiteItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void | Promise<void>;
  onOpen: (item: SiteItem) => void;
  favoritedOf: (item: SiteItem) => boolean;
  onToggleFavorite?: (item: SiteItem) => void;
}

/** 最新内容：按创建时间倒序的站点卡片网格。 */
export const LatestContentCarousel: React.FC<LatestContentCarouselProps> = ({
  items,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpen,
  favoritedOf,
  onToggleFavorite,
}) => {
  const { visibleItems, classNameFor, handleLoadMore, showMore } =
    useLoadMoreRows(items, { breakpoints: BREAKPOINTS, hasMore, loadingMore, onLoadMore });

  return (
    <section aria-label="最新内容" className="mb-4 xl:mb-5 2xl:mb-8">
      <div className="mb-3 flex justify-center sm:mt-12 sm:mb-8">
        <img
          src={latestContentTitle}
          alt="最新内容"
          className="h-18 w-auto object-contain sm:h-32"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:gap-5 2xl:grid-cols-5 2xl:gap-8">
        {visibleItems.map((item, idx) => (
          <SiteCard
            key={item.id || item.link || `${item.name}-${idx}`}
            item={item}
            onOpen={onOpen}
            favorited={favoritedOf(item)}
            onToggleFavorite={onToggleFavorite}
            className={classNameFor(idx)}
            mobileImageOnly
          />
        ))}
        {showMore && (
          <ViewMoreTile
            loading={loadingMore}
            onClick={handleLoadMore}
            label="查看更多最新内容"
          />
        )}
      </div>
    </section>
  );
};

export default LatestContentCarousel;
