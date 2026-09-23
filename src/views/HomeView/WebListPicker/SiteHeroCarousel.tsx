import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import './SiteHeroCarousel.css';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/IconButton/IconButton';
import { SiteItem } from '@/api/site';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import { openSite } from '@/utils/siteHelper';
import {
  CardTopRightBar,
  CARD_ROOT_CLASS,
  gradientOf,
  isNewSite,
  NewBadge,
  SiteAvatar,
  SiteSignal,
} from './cardParts';

type SiteHeroCarouselProps = {
  items: SiteItem[];
  onOpen?: (item: SiteItem) => void;
  favoritedOf: (item: SiteItem) => boolean;
  onToggleFavorite: (item: SiteItem) => void;
  className?: string;
};

const AUTO_INTERVAL = 5000;

export const SiteHeroCarousel: React.FC<SiteHeroCarouselProps> = ({
  items,
  onOpen,
  favoritedOf,
  onToggleFavorite,
  className = '',
}) => {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);

  const clampedIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const item = items[clampedIndex];

  useEffect(() => {
    setIndex((i) => (i < count ? i : 0));
  }, [count]);

  if (!item || count === 0) return null;

  const showNew = isNewSite(item.createTime);
  const favorited = favoritedOf(item);
  const categoryName = item.categoryList?.map((c) => c.name).join(' / ') ?? '';

  return (
    <div className={`site-hero-carousel ${CARD_ROOT_CLASS} aspect-[2/1] w-full ${className}`}>
      <Swiper
        className="absolute inset-0 h-full w-full"
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={count > 1}
        grabCursor
        autoplay={{
          delay: AUTO_INTERVAL,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={count > 1 ? { clickable: true } : false}
        onSwiper={setSwiper}
        onSlideChange={(s: SwiperClass) => setIndex(s.realIndex)}
      >
        {items.map((it, i) => {
          const src = it.cover || it.logo;
          return (
            <SwiperSlide key={it.id || it.link || `${it.name}-${i}`}>
              <div
                role="button"
                tabIndex={0}
                aria-label={it.name}
                onClick={() => openSite(it, onOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSite(it, onOpen);
                  }
                }}
                className="relative h-full w-full cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
              >
                {src ? (
                  <LazyImage
                    src={src}
                    alt={it.name}
                    ratio="fill"
                    fit="cover"
                    rounded="rounded-md"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: gradientOf(it) }}
                    aria-hidden
                  />
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* 信息浮层：仅展示当前激活卡片 */}
      <div
        key={item.id}
        className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-end p-4 transition-opacity duration-500 sm:p-6"
      >
        <div className="pointer-events-auto max-w-[68%]">
          <div className="flex items-center gap-2">
            <SiteAvatar item={item} />
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-semibold text-white drop-shadow-sm sm:text-xl">
                  {item.name}
                </span>
                {showNew && <NewBadge />}
              </div>
              {categoryName && (
                <span className="text-xs font-medium text-white/80">
                  {categoryName}
                </span>
              )}
            </div>
          </div>

          {item.des && (
            <p className="mt-2 line-clamp-2 text-sm text-white/85 drop-shadow-sm">
              {item.des}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 text-xs text-white/75">
            <SiteSignal item={item} />
          </div>
        </div>
      </div>

      {/* 右上角计数 + 收藏 */}
      <CardTopRightBar
        item={item}
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
      />

      {/* 左右箭头：用项目 IconButton + lucide 箭头自绘（24px 图标 / 32px 浅黑圆底） */}
      {count > 1 && (
        <IconButton
          label="上一张"
          absolute
          className="!left-3 !right-auto z-10 h-8 w-8 bg-black/35 text-white hover:bg-black/55"
          icon={<ChevronLeft size={24} strokeWidth={2.5} />}
          onClick={() => swiper?.slidePrev()}
        />
      )}
      {count > 1 && (
        <IconButton
          label="下一张"
          absolute
          className="!right-3 !left-auto z-10 h-8 w-8 bg-black/35 text-white hover:bg-black/55"
          icon={<ChevronRight size={24} strokeWidth={2.5} />}
          onClick={() => swiper?.slideNext()}
        />
      )}
    </div>
  );
};
