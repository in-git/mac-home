import { SegmentedControlProps } from './SegmentedControl.types';

/** macOS 风格的分段选择器，基于原生按钮实现，避免 HeroUI Tabs 的 collection 渲染问题。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const height =
    size === 'sm' ? 'h-7 text-xs' : size === 'lg' ? 'h-10 text-base' : 'h-8 text-sm';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-full bg-black/5 p-1 dark:bg-white/10 ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={selected}
            disabled={opt.disabled}
            onClick={() => {
              if (!opt.disabled) onChange(opt.value);
            }}
            className={[
              'relative flex-1 whitespace-nowrap rounded-full px-3 font-medium transition-colors',
              height,
              selected
                ? 'bg-white text-gray-900 shadow dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
              opt.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
            ].join(' ')}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
