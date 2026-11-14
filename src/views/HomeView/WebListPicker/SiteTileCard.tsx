import React from 'react';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import {
  CARD_ROOT_CLASS,
  CardTopRightBar,
  gradientOf,
  isNewSite,
  NewBadge,
  SiteAvatar,
  SiteCardBaseProps,
  SiteSignal,
} from './cardParts';

type SiteTileCardProps = SiteCardBaseProps;

/** Banner 旁的宫格卡片：封面弹性撑满，桌面端带底部信息条。 */
export const SiteTileCard: React.FC<SiteTileCardProps> = ({
  item,
  onOpen,
  favorited = false,
  onToggleFavorite,
  className = '',
}) => {
  const coverSrc = item.cover || item.logo;
  const showNew = isNewSite(item.createTime);

  return (
    <div
      onClick={() => onOpen(item)}
      className={`${CARD_ROOT_CLASS} flex h-full min-h-[7rem] flex-col lg:min-h-0 ${className}`}
    >
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={item.name}
            ratio="fill"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent transition-transform group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex h-full w-full items-center justify-center text-2xl font-bold text-white sm:text-3xl"
            style={{ background: gradientOf(item) }}
          >
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <CardTopRightBar
          item={item}
          favorited={favorited}
          onToggleFavorite={onToggleFavorite}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8 lg:hidden">
        <div className="flex min-w-0 items-center gap-1.5">
          <SiteSignal item={item} className="shrink-0" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
            {item.name}
          </p>
          {showNew && <NewBadge />}
        </div>
      </div>

      <div className="relative hidden flex-col p-2 text-left sm:p-2.5 lg:flex">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <SiteAvatar item={item} />
            <div className="flex w-fit min-w-0 max-w-full flex-col justify-center">
              <div className="flex min-w-0 items-center gap-1.5">
                <SiteSignal item={item} className="shrink-0" />
                <p className="max-w-full truncate text-sm sm:text-lg">
                  {item.name}
                </p>
              </div>
              {item.des && (
                <p className="mt-0.5 max-w-full truncate text-base text-gray-500 sm:mt-1">
                  {item.des}
                </p>
              )}
            </div>
          </div>
          {showNew && <NewBadge className="self-start" />}
        </div>
      </div>
    </div>
  );
};

export default SiteTileCard;
