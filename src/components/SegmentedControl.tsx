import { Tabs, Tab } from '@heroui/react';
import { SegmentedControlProps, SegmentOption } from './SegmentedControl.types';


/** macOS 风格的分段选择器，基于 HeroUI Tabs 实现。 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <Tabs
      aria-label={ariaLabel}
      selectedKey={value}
      onSelectionChange={(key) => onChange(key as T)}
      className={className}
    
    >
      {options.map((opt) => (
        <Tab
          isDisabled={opt.disabled}
        />
      ))}
    </Tabs>
  );
}

export type { SegmentOption, SegmentedControlProps };
export default SegmentedControl;
