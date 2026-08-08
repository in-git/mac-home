import type { ReactNode } from 'react';

export interface GlassTabItem {
  id: string;
  label: ReactNode;
}

interface GlassTabsProps {
  items: GlassTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** 附加类名，用于控制宽度（默认自适应内容） */
  className?: string;
}

/** 手写玻璃质感分段控件：毛玻璃容器 + 选中项玻璃高亮胶囊 */
export const GlassTabs: React.FC<GlassTabsProps> = ({
  items,
  activeKey,
  onChange,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`inline-flex w-full max-w-fit gap-1 rounded-full border border-white/30 bg-white/25 p-1 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeKey;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
              isActive
                ? 'bg-white/60 text-[color:var(--accent)] shadow-md shadow-black/10 backdrop-blur-sm dark:bg-white/20 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
