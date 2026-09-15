import React from 'react';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import {
  CARD_ROOT_CLASS,
  CountBadge,
  FavoriteButton,
  gradientOf,
  isNewSite,
  NewBadge,
  SiteAvatar,
  SiteCardBaseProps,
} from './cardParts';

type SiteTileCardProps = SiteCardBaseProps;

/**
 * 头条区宫格卡片：封面铺满卡片剩余高度（由外部行高决定），底部为信息条。
 * 与 SiteCard 的区别只在封面是否按 16:9 固定，故独立成组件而不混用。
 */
export const SiteTileCard: React.FC<SiteTileCardProps> = ({
  item,
  onOpen,
  favorited = false,
  onToggleFavorite,
}) => {
  const coverSrc = item.cover || item.logo;
  const showNew = isNewSite(item.createTime);

  return (
    <div
      onClick={() => onOpen(item)}
      className={`${CARD_ROOT_CLASS} flex h-full min-h-[9rem] flex-col lg:min-h-0`}
    >
      {/* 封面区：可伸缩，占满除信息条外的剩余高度 */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={item.name}
            ratio="fill"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="absolute inset-0 flex h-full w-full items-center justify-center text-white text-3xl font-bold"
            style={{ background: gradientOf(item) }}
          >
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {onToggleFavorite && (
          <FavoriteButton
            item={item}
            favorited={favorited}
            onToggleFavorite={onToggleFavorite}
          />
        )}
        <span className="absolute bottom-2 right-2">
          <CountBadge count={item.count} />
        </span>
      </div>

      <div className="relative p-2.5 flex items-center gap-3 text-left">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <SiteAvatar item={item} />
          <div className="flex flex-col justify-center min-w-0 max-w-full w-fit">
            {showNew ? (
              <div className="flex items-center gap-1.5 min-w-0 max-w-full w-fit">
                <p className="truncate text-xl">{item.name}</p>
                <NewBadge />
              </div>
            ) : (
              <p className="truncate text-xl max-w-full">{item.name}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteTileCard;
