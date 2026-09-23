import React from 'react';
import { CATEGORIES } from './SidebarNav';
import { WebIcon } from '@/components/WebIcon/WebIcon';

interface MobileTabBarProps {
  activeCategory: string;
  onSelect: (id: string) => void;
}

/**
 * 移动端底部 tabbar（原生 App 式结构）。
 *
 * ── 为什么不用 `position: fixed` ────────────────────────────
 * 它作为根容器（`h-[100dvh] flex flex-col`）的**最后一个 flex 子项**，
 * 内容区是 `flex-1 min-h-0`。这样：
 * - tabbar 占据自己的高度，永远贴着容器底部，不会随内容滚动
 * - 内容区的滚动发生在其内部的 `overflow-y-auto` 里，与 tabbar 无关
 * - 不需要 fixed 定位，也就不会有「内容被 tabbar 遮住最后一行」
 *   而需要额外加 `padding-bottom` 补偿的问题
 *
 * 若改用 `fixed bottom-0`，内容区底部就要留出等高内边距，
 * 而且滚动条会从 tabbar 后面穿过，观感上不如 flex 布局干净。
 *
 * 仅移动端渲染（`sm:hidden`）；桌面端由左侧栏承担同样职责。
 */
export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeCategory,
  onSelect,
}) => (
  <nav
    // shrink-0 必须保留：否则当内容区很高时，flex 会把 tabbar 压扁
    className="shrink-0 border-t border-black/[0.08] bg-white/95 backdrop-blur-md sm:hidden"
    // 兼容刘海屏 / 手势条的底部安全区。
    // 用 max() 包一层：未声明 `viewport-fit=cover` 时 env() 解析为 0，
    // 此时仍保留最小内边距，不会让文字贴死屏幕边缘。
    style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    aria-label="主导航"
  >
    <div className="flex items-stretch">
      {CATEGORIES.map((cat) => {
        const active = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            // aria-current 表达「当前页」，比仅仅改颜色更利于无障碍
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 transition-colors duration-150 ${
              active
                ? 'text-[color:var(--accent)]'
                : 'text-[#86868B] active:text-[#6E6E73]'
            }`}
          >
            {/**
             * 选中态用图标 + 文字同时变色表意：
             * - 双色图标（dualTone，如网页 WebIcon）：激活时传 `filled`，
             *   外框填充主题色、内线白色，达成「实心 + 线条清晰」；
             * - 常规实心图标（cat.fill，如视频 Play）：激活时 `fill-current`；
             * - 未选中：仅描边（空心）+ 灰色。
             * 这里不加渐变底座（侧边栏列表才用）：tabbar 尺寸小，
             * 色块会显得很重，实心图标本身就足够区分。
             */}
            {cat.dualTone ? (
              <WebIcon
                size={22}
                filled={active}
                strokeWidth={active ? 2.5 : 1.75}
              />
            ) : (
              <cat.Icon
                size={22}
                className={`${cat.fill && active ? 'fill-current' : ''} ${
                  active ? 'stroke-[2.5]' : 'stroke-[1.75]'
                }`}
              />
            )}
            <span className="text-xs leading-none">{cat.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default MobileTabBar;
