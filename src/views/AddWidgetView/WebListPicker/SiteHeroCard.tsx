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

type SiteHeroCardProps = SiteCardBaseProps;

/**
 * 头条区超大卡片：整卡铺满封面（2:1），底部渐变浮层承载 Logo / 标题 / 描述 / 点击量。
 * 高度由列宽按 2:1 推导，右侧四宫格跟随它撑满同高。
 */
export const SiteHeroCard: React.FC<SiteHeroCardProps> = ({
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
      className={`${CARD_ROOT_CLASS} aspect-[2/1] w-full`}
    >
      <div className="absolute inset-0 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
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
            className="absolute inset-0 flex h-full w-full items-center justify-center text-white text-5xl font-bold"
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
      </div>

      {/* 信息以渐变浮层压在封面上 */}
      {/* 字号：标题移动端 14px、桌面端 24px；描述移动端 12px、桌面端 16px */}
      <div className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12 sm:px-4 sm:pb-4 sm:pt-16 text-white">
        <div className="flex items-end gap-2 sm:gap-3">
          <SiteAvatar item={item} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            {showNew ? (
              <div className="flex min-w-0 max-w-full w-fit items-center gap-1.5">
                <p className="truncate text-sm font-semibold sm:text-2xl">
                  {item.name}
                </p>
                <NewBadge />
              </div>
            ) : (
              <p className="truncate text-sm font-semibold sm:text-2xl">
                {item.name}
              </p>
            )}
            {item.des && (
              <p className="mt-0.5 line-clamp-2 text-xs text-white/80 sm:mt-1 sm:text-base">
                {item.des}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex sm:mt-3">
          <CountBadge count={item.count} />
        </div>
      </div>
    </div>
  );
};

export default SiteHeroCard;
