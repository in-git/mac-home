import React from 'react';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import { CARD_ROOT_CLASS, gradientOf } from './cardParts';

/**
 * 游戏项：只关心「一张图 + 一个跳转/点击」，不做站点那套信息展示。
 */
export interface GameItem {
  /** 唯一标识，用作列表 key */
  id?: string;
  /** 游戏名称，用于 alt 与首字回退 */
  name: string;
  /** 封面图（纯图卡片的主视觉），缺省时回退 logo */
  cover?: string;
  /** LOGO，cover 缺失时作为兜底图 */
  logo?: string;
  /** 跳转链接 */
  link?: string;
}

export interface GameCardProps {
  item: GameItem;
  /** 点击卡片回调；缺省时若有 link 则新窗口打开 */
  onOpen?: (item: GameItem) => void;
  /** 追加到根节点的类名（用于网格跨列/起止位置等布局控制） */
  className?: string;
}

/**
 * 游戏卡片：**纯图片**，2×2 方形（aspect-square），不渲染任何文字信息条、
 * 角标或收藏按钮，专用于游戏区的陈列。
 *
 * 与站点卡片（SiteCard / SiteTileCard / SiteHeroCarousel）的区别：
 * - 无信息条、无信号条 / 浏览量 / NEW / 收藏按钮，视觉上只有封面
 * - 固定 1:1 方形，便于「2×2」这类等分宫格排布
 *
 * 图片缺失或加载失败时，回退为渐变底 + 名称首字母，避免出现空白卡片。
 */
export const GameCard: React.FC<GameCardProps> = ({
  item,
  onOpen,
  className = '',
}) => {
  const coverSrc = item.cover || item.logo;
  // 打开逻辑：优先走调用方回调；缺省时新窗口打开
  const handleOpen = () => {
    if (onOpen) {
      onOpen(item);
      return;
    }
    if (item.link) window.open(item.link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      aria-label={item.name}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={`${CARD_ROOT_CLASS} aspect-square w-full ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
        {coverSrc ? (
          <LazyImage
            src={coverSrc}
            alt={item.name}
            ratio="fill"
            fit="cover"
            fullWidth
            rounded="rounded-none"
            className="bg-transparent transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex h-full w-full items-center justify-center text-3xl font-bold text-white"
            style={{ background: gradientOf({ name: item.name } as never) }}
          >
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCard;
