import { Globe, Heart, Play } from 'lucide-react';
import React from 'react';

/** lucide 图标组件的最小签名（只用到 size / className） */
type IconComponent = React.ComponentType<{
  size?: number | string;
  className?: string;
}>;

export interface CategoryDef {
  id: string;
  label: string;
  /**
   * 图标**组件**而非元素。
   *
   * 侧边栏列表用 15px、移动端底部 tabbar 用 22px，两处尺寸不同；
   * 存元素就只能把尺寸写死，存组件才能让各消费方自行决定。
   */
  Icon: IconComponent;
  /** 图标底座的渐变色（仅侧边栏列表使用） */
  tone: string;
  /** 是否填充图标（Play 这类实心更协调） */
  fill?: boolean;
}

/**
 * 分类配置：桌面侧边栏与底部 tabbar 共用同一份，避免两处各写一遍。
 *
 * 顺序即展示顺序，按移动端 tabbar 的习惯排：
 * 内容类（视频 / 网页）在前，「我的」这类个人页放在最右。
 * 桌面端侧边栏沿用同一顺序。
 */
export const CATEGORIES: CategoryDef[] = [
  {
    id: 'video',
    label: '视频',
    Icon: Play,
    tone: 'from-sky-400 to-blue-500',
    fill: true,
  },
  {
    id: 'web',
    label: '网页',
    Icon: Globe,
    tone: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'mine',
    label: '我的',
    Icon: Heart,
    tone: 'from-rose-400 to-pink-500',
  },
];

interface SidebarNavProps {
  activeCategory: string;
  onSelect: (id: string) => void;
}

/**
 * 侧边栏分类导航：桌面左侧栏的垂直列表（移动端由底部 tabbar 承担导航）。
 * 容器 flex-1 + min-h-0，保证底部访客统计 / 备案信息始终固定在最底部。
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
          <span
            className={`flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br ${cat.tone} text-white`}
          >
            <cat.Icon size={15} className={cat.fill ? 'fill-current' : ''} />
          </span>
          <span className={active ? 'text-blue-500 dark:text-white' : ''}>
            {cat.label}
          </span>
        </a>
      );
    })}
  </div>
);

export default SidebarNav;
