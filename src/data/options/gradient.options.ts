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
export const STATIC_WALLPAPERS: PresetStaticWallpaper[] = [
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    imageUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #fff1eb 0%, #ace0f9 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #1a2a6c 0%, #2a5298 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
  },
  {    theme: 'light',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #1b1f3b 0%, #3b2f63 45%, #6d5a8f 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #2a1a3e 0%, #5b3a7a 45%, #c06c9e 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #0a2e2a 0%, #0f5a52 50%, #2bb6a4 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #0d0d12 0%, #1c1c28 55%, #3a3a52 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #15102b 0%, #3a2b5c 50%, #6b4f9e 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #0b0b0f 0%, #1a1a22 50%, #2c2c38 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 50%, #636366 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #141433 0%, #2e2e6e 50%, #4f4fb0 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #05010f 0%, #1b0b3a 55%, #3d1f6e 100%)',
  },
  {    theme: 'dark',
    gradient: 'linear-gradient(135deg, #04111f 0%, #0a3a4a 50%, #1f8a8a 100%)',
  },
];
