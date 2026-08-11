import {
  Image as ImageIcon,
  Palette,
  SunMedium,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import type { WallpaperConfig } from '../../types';
import { DynamicWallpaperSection } from './DynamicWallpaperSection';
import { Modal } from '../../components/Modal';
import { StaticWallpaperSection } from '../StaticWallpaper';
import { ThemeCarouselPicker } from './ThemeCarouselPicker';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
  onToggleDarkMode: () => void;
  /** 追加到 Modal 玻璃卡片上的 Tailwind 类，可覆盖宽度等做响应式 */
  className?: string;
  /** 追加到内容区（左右分栏容器）的 Tailwind 类 */
  contentClassName?: string;
  /** 追加到左侧 Tab 导航栏的 Tailwind 类 */
  navClassName?: string;
}

type TabId = 'dynamic' | 'static' | 'adjust';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'dynamic', label: '动态效果', icon: <Palette size={16} /> },
  { id: 'static', label: '静态壁纸', icon: <ImageIcon size={16} /> },
  { id: 'adjust', label: '桌面主题', icon: <SunMedium size={16} /> },
];

/** 可微调的滤镜项，集中配置后用 map 渲染，避免重复 JSX */
type FilterKey =
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue'
  | 'sepia'
  | 'grayscale'
  | 'invert';

interface FilterConfig {
  key: FilterKey;
  label: string;
  min: number;
  max: number;
  step: number;
  /** 缺省时的中性值，同时作为重置值 */
  fallback: number;
  /** 数值格式化展示 */
  format: (value: number) => string;
}

const FILTERS: FilterConfig[] = [
  { key: 'blur', label: '桌面模糊', min: 0, max: 40, step: 1, fallback: 0, format: (v) => `${v}px` },
  { key: 'brightness', label: '亮度', min: 20, max: 120, step: 1, fallback: 100, format: (v) => `${v}%` },
  { key: 'contrast', label: '对比度', min: 0.5, max: 2, step: 0.05, fallback: 1, format: (v) => v.toFixed(2) },
  { key: 'saturation', label: '饱和度', min: 0, max: 2, step: 0.05, fallback: 1, format: (v) => v.toFixed(2) },
  { key: 'hue', label: '色相', min: 0, max: 360, step: 1, fallback: 0, format: (v) => `${v}°` },
  { key: 'sepia', label: '怀旧', min: 0, max: 1, step: 0.05, fallback: 0, format: (v) => `${Math.round(v * 100)}%` },
  { key: 'grayscale', label: '灰度', min: 0, max: 1, step: 0.05, fallback: 0, format: (v) => `${Math.round(v * 100)}%` },
  { key: 'invert', label: '反相', min: 0, max: 1, step: 0.05, fallback: 0, format: (v) => `${Math.round(v * 100)}%` },
];

const RESET_VALUES = Object.fromEntries(
  FILTERS.map((f) => [f.key, f.fallback]),
) as Record<FilterKey, number>;

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  wallpaper,
  isDarkMode,
  onUpdateWallpaper,
  onToggleDarkMode,
  className = 'w-full md:max-w-6xl xl:max-w-7xl h-full md:h-[90vh] lg:h-[80vh] 2xl:h-[70vh]',
  contentClassName = '',
  navClassName = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('dynamic');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="桌面与屏幕保护"
      className={className}
    >
      <div
        className={`flex min-h-0 flex-1 min-h-[80vh] md:min-h-[60vh] ${contentClassName}`}
      >
        {/* 侧边 Tab 导航：Apple Settings 风格 */}
        <nav
          className={`flex w-44 shrink-0 flex-col gap-0.5 border-r border-black/[0.06] bg-black/[0.02] p-2.5 dark:border-white/[0.08] dark:bg-white/[0.02] ${navClassName}`}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white font-medium text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-white/10 dark:text-[#f5f5f7]'
                  : 'text-[#6e6e73] hover:bg-black/[0.04] dark:text-[#aeaeb2] dark:hover:bg-white/[0.06]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* 右侧内容面板 */}
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          {activeTab === 'dynamic' ? (
            <DynamicWallpaperSection
              wallpaper={wallpaper}
              isDarkMode={isDarkMode}
              onUpdateWallpaper={onUpdateWallpaper}
              onToggleDarkMode={onToggleDarkMode}
            />
          ) : activeTab === 'static' ? (
            <StaticWallpaperSection
              wallpaper={wallpaper}
              onUpdateWallpaper={onUpdateWallpaper}
            />
          ) : (
            <div className="space-y-8">
              {/* 桌面主题：3D 卡片轮播选择 */}
              <section>
                <h3 className="mb-4 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  桌面主题
                </h3>
                <ThemeCarouselPicker
                  wallpaper={wallpaper}
                  onUpdateWallpaper={onUpdateWallpaper}
                />
              </section>

              {/* 手动微调 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    手动微调
                  </h3>
                  <button
                    onClick={() => onUpdateWallpaper(RESET_VALUES)}
                    className="flex items-center gap-1 rounded-full bg-black/[0.05] px-3 py-1 text-xs font-medium text-[color:var(--accent)] transition-colors hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
                  >
                    <RotateCcw size={12} />
                    重置滤镜
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {FILTERS.map((filter) => {
                    const value = wallpaper[filter.key] ?? filter.fallback;
                    return (
                      <div
                        key={filter.key}
                        className="rounded-2xl border border-black/[0.06] bg-white/80 p-4 backdrop-blur-sm transition-shadow hover:shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-white/[0.04]"
                      >
                        <div className="mb-2 flex items-center justify-between text-[13px]">
                          <span className="font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                            {filter.label}
                          </span>
                          <span className="tabular-nums text-[#6e6e73] dark:text-[#aeaeb2]">
                            {filter.format(value)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={filter.min}
                          max={filter.max}
                          step={filter.step}
                          value={value}
                          onChange={(e) =>
                            onUpdateWallpaper({
                              [filter.key]: Number(e.target.value),
                            } as Partial<WallpaperConfig>)
                          }
                          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-black/10 accent-[color:var(--accent)] dark:bg-white/20"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#86868b] dark:text-[#86868b]">
                拖动或点击最前方卡片切换主题，也可用上方滑块手动微调，效果实时作用于桌面背景与顶部菜单栏。
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
