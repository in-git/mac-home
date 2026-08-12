import PrismaticBurst from '../components/PrismaticBurst/PrismaticBurst';
import { SearchWidget } from './SearchWidget';

// Banner widget — wraps the PrismaticBurst prismatic burst effect.
// PrismaticBurst 通过 ResizeObserver 自适应容器尺寸，无需转发 size。
// `size` 仍保留在 props 中，兼容 widgetContent 按组件尺寸透传。
export function BannerWidget() {
  return (
    <div className="relative w-full h-[200px] bg-black overflow-hidden rounded-[var(--card-radius)]">
      <PrismaticBurst />
      {/* 搜索组件绝对定位居中覆盖在动效之上，容器带磨砂背景 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-[560px] px-6">
          <div className="rounded-[var(--card-radius)]  backdrop-blur-2xl p-4">
            <SearchWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
