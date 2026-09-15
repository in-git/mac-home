import { ShieldCheck } from 'lucide-react';
import React from 'react';
import { buildStatItems, StatRow } from './statItems';
import { useSiteStats } from './useSiteStats';

/**
 * 侧边栏底部：访客统计 + 备案信息。
 * 整体采用苹果「设置」分组风格：细分隔线 + 次级灰文本，备案区不再使用黑底块。
 * 统计加载失败时只展示备案信息。
 */
export const SidebarFooter: React.FC = () => {
  const { stats, wsLive } = useSiteStats();
  const items = stats ? buildStatItems(stats, wsLive) : [];

  return (
    <div className="shrink-0 border-t border-black/[0.06] dark:border-white/[0.08]">
      {/* 访客统计：图标 + 文本 + 数值 */}
      {items.length > 0 && (
        <div className="px-2 pb-1 pt-2">
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-[#86868B] dark:text-[#98989D]">
            站点数据
          </p>
          <div className="space-y-0.5">
            {items.map((item) => (
              <StatRow key={item.label} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* 备案信息：苹果次级文本风格 */}
      <div className="space-y-1 border-t border-black/[0.06] text-xs px-4 py-3 dark:border-white/[0.08]">
        <a
          href="https://beian.mps.gov.cn/#/query/webSearch?code=44011202003613"
          target="_blank"
          rel="noopener noreferrer"
          title="粤公网安备44011202003613号"
          className="group flex items-center gap-1.5  leading-relaxed text-[#86868B] transition-colors hover:text-[color:var(--accent)] dark:text-[#98989D]"
        >
          <ShieldCheck size={13} className="shrink-0" />
          <span className="truncate group-hover:underline">
            粤公网安备44011202003613号
          </span>
        </a>
        <p className=" leading-relaxed text-[#A1A1A6] dark:text-[#6E6E73]">
          © {new Date().getFullYear()} 吴文龙的个人主页
        </p>
      </div>
    </div>
  );
};

export default SidebarFooter;
