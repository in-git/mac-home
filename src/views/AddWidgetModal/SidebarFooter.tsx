import { ShieldCheck } from 'lucide-react';
import React from 'react';

/**
 * 左侧栏底部备案信息（黑底）：仅桌面端展示（移动端侧栏为横向条，隐藏）。
 */
export const SidebarFooter: React.FC = () => (
  <div className="hidden sm:block shrink-0 bg-black px-3 py-3">
    <a
      href="https://beian.mps.gov.cn/#/query/webSearch?code=44011202003613"
      target="_blank"
      rel="noopener noreferrer"
      title="粤公网安备44011202003613号"
      className="flex items-center gap-1.5 text-[11px] leading-relaxed text-white/75 transition-colors hover:text-white hover:underline"
    >
      <ShieldCheck size={13} className="shrink-0" />
      粤公网安备44011202003613号
    </a>
    <p className="mt-1 text-[11px] leading-relaxed text-white/40">
      © {new Date().getFullYear()} 吴文龙的个人主页
    </p>
  </div>
);

export default SidebarFooter;
