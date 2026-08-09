import { useState } from 'react';
import { useHomeStore } from '../../store/useHomeStore';
import { PRESET_DATA } from '../../data/presetData';
import { wallpaperApi } from '../../api/wallpaper';
import type { WallpaperConfig } from '../../types';
import { GlassTabs } from '../../components/GlassTabs';
import {
  WallpaperCard,
  type WallpaperCardItem,
} from './WallpaperCard';
import { OnlineWallpaperList } from './OnlineWallpaperList';
import { PresetWallpaperGrid } from './PresetWallpaperGrid';

interface StaticWallpaperSectionProps {
  wallpaper: WallpaperConfig;
  onUpdateWallpaper: (config: WallpaperConfig) => void;
}

/** 静态壁纸区域：在线壁纸 + 系统预设（图片壁纸 + 渐变兜底），以 Tab 切换 */
export const StaticWallpaperSection: React.FC<StaticWallpaperSectionProps> = ({
  wallpaper,
  onUpdateWallpaper,
}) => {
  const { isDarkMode } = useHomeStore();
  const [sourceTab, setSourceTab] = useState<'online' | 'preset'>('online');

  const handleSelectWallpaper = (item: WallpaperCardItem) => {
    // 在线壁纸（带 id）异步更新下载量；系统预设以 gradient 为标识，无 id，跳过上报
    if (item.id) wallpaperApi.recordDownload(item.id).catch(() => {});

    // thumbnailUrl 仅用于列表预览，实际壁纸用 imageUrl；无图时用 gradient 兜底
    onUpdateWallpaper({
      type: 'static',
      imageUrl: item.imageUrl || item.thumbnailUrl,
      gradient: item.gradient,
      dynamicPreset: undefined,
    });
  };

  // 明暗适配的预设：亮色模式只显示 light，暗色模式只显示 dark，both 两端均显示
  const presetFilter = (theme?: 'light' | 'dark' | 'both') =>
    theme === 'both' || theme === (isDarkMode ? 'dark' : 'light');

  const imageWallpapers = PRESET_DATA.STATIC_IMAGE_WALLPAPERS.filter((w) =>
    presetFilter(w.theme),
  );
  const gradientWallpapers = PRESET_DATA.STATIC_WALLPAPERS.filter((w) =>
    presetFilter(w.theme),
  );

  const tabs: { id: string; label: string }[] = [
    { id: 'online', label: '在线壁纸' },
    { id: 'preset', label: '系统预设' },
  ];

  return (
    <div className="space-y-3">
      <GlassTabs
        items={tabs}
        activeKey={sourceTab}
        onChange={(k) => setSourceTab(k as 'online' | 'preset')}
      />

      {sourceTab === 'online' && (
        <OnlineWallpaperList onSelect={handleSelectWallpaper} />
      )}

      {/* 系统预设：静态图片壁纸 + 渐变兜底壁纸 */}
      {sourceTab === 'preset' && (
        <div className="space-y-4">
          <PresetWallpaperGrid
            items={imageWallpapers}
            wallpaper={wallpaper}
            onSelect={handleSelectWallpaper}
          />
          <PresetWallpaperGrid
            items={gradientWallpapers}
            wallpaper={wallpaper}
            onSelect={handleSelectWallpaper}
          />
        </div>
      )}
    </div>
  );
};
