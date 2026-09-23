import React, { useState } from 'react';
import { SiteItem } from '@/api/site';

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
   * 首页走聚合接口后两榜是一次性拿到的，故此处通常与 `latest` 同时就绪；
   * 数据尚未到达（`undefined`）时回退用 `latest` 兜底，避免空白。
   */
  hot?: SiteItem[];
  /** 当前 tab（受控用法）；不传则由组件内部自持 */
  rankTab?: RankTab;
  /** 切换 tab 时回调：外部可据此做埋点等副作用（数据已随聚合返回，无需再拉） */
  onRankTabChange?: (tab: RankTab) => void;
  /** 点击某条目的回调 */
  onOpen?: (item: SiteItem) => void;
  /** 追加到根节点的类名（由调用方控制其在头条区中的起止位置） */
  className?: string;
}

/** 排行榜最多展示的条数 */
const RANK_SIZE = 5;

/**
 * 榜单容器的 `flex` 份额，按 `RANK_SIZE` 取值。
 *
 * 卡片纵向被等分为 `RANK_SIZE + 1` 份：tabbar 占 1 份（`flex-1`），
 * 榜单容器占 `RANK_SIZE` 份（下方各行各自 `flex-1` 均分）。
 * 于是 tabbar 的高度 = 一行榜单的高度。
 *
 * 值必须写成**完整字面量类名**：Tailwind 静态扫描源码生成样式，
 * `flex-[${n}]` 这类模板串扫不到，生产构建会缺样式。
 * 因此这里按 `RANK_SIZE` 分档枚举，改条数时两处一起改。
 */
const RANK_ROWS_FLEX_CLASS: Record<number, string> = {
  3: 'flex-[3]',
  4: 'flex-[4]',
  5: 'flex-[5]',
  6: 'flex-[6]',
  7: 'flex-[7]',
};

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

/**
 * 排行榜内单行：名次 + 标题（单行截断）。
 *
 * 不展示站点 icon：榜单行高有限，圆头像会把文字挤窄，
 * 而这里真正要传达的是「名次 + 站点名」，名次色块已足够承担视觉锚点。
 */
const RankRow: React.FC<{
  rank: number;
  item: SiteItem;
  onOpen?: (item: SiteItem) => void;
}> = ({ rank, item, onOpen }) => (
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
    {/* 名次：固定宽度，保证各行文字左边缘对齐 */}
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-xs font-semibold leading-none sm:h-[18px] sm:w-[18px] ${rankClass(rank)}`}
    >
      {rank}
    </span>
    <p className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200 sm:text-base">
      {item.name}
    </p>
  </div>
);

/**
 * 排行榜卡：头条区右侧「最新 / 最热」榜单。
 *
 * 结构与职责都很单一 —— 顶部 tabbar + 其下**排行榜样式的列表**（名次 + 标题），
 * 最多 `RANK_SIZE` 条。
 *
 * 在宫格中占几格由外部传入的 `className` 决定（见 `FEATURED_GRID_CARD_CLASS`）：
 * 移动端跨 2 行独占左列，lg 起只占左上角单格。本组件不感知视口、不做响应式分支。
 *
 * 两榜数据分别来自 `latest`（按发布时间）与 `hot`（按点击量），顺序都
 * **直接使用接口返回的顺序**（排序口径由后端在聚合接口里定义），
 * 组件内部不做任何排序，避免与后端口径不一致。
 *
 * tab 状态为**非受控**：未传 `rankTab` 时组件内部自持。
 * 首页的 `latest` / `hot` 随聚合接口一次性返回，因此切换 tab 不需要等待，
 * 也无需外部再发请求；`onRankTabChange` 仅作为副作用（如埋点）的挂载点。
 *
 * 高度由外层网格决定（`h-full` 撑满），自身不设宽高比。
 */
export const GridCard: React.FC<GridCardProps> = ({
  latest,
  hot,
  rankTab,
  onRankTabChange,
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

  // 两榜随聚合接口一次性返回，切换 tab 不需要等待；数据未到时用 latest 兜底避免空白
  const source = activeTab === 'hot' ? hot ?? latest : latest;
  const rows = (source ?? []).slice(0, RANK_SIZE);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-md border border-black/5 bg-slate-100 dark:border-white/5 dark:bg-white/5 ${className}`}
    >
      {/*
        tabbar：最新 / 最热 切换。两个 tab 平分整行宽度（按钮 `flex-1`），文字居中。

        **高度与下方榜单行保持一致**：卡片是 `flex-col`，tabbar 与榜单容器
        （其下 N 行各 `flex-1`）按 `flex-1` 等比分配整卡高度，因此把 tabbar 也设为
        `flex-1`、并让榜单容器占 `RANK_SIZE` 份（`flex-[N]`），
        两侧即各得「整卡高度 ÷ (N+1)」—— tabbar 恰好等于一行榜单。

        注意不能用固定的 `pt/pb` 撑高：那样 tabbar 高度是常数，
        而榜单行高随卡片高度浮动（卡片高度由宫格拉伸决定），两者必然对不上。

        下划线用**绝对定位**贴在按钮底部：`absolute inset-x-0 bottom-0`。
        这是「贴底」最直接的做法，不依赖"剩余空间"。
        定位基准：按钮必须带 `relative`。若漏写，线会向上找到卡片祖先，
        `inset-x-0` 会把它拉伸到整卡宽度，成为一条横穿卡片的线（曾出现过）。
      */}
      <div
        role="tablist"
        className="flex flex-1 items-stretch border-b border-black/5 bg-white dark:border-white/10 dark:bg-white/10"
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
              className={`relative flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap text-center text-sm font-semibold transition-colors sm:text-base ${
                active
                  ? 'text-[color:var(--accent)]'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="leading-none">{tab.label}</span>
              {/* 下划线：紧贴按钮底边，宽度铺满该 tab，高度 2px（细线，不压住文字）。未选中时不渲染 */}
              {active && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[color:var(--accent)]" />
              )}
            </button>
          );
        })}
      </div>

      {/*
        榜单列表：空态 / 正常行。
        高度占 `RANK_SIZE` 份（下方每行 `flex-1` 均分），
        配合 tabbar 的 `flex-1`，整卡被等分为 (RANK_SIZE + 1) 份 ——
        因此 tabbar 的高度正好等于一行榜单（见上方 tabbar 注释）。

        **不在这里做加载态**：两榜随聚合接口一次性返回，调用方会等数据就绪后
        才渲染本卡（未就绪时显示的是 `SiteGridSkeleton`）。
        若在此再留一条骨架分支，聚合稍慢时就会在页面里单独冒出一块转圈的卡片 ——
        即「其他骨架都加载完了、排行榜还挂着一块」。
      */}
      <div
        className={`flex min-h-0 flex-col ${
          RANK_ROWS_FLEX_CLASS[RANK_SIZE] ?? 'flex-[5]'
        }`}
      >
        {rows.length > 0 ? (
          /*
            行高必须与 tabbar 一致，因此这里是「按 `RANK_SIZE` 等分」而非
            「按实际行数均分」：满 5 条时两种写法等价，但数据不足 5 条时，
            若让 3 行去均分 5 份空间，每行就会被撑高到 tabbar 的 5/3 倍，
            榜单行与 tabbar 立刻不等高。
            因此用固定 `basis-0 grow` + 等分容器，缺的行留白而非撑高其余行。
          */
          <div className="flex min-h-0 flex-1 flex-col">
            {Array.from({ length: RANK_SIZE }).map((_, idx) => {
              const item = rows[idx];
              return item ? (
                <RankRow
                  key={`${activeTab}-${item.id || item.link || `${item.name}-${idx}`}`}
                  rank={idx + 1}
                  item={item}
                  onOpen={onOpen}
                />
              ) : (
                // 占位行：撑住等分结构，不渲染内容
                <div key={`empty-${idx}`} className="min-h-0 flex-1" />
              );
            })}
          </div>
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
