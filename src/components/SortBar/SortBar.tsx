import React from 'react';

/** 排序选项 */
export interface SortOption {
  /** 排序字段（后端 sortField，驼峰） */
  field: string;
  /**
   * 排序方向（后端 sortOrder）。
   * 后端只识别**小写** ascend / descend，其它写法会 500。
   */
  order: 'ascend' | 'descend';
  label: string;
}

interface SortBarProps {
  options: SortOption[];
  /** 当前选中项，用于判定高亮（按 field + order 匹配） */
  value: SortOption;
  onChange: (option: SortOption) => void;
  /** 紧凑态：滚动折叠时收窄尺寸 */
  compact?: boolean;
  className?: string;
}

/**
 * 排序筛选行：单行胶囊按钮组，样式与分类胶囊保持一致。
 * 横向可滚动（窄屏不换行、不挤压）。
 */
export const SortBar: React.FC<SortBarProps> = ({
  options,
  value,
  onChange,
  compact = false,
  className = '',
}) => (
  <div
    className={`-mx-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
  >
    <div
      className={`flex w-max items-center gap-2 px-1 transition-[font-size] duration-300 ${
        compact ? 'text-sm' : 'text-md'
      }`}
    >
      {options.map((opt) => {
        const active = opt.field === value.field && opt.order === value.order;
        return (
          <button
            key={`${opt.field}-${opt.order}`}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`shrink-0 whitespace-nowrap rounded-md px-3 transition-[padding] duration-300 ${
              compact ? 'py-1' : 'py-1.5'
            } ${
              active
                ? 'bg-blue-500 text-white'
                : 'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default SortBar;
