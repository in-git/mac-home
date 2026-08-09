import type { WallpaperConfig } from '../../types';

/** 系统预设壁纸：以 gradient 作为唯一标识，与在线静态壁纸（WallpaperItem）彻底区分 */
export type PresetStaticWallpaper = {
  gradient: string;
  /** 明暗适配：亮色模式只显示 'light'，暗色模式只显示 'dark'；'both' 两端均显示 */
  theme?: 'light' | 'dark' | 'both';
  /** 可选图片（有图时用图，无图时以 gradient 兜底） */
  imageUrl?: string;
  thumbnailUrl?: string;
};

/** 默认壁纸（渐变兜底）：无图时的背景渐变 */
export const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'dynamic',
  dynamicPreset: 'aurora',
  blur: 0,
  brightness: 100,
  contrast: 1,
  saturation: 1,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
};

/** 渐变 / 静态壁纸预设：每个均带渐变背景（无图时兜底生效） */
/** 静态图片壁纸预设：带 imageUrl，与渐变兜底预设区分 */
export const STATIC_IMAGE_WALLPAPERS: PresetStaticWallpaper[] = [
  {
    theme: 'light',
    gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
  },
  {
    theme: 'dark',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {
    theme: 'light',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
  },
];


export const STATIC_WALLPAPERS: PresetStaticWallpaper[] = [
  // 暗色系（macOS 深色外观渐变）
  { theme: 'dark', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #09203f 0%, #537895 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #ec008c 0%, #fc6767 100%)' },
  { theme: 'dark', gradient: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)' },
  // 亮色系（macOS 浅色外观渐变）
  { theme: 'light', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #ffdde1 0%, #ee9ca7 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #e6dada 0%, #274046 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { theme: 'light', gradient: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)' },
];