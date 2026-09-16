import { Globe, Heart, Play } from 'lucide-react';
import React from 'react';

/** 侧边栏分类配置 */
export const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: 'mine',
    label: '我的',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-rose-400 to-pink-500 text-white">
        <Heart size={15} />
      </span>
    ),
  },
  {
    id: 'web',
    label: '网页',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
        <Globe size={15} />
      </span>
    ),
  },
  {
    id: 'video',
    label: '视频',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-sky-400 to-blue-500 text-white">
        <Play size={15} className="fill-current" />
      </span>
    ),
  },
];

interface SidebarNavProps {
  activeCategory: string;
  onSelect: (id: string) => void;
}

/**
 * 侧边栏分类导航：桌面侧栏与移动端抽屉共用，均为垂直列表。
 * 容器 flex-1 + min-h-0，保证备案信息始终固定在最底部。
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeCategory,
  onSelect,
}) => (
  <div className="flex flex-col gap-1 p-2 flex-1 min-h-0 overflow-y-auto">
    {CATEGORIES.map((cat) => {
      const active = activeCategory === cat.id;
      return (
        // 用 a 承载导航项：语义上更贴近「分类导航」，
        // 且天然支持 aria-current；默认样式已由全局 CSS 重置
        <a
          key={cat.id}
          href={`#${cat.id}`}
          onClick={(e) => {
            e.preventDefault();
            onSelect(cat.id);
          }}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-left ${
            active
              ? 'bg-white dark:bg-[#3A3A3C] shadow-xs'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {cat.icon}
          <span className={active ? 'text-blue-500 dark:text-white' : ''}>
            {cat.label}
          </span>
        </a>
      );
    })}
  </div>
);

export default SidebarNav;
