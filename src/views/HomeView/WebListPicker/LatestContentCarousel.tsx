import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';

import { SiteItem } from '@/api/site';
import { IconButton } from '@/components/IconButton/IconButton';
import { SiteCard } from './SiteCard';

interface LatestContentCarouselProps {
  items: SiteItem[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void | Promise<void>;
  onOpen: (item: SiteItem) => void;
  favoritedOf: (item: SiteItem) => boolean;
  onToggleFavorite?: (item: SiteItem) => void;
}

/** 最新内容横向轮播：移动端 3 个，桌面端 4～5 个；末尾右滑时加载下一页。 */
export const LatestContentCarousel: React.FC<LatestContentCarouselProps> = ({
  items,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpen,
  favoritedOf,
  onToggleFavorite,
}) => {
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const pendingNextRef = useRef(false);

  const syncEdges = (instance: SwiperClass) => {
    setIsBeginning(instance.isBeginning);
    setIsEnd(instance.isEnd);
  };

  // 新一页追加完成后，向右移动一张，让新数据立即进入视野
  useEffect(() => {
    if (!pendingNextRef.current || !swiper) return;
    pendingNextRef.current = false;
    swiper.update();
    swiper.slideNext();
  }, [items.length, swiper]);

  const handleNext = () => {
    if (!swiper || loadingMore) return;
    if (!swiper.isEnd) {
      swiper.slideNext();
      return;
    }
    if (hasMore) {
      pendingNextRef.current = true;
      void onLoadMore();
    }
  };

  return (
    <section
      aria-labelledby="latest-content-title"
      aria-busy={loadingMore}
      className="mb-4 xl:mb-5 2xl:mb-8"
    >
      <div className="mb-3 flex items-center justify-between sm:mb-4">
        <h2 id="latest-content-title" className="text-base font-semibold sm:text-lg">
          最新内容
        </h2>
        <div className="flex items-center gap-2">
          <IconButton
            label="上一项最新内容"
            size="sm"
            icon={<ChevronLeft size={18} />}
            disabled={isBeginning}
            onClick={() => swiper?.slidePrev()}
          />
          <IconButton
            label="下一项最新内容"
            size="sm"
            icon={
              loadingMore ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <ChevronRight size={18} />
              )
            }
            disabled={loadingMore || (isEnd && !hasMore)}
            onClick={handleNext}
          />
        </div>
      </div>

      <Swiper
        className="w-full"
        slidesPerView={3}
        spaceBetween={12}
        speed={300}
        grabCursor
        breakpoints={{
          640: { spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 16 },
          1280: { slidesPerView: 4, spaceBetween: 20 },
          1536: { slidesPerView: 5, spaceBetween: 32 },
        }}
        onSwiper={(instance) => {
          setSwiper(instance);
          syncEdges(instance);
        }}
        onSlideChange={syncEdges}
        onUpdate={syncEdges}
      >
        {items.map((item, idx) => (
          <SwiperSlide
            key={item.id || item.link || `${item.name}-${idx}`}
            className="h-auto"
          >
            <SiteCard
              item={item}
              onOpen={onOpen}
              favorited={favoritedOf(item)}
              onToggleFavorite={onToggleFavorite}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default LatestContentCarousel;
