import {
  Image as ImageIcon,
  Palette,
  SunMedium,
} from 'lucide-react';
import { useState } from 'react';
import type { WallpaperConfig } from '../../types';
import { DynamicWallpaperSection } from './DynamicWallpaperSection';
import { Modal } from '../../components/Modal';
import { StaticWallpaperSection } from '../StaticWallpaper';
import { ThemeCarouselPicker } from './ThemeCarouselPicker';
import { THEME_COLORS } from '../../data/options';

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallpaper: WallpaperConfig;
  isDarkMode: boolean;
  themeColor: string;
  onUpdateWallpaper: (patch: Partial<WallpaperConfig>) => void;
  onUpdateThemeColor: (color: string) => void;
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

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  wallpaper,
  isDarkMode,
  themeColor,
  onUpdateWallpaper,
  onUpdateThemeColor,
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
        {/* 竖向 Tab 导航 */}
        <nav
          className={`flex w-44 shrink-0 flex-col gap-1 border-r border-black/5 p-3 dark:border-white/10 ${navClassName}`}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 rounded-[var(--card-radius)] px-3 py-2.5 text-left text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-[color:var(--accent)]/15 font-medium text-[color:var(--accent)] dark:text-[color:var(--accent)]'
                  : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* 右侧内容面板 */}
        <div className="min-w-0 flex-1 overflow-y-auto p-5">
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
            <div className="space-y-6">
              {/* 桌面主题：3D 卡片轮播选择 */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  桌面主题
                </h3>
                <ThemeCarouselPicker
                  wallpaper={wallpaper}
                  onUpdateWallpaper={onUpdateWallpaper}
                />
              </section>

              {/* 手动微调 */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {/* 模糊调节 */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      桌面模糊
                    </span>
                    <span className="tabular-nums text-slate-500 dark:text-slate-400">
                      {wallpaper.blur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={wallpaper.blur}
                    onChange={(e) =>
                      onUpdateWallpaper({ blur: Number(e.target.value) })
                    }
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                {/* 亮度调节 */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      亮度
                    </span>
                    <span className="tabular-nums text-slate-500 dark:text-slate-400">
                      {wallpaper.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={120}
                    value={wallpaper.brightness}
                    onChange={(e) =>
                      onUpdateWallpaper({ brightness: Number(e.target.value) })
                    }
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
              </div>

              {/* 主题色 */}
              <div>
                <div className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                  主题色
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {THEME_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateThemeColor(c)}
                      className={`h-7 w-7 rounded-full border transition-transform ${
                        themeColor.toLowerCase() === c.toLowerCase()
                          ? 'scale-110 border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                          : 'border-black/10 hover:scale-110 dark:border-white/20'
                      }`}
                      style={{ background: c }}
                      title={c}
                    />
                  ))}
                  <label
                    className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border border-black/10 dark:border-white/20"
                    title="自定义主题色"
                  >
                    <span
                      className="absolute inset-0"
                      style={{
                        background:
                          'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                      }}
                    />
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => onUpdateThemeColor(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                拖动或点击最前方卡片切换主题，也可用下方滑块手动微调，效果实时作用于桌面背景与顶部菜单栏。
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
