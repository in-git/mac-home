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
 * 头条区宫格卡片：封面铺满整卡高度（由外部行高决定）。
 * 移动端纯图展示（不渲染信息条，仅保留收藏按钮与点击量、标题浮在封面底部）；
 * lg 起显示底部信息条（Logo / 标题）。
 * 与 SiteCard 的区别在于封面不按 16:9 固定，故独立成组件而不混用。
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
            className="absolute inset-0 flex h-full w-full items-center justify-center text-white text-2xl sm:text-3xl font-bold"
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

      {/*
        移动端：纯图，标题以轻量浮层压在封面底部。
        本卡小于 lg 时没有独立信息条，标题就在这个浮层里，
        因此 NEW 角标也放在此处，与 lg 起的信息条保持同样位置。
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/75 to-transparent px-2 pb-2 pt-8 lg:hidden">
        <div className="flex min-w-0 items-start gap-1.5">
          <p className="truncate text-sm font-medium text-white">{item.name}</p>
          {showNew && <NewBadge />}
        </div>
      </div>

      <div className="relative hidden p-2 sm:p-2.5 lg:flex items-center gap-3 text-left">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <SiteAvatar item={item} />
          <div className="flex flex-col justify-center min-w-0 max-w-full w-fit">
            {/* 标题：字号移动端 14px（text-sm），桌面端 18px */}
            <p className="truncate text-sm sm:text-lg max-w-full">
              {item.name}
            </p>
          </div>
        </div>
        {/* NEW 跟在标题行右侧（self-start 对齐行顶，即「标题右上角」） */}
        {showNew && <NewBadge className="self-start" />}
      </div>
    </div>
  );
};

export default SiteTileCard;
