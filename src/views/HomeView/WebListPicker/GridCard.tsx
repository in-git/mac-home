import React, { useState } from 'react';
import { SiteItem } from '@/api/site';
import { gradientOf } from './cardParts';

/** 排行榜的两种口径 */
export type RankTab = 'latest' | 'hot';

export interface GridCardProps {
  /**
   * 「最新」榜数据：**顺序完全以接口返回为准**（数组第 1 个排最前，即名次 1）。
   * 组件内部不做任何排序，超出 `RANK_SIZE` 的条目会被截断。
   */
  latest?: SiteItem[];
  /**
   * 「最热」榜数据（点击量倒序），同样按接口返回顺序直接渲染、不做内部排序。
   *
   * 为 `undefined` 且当前 tab 为「最热」时：若 `onRankTabChange` 已提供，
   * 说明数据由外部按需拉取，此处渲染加载占位；否则回退用 `latest` 兜底，避免空白。
   */
  hot?: SiteItem[];
  /** 当前 tab（受控用法）；不传则由组件内部自持 */
  rankTab?: RankTab;
  /** 切换 tab 时回调：外部据此刻拉取对应榜单数据 */
  onRankTabChange?: (tab: RankTab) => void;
  /** 「最热」榜数据加载中（由外部按需拉取时告知） */
  rankLoading?: boolean;
  /** 点击某条目的回调 */
  onOpen?: (item: SiteItem) => void;
  /** 追加到根节点的类名（由调用方控制其在头条区中的起止位置） */
  className?: string;
}

/** 排行榜最多展示的条数 */
const RANK_SIZE = 5;

/** tabbar 各项：key 为口径，label 为展示文案 */
const RANK_TABS: { key: RankTab; label: string }[] = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '最热' },
];

/** 排行榜名次配色：前三名用强调色，其余为中性灰 */
function rankClass(rank: number): string {
  if (rank === 1) return 'bg-rose-500 text-white';
  if (rank === 2) return 'bg-amber-500 text-white';
  if (rank === 3) return 'bg-sky-500 text-white';
  return 'bg-slate-300 text-slate-600 dark:bg-slate-600 dark:text-slate-200';
}

/** 排行榜内单行：名次 + icon（加载失败回退首字母）+ 标题（单行截断） */
const RankRow: React.FC<{
  rank: number;
  item: SiteItem;
  onOpen?: (item: SiteItem) => void;
}> = ({ rank, item, onOpen }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onOpen?.(item)}
      role="button"
      tabIndex={0}
      aria-label={item.name}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(item);
        }
      }}
      className="flex min-h-0 flex-1 cursor-pointer items-center gap-2 px-3 hover:bg-black/5 dark:hover:bg-white/5"
    >
      {/* 名次：固定宽度，保证 icon 左边缘对齐 */}
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs font-semibold leading-none sm:h-[18px] sm:w-[18px] ${rankClass(rank)}`}
      >
        {rank}
      </span>
      {item.logo && !imgError ? (
        <img
          src={item.logo}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="h-4 w-4 shrink-0 rounded-full object-cover ring-1 ring-black/10 sm:h-[18px] sm:w-[18px] dark:ring-white/10"
        />
      ) : (
        <div
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-[18px] sm:w-[18px]"
          style={{ background: gradientOf(item) }}
        >
          {(item.name || '?').charAt(0).toUpperCase()}
        </div>
      )}
      <p className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200 sm:text-base">
        {item.name}
      </p>
    </div>
  );
};

/**
 * 排行榜卡：头条区右侧「最新 / 最热」榜单。
 *
 * 结构与职责都很单一 —— 顶部 tabbar + 其下**排行榜样式的列表**（名次 + icon + 标题），
 * 最多 `RANK_SIZE` 条。
 *
 * 在宫格中占几格由外部传入的 `className` 决定（见 `FEATURED_GRID_CARD_CLASS`）：
 * 移动端跨 2 行独占左列，lg 起只占左上角单格。本组件不感知视口、不做响应式分支。
 *
 * 两榜数据分别来自 `latest`（按发布时间）与 `hot`（按点击量），顺序都
 * **直接使用接口返回的顺序**（排序字段 / 方向由调用方在请求里指定），
 * 组件内部不做任何排序，避免与后端口径不一致。
 *
 * tab 状态为**非受控**：未传 `rankTab` 时组件内部自持。
 * 一旦传入 `onRankTabChange`，外部即可据此刻拉取「最热」数据，
 * 未提供时退化为直接在前端用 `hot`（缺省时用 `latest`）渲染，保证开箱可用。
 *
 * 高度由外层网格决定（`h-full` 撑满），自身不设宽高比。
 */
export const GridCard: React.FC<GridCardProps> = ({
  latest,
  hot,
  rankTab,
  onRankTabChange,
  rankLoading = false,
  onOpen,
  className = '',
}) => {
  // 非受控兜底：外部未接管时组件自持 tab 状态
  const [innerTab, setInnerTab] = useState<RankTab>('latest');
  const activeTab = rankTab ?? innerTab;

  const handleTabChange = (tab: RankTab) => {
    if (tab === activeTab) return;
    setInnerTab(tab);
    onRankTabChange?.(tab);
  };

  // 「最热」数据由外部按需拉取（传了 onRankTabChange）且尚未返回时，展示占位而非兜底数据
  const hotPending = activeTab === 'hot' && hot === undefined && !!onRankTabChange;
  const source = activeTab === 'hot' ? hot ?? latest : latest;
  const rows = (source ?? []).slice(0, RANK_SIZE);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-md border border-black/5 bg-slate-100 dark:border-white/5 dark:bg-white/5 ${className}`}
    >
      {/* tabbar：最新 / 最热 切换（字号与内边距跟随卡片尺寸，移动端略收）。
          按钮固定不换行、不收缩；容器在极窄宽度下允许横向滚动兜底，
          避免出现「最新」竖排或省略号 */}
      <div
        role="tablist"
        className="flex shrink-0 items-center gap-4 overflow-x-auto border-b border-black/5 px-3 py-2.5 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-3.5 sm:py-3 dark:border-white/10"
      >
        {RANK_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTabChange(tab.key)}
              className={`relative shrink-0 cursor-pointer whitespace-nowrap text-sm font-semibold leading-none transition-colors sm:text-base ${
                active
                  ? 'text-[color:var(--accent)]'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              {/*
                选中态下划线：绝对定位在**按钮自身**底部，不占据布局，
                切换时不会引起文字跳动。
                按钮必须带 `relative`，否则会向上找到卡片的定位祖先，
                下划线被拉伸到整卡宽度、成为一条横穿卡片的蓝线。
                偏移量 = tabbar 的 padding-bottom，使下划线正好压在分隔线上。
              */}
              {active && (
                <span className="absolute inset-x-0 -bottom-[11px] h-[3px] rounded-full bg-[color:var(--accent)] sm:-bottom-[13px]" />
              )}
            </button>
          );
        })}
      </div>

      {/* 榜单列表：加载占位 / 空态 / 正常行 */}
      <div className="flex min-h-0 flex-1 flex-col">
        {rankLoading || hotPending ? (
          <div className="flex flex-1 flex-col justify-center gap-2 px-3.5">
            {Array.from({ length: RANK_SIZE }).map((_, idx) => (
              <div
                key={idx}
                className="h-4 w-full animate-pulse rounded bg-black/5 sm:h-[18px] dark:bg-white/10"
              />
            ))}
          </div>
        ) : rows.length > 0 ? (
          rows.map((item, idx) => (
            <RankRow
              key={`${activeTab}-${item.id || item.link || `${item.name}-${idx}`}`}
              rank={idx + 1}
              item={item}
              onOpen={onOpen}
            />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
};

export default GridCard;
