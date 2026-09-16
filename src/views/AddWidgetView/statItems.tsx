import { Globe, Radio, Video } from 'lucide-react';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

/** 统计项数值格式化：过万按「万」缩写，其余千分位 */
export function formatCount(n?: number): string {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return '-';
  if (n < 10000) return n.toLocaleString('zh-CN');
  return `${(n / 10000).toFixed(1)} 万`;
}

export interface StatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  /** 图标底色（苹果系统色），用于图标容器的渐变 */
  tone: string;
  /** 实时项：额外显示呼吸圆点 */
  live?: boolean;
}

/**
 * 由原始数据拼装统计项。
 *
 * 只保留「在线人数 / 网页总数 / 视频总数」三项：
 * 今日 / 周 / 月访客这类 UV 数据已移除，不再展示（接口仍会返回，但不再取用）。
 * 三项正好铺满 3 列网格的一行。
 */
export function buildStatItems(
  stats: {
    online: number | null;
    siteTotal: number;
    videoTotal: number;
  },
  /** WebSocket 是否实时连通：决定在线人数是否显示呼吸指示 */
  wsLive = false,
): StatItem[] {
  return [
    {
      label: '在线人数',
      value: formatCount(stats.online ?? undefined),
      icon: Radio,
      tone: 'from-green-400 to-emerald-500',
      live: wsLive,
    },
    {
      label: '网页总数',
      value: formatCount(stats.siteTotal),
      icon: Globe,
      tone: 'from-emerald-400 to-teal-500',
    },
    {
      label: '视频总数',
      value: formatCount(stats.videoTotal),
      icon: Video,
      tone: 'from-sky-400 to-blue-500',
    },
  ];
}

/**
 * 单项：纵向的网格单元（图标 / 数值 / 标签），用于 3 列统计网格。
 *
 * 早先是横向的列表行（图标 + 标签 —— 数值），改为网格后单行空间不够，
 * 所以改成纵向堆叠：数值最显眼，标签作为说明放在下方。
 *
 * 单元宽度在窄侧栏（约 60px）到移动端整宽（约 110px）之间变化，
 * 故文字用 `truncate` + `text-center` 保证任何宽度下都不溢出。
 */
export const StatCell: React.FC<{ item: StatItem }> = ({ item }) => {
  const Icon = item.icon;
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg px-0.5 py-2">
      <span
        className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br ${item.tone} text-white shadow-sm`}
      >
        <Icon size={14} strokeWidth={2.2} />
        {/* 实时项：右上角呼吸小圆点 */}
        {item.live && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
          </span>
        )}
      </span>
      <span className="w-full truncate text-center text-sm font-semibold tabular-nums text-[#1D1D1F]">
        {item.value}
      </span>
      <span className="w-full truncate text-center text-[11px] leading-tight text-[#86868B]">
        {item.label}
      </span>
    </div>
  );
};
