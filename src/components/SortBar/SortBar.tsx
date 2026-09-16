import React from 'react';
import { Button, ButtonSize } from '../Button/Button';

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
  /** 紧凑态：滚动折叠时收窄字号 */
  compact?: boolean;
  /** 尺寸档位，默认 xs-md（移动端 24px、PC 36px） */
  size?: ButtonSize;
  className?: string;
}

/**
 * 排序筛选行：单行胶囊按钮组，样式与分类胶囊保持一致。
 * 横向可滚动（窄屏不换行、不挤压）。
 *
 * 按钮统一走通用 Button 的 pill 模式：移动端 24px、PC 36px。
 */
export const SortBar: React.FC<SortBarProps> = ({
  options,
  value,
  onChange,
  compact = false,
  size = 'xs-md',
  className = '',
}) => (
  <div
    className={`-mx-1 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
  >
    <div className="flex w-max items-center gap-2 px-1">
      {options.map((opt) => (
        <Button
          key={`${opt.field}-${opt.order}`}
          variant="pill"
          size={size}
          active={opt.field === value.field && opt.order === value.order}
          onClick={() => onChange(opt)}
          className={`shrink-0 whitespace-nowrap ${
            compact ? 'text-sm sm:text-sm' : ''
          }`}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  </div>
);

export default SortBar;
