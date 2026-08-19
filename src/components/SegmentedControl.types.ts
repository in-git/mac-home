export interface SegmentOption<T extends string> {
  value: T;
  /** 仅允许纯文本，禁止传入 DOM。 */
  label: string;
  /** 可选：禁用该项。 */
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 可选：无障碍标签。 */
  ariaLabel?: string;
  /** 尺寸档位，控制内边距与字号。默认 md。 */
  size?: 'sm' | 'md' | 'mini';
  /** 占满父容器宽度，各分段平均分配。 */
  fullWidth?: boolean;
  className?: string;
}
