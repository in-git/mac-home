import {
  CalendarDays,
  CalendarRange,
  Globe,
  Radio,
  Users,
} from 'lucide-react';
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

/** 由原始数据拼装统计项：图标 + 文本 + 数值 */
export function buildStatItems(
  stats: {
    online: number | null;
    today: number;
    week: number;
    month: number;
    total: number;
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
      label: '今日访客',
      value: formatCount(stats.today),
      icon: Users,
      tone: 'from-orange-400 to-rose-500',
    },
    {
      label: '周访客',
      value: formatCount(stats.week),
      icon: CalendarDays,
      tone: 'from-blue-400 to-indigo-500',
    },
    {
      label: '月访客',
      value: formatCount(stats.month),
      icon: CalendarRange,
      tone: 'from-purple-400 to-violet-500',
    },
    {
      label: '网页总数',
      value: formatCount(stats.total),
      icon: Globe,
      tone: 'from-slate-400 to-slate-500',
    },
  ];
}

/** 单项：小圆角渐变图标 + 文本 + 右侧数值，苹果「设置」列表风格 */
export const StatRow: React.FC<{ item: StatItem }> = ({ item }) => {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.06]">
      <span
        className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br ${item.tone} text-white shadow-sm`}
      >
        <Icon size={13} strokeWidth={2.2} />
        {/* 实时项：右上角呼吸小圆点 */}
        {item.live && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 ring-1 ring-white dark:ring-[#2C2C2E]" />
          </span>
        )}
      </span>
      <span className="flex-1 truncate text-[11px] text-[#86868B] dark:text-[#98989D]">
        {item.label}
      </span>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#1D1D1F] dark:text-white">
        {item.value}
      </span>
    </div>
  );
};
