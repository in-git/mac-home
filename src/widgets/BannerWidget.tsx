import PrismaticBurst from '../components/PrismaticBurst/PrismaticBurst';
import type { WidgetProps, WidgetSize } from '../types';

// Banner widget — wraps the PrismaticBurst prismatic burst effect.
// PrismaticBurst 通过 ResizeObserver 自适应容器尺寸，无需转发 size。
// `size` 仍保留在 props 中，兼容 widgetContent 按组件尺寸透传。
export function BannerWidget({ size }: WidgetProps & { size?: WidgetSize }) {
  return (
    <div className="w-full h-[200px] bg-black overflow-hidden rounded-[var(--card-radius)]">
      <PrismaticBurst />
    </div>
  );
}
