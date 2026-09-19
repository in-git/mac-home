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
  SiteMetaRow,
} from './cardParts';

type SiteCardProps = SiteCardBaseProps;

/**
 * 常规站点卡片：16:9 封面 + 底部信息条（Logo / 标题 / 描述）。
 * 仅负责网格中的普通卡片；头条区的大卡与宫格卡分别见 SiteHeroCard / SiteTileCard。
 */
export const SiteCard: React.FC<SiteCardProps> = ({
  item,
  onOpen,
  favorited = false,
  onToggleFavorite,
}) => {
  const coverSrc = item.cover || item.logo;
  // 是否为新站点（发布时间在 3 天内）
  const showNew = isNewSite(item.createTime);

  return (
    <div
      onClick={() => onOpen(item)}
      className={`${CARD_ROOT_CLASS} flex h-full flex-col`}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={item.name}
            ratio="16/9"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold"
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

      <div className="relative p-2 sm:p-2.5 flex items-center gap-3 text-left">
        {/* 左侧：Logo + 标题与描述 */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <SiteAvatar item={item} />
          {/* 文本区：宽度随内容自适应（w-fit），最长不超过可用宽度（max-w-full 后截断） */}
          <div className="flex flex-col justify-center min-w-0 max-w-full w-fit">
            {/* 标题：字号移动端 14px（text-sm），桌面端 18px */}
            <p className="truncate text-sm sm:text-lg max-w-full">
              {item.name}
            </p>
            {/* 描述为辅助富文本：移动端 12px（text-xs），桌面端 16px */}
            {item.des && (
              <p className="truncate text-xs  mt-0.5 sm:mt-1 max-w-full text-gray-500">
                {item.des}
              </p>
            )}
          </div>
        </div>
        {/*
          NEW 跟在标题行右侧（self-start 对齐到行顶，即「标题右上角」）。
          用 flex 子项而非绝对定位，避免浮在截断的标题文字上造成重叠。
        */}
        {showNew && <NewBadge className="self-start" />}
      </div>

      {/* 底部辅助信息行：信号强度 + 适用设备（字段缺失时整行不渲染） */}
      <SiteMetaRow item={item} />
    </div>
  );
};

export default SiteCard;
