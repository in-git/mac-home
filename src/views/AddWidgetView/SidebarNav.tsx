import { Globe, Heart } from 'lucide-react';
import React from 'react';

/** 侧边栏分类配置 */
const CATEGORIES: { id: string; label: string; icon: React.ReactNode }[] = [
  {
    id: 'mine',
    label: '我的',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-rose-400 to-pink-500 text-white">
        <Heart size={15} />
      </span>
    ),
  },
  {
    id: 'web',
    label: '网页',
    icon: (
      <span className="flex items-center justify-center w-7 h-7 rounded-[var(--card-radius)] bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
        <Globe size={15} />
      </span>
    ),
  },
];

interface SidebarNavProps {
  activeCategory: string;
  onSelect: (id: string) => void;

}

/**
 * 侧边栏分类导航：桌面侧栏与移动端抽屉共用同一份分类配置。
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeCategory,
  onSelect,
}) => (
  <div className="flex sm:flex-col gap-1 p-2 sm:flex-1 sm:min-h-0 sm:overflow-y-auto overflow-x-auto">
    { (
      <div className="px-2.5 pt-2 pb-3">
        <h1 className="text-font-title dark:text-white">游趣</h1>
      </div>
    )}
    {CATEGORIES.map((cat) => {
      const active = activeCategory === cat.id;
      return (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-[var(--card-radius)] transition-colors whitespace-nowrap shrink-0 ${
            active
              ? 'bg-white dark:bg-[#3A3A3C] shadow-xs'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
        >
          {cat.icon}
          <span
            className={` ${
              active ? 'text-[color:var(--accent)] dark:text-white' : ' '
            }`}
          >
            {cat.label}
          </span>
        </button>
      );
    })}
  </div>
);

export default SidebarNav;
