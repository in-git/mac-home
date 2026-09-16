import React from 'react';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

export { SidebarNav, CATEGORIES } from './SidebarNav';
export { SidebarFooter } from './SidebarFooter';
export { MobileMenuDrawer } from './MobileMenuDrawer';

interface SidebarProps {
  activeCategory: string;
  onSelect: (id: string) => void;
}

/**
 * 桌面端左侧栏：分类导航 + 底部访客统计 / 备案信息。
 * 仅桌面显示（sm 起），移动端由 MobileMenuDrawer 承担同等职责。
 */
export const Sidebar: React.FC<SidebarProps> = ({ activeCategory, onSelect }) => (
  <div className="hidden sm:flex flex-col bg-[#F2F2F7] dark:bg-[#2C2C2E] sm:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10">
    <SidebarNav activeCategory={activeCategory} onSelect={onSelect} />
    {/* 底部：访客统计 + 备案信息 */}
    <div className="mt-auto">
      <SidebarFooter />
    </div>
  </div>
);

export default Sidebar;
