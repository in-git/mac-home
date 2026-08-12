import PrismaticBurst from '../components/PrismaticBurst/PrismaticBurst';
import { SearchWidget } from './SearchWidget';
import type { WidgetSize } from '../types';

// Banner widget — wraps the PrismaticBurst prismatic burst effect.
// PrismaticBurst 通过 ResizeObserver 自适应容器尺寸，无需转发 size。
// `size` 仍保留在 props 中，兼容 widgetContent 按组件尺寸透传。
export function BannerWidget({ size: _size }: { size?: WidgetSize }) {
  return (
    <div className="relative w-full h-[200px] bg-black overflow-hidden rounded-[var(--card-radius)]">
      <PrismaticBurst />
   
    </div>
  );
}
