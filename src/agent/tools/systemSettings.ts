import { useHomeStore } from '../../store/useHomeStore';
import type { FontVariant, WallpaperConfig } from '../../types';
import type { AgentTool } from '../types';
import { ok, err } from '../result';

/**
 * 系统设置（System Settings）——全局唯一的设置操作入口。
 *
 * 这里集中导出所有「可全局复用」的底层设置方法（apply*），
 * 业务组件或其它模块需要改设置时统一调用这些方法，而非各自直连 store；
 * 同时它们也是 AI 工具（下方 AgentTool 定义）的实现基础，做到一处定义、处处复用。
 */

// ---------------------------------------------------------------------------
// 可全局复用的底层方法
// ---------------------------------------------------------------------------

export function applyDarkMode(enabled: boolean): void {
  useHomeStore.getState().setDarkMode(enabled);
}

export function applyThemeColor(color: string): void {
  useHomeStore.getState().setThemeColor(color);
}

export function applySoundEnabled(enabled: boolean): void {
  useHomeStore.getState().setSoundEnabled(enabled);
}

export function applyFontVariant(variant: FontVariant): void {
  useHomeStore.getState().setFontVariant(variant);
}

export function applyScreenBrightness(value: number): void {
  // 约束到 10% ~ 100%
  const v = Math.min(100, Math.max(10, Math.round(value)));
  useHomeStore.getState().setScreenBrightness(v);
}

export function applyWallpaper(patch: Partial<WallpaperConfig>): void {
  useHomeStore.getState().updateWallpaper(patch);
}

export function resetSystemSettings(): void {
  useHomeStore.getState().resetAll();
}

// ---------------------------------------------------------------------------
// AI 工具定义（复用上面的底层方法）
// ---------------------------------------------------------------------------

const setDarkModeTool: AgentTool = {
  name: 'set_dark_mode',
  description: '开启或关闭系统的深色（暗黑）模式。',
  parameters: {
    enabled: {
      type: 'boolean',
      description: 'true 开启深色模式，false 关闭。',
      required: true,
    },
  },
  run: (args) => {
    let enabled = args.enabled;
    // 模型常漏传 enabled（如返回 {"tool":"set_dark_mode","args":{}}），
    // 缺省按「开启」处理，避免硬性报错。
    if (enabled === undefined && Object.keys(args).length === 0) {
      enabled = true;
    }
    if (typeof enabled !== 'boolean') {
      return err('set_dark_mode', '参数 enabled 必须是布尔值。');
    }
    applyDarkMode(enabled);
    return ok('set_dark_mode', `已${enabled ? '开启' : '关闭'}深色模式。`);
  },
};

const setThemeColorTool: AgentTool = {
  name: 'set_theme_color',
  description: '设置系统的主题强调色（用于按钮、高亮等）。',
  parameters: {
    color: {
      type: 'string',
      description: '十六进制颜色值，例如 #007AFF。',
      required: true,
    },
  },
  run: (args) => {
    const color = args.color;
    if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return err(
        'set_theme_color',
        '参数 color 必须是 6 位十六进制色值，如 #007AFF。',
      );
    }
    applyThemeColor(color);
    return ok('set_theme_color', `已将主题色设为 ${color}。`);
  },
};

const setSoundEnabledTool: AgentTool = {
  name: 'set_sound_enabled',
  description: '开启或关闭系统音效（如点击音）。',
  parameters: {
    enabled: {
      type: 'boolean',
      description: 'true 开启音效，false 关闭。',
      required: true,
    },
  },
  run: (args) => {
    const enabled = args.enabled;
    if (typeof enabled !== 'boolean') {
      return err('set_sound_enabled', '参数 enabled 必须是布尔值。');
    }
    applySoundEnabled(enabled);
    return ok('set_sound_enabled', `已${enabled ? '开启' : '关闭'}音效。`);
  },
};

const setFontVariantTool: AgentTool = {
  name: 'set_font_variant',
  description: '设置系统字号方案（整体字体大小档位）。',
  parameters: {
    variant: {
      type: 'string',
      description: "字号方案：'A'（小）、'B'（中）、'C'（大）。",
      enum: ['A', 'B', 'C'],
      required: true,
    },
  },
  run: (args) => {
    const variant = args.variant;
    if (variant !== 'A' && variant !== 'B' && variant !== 'C') {
      return err('set_font_variant', "参数 variant 必须是 'A'、'B' 或 'C'。");
    }
    applyFontVariant(variant);
    return ok('set_font_variant', `已将字号方案设为 ${variant}。`);
  },
};

const setScreenBrightnessTool: AgentTool = {
  name: 'set_screen_brightness',
  description: '设置屏幕（壁纸/整体）亮度，范围 10% ~ 100%。',
  parameters: {
    value: {
      type: 'number',
      description: '亮度数值，10 到 100 之间的整数。',
      required: true,
    },
  },
  run: (args) => {
    const value = args.value;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return err('set_screen_brightness', '参数 value 必须是数字。');
    }
    applyScreenBrightness(value);
    return ok(
      'set_screen_brightness',
      `已将屏幕亮度设为 ${Math.min(100, Math.max(10, Math.round(value)))}%。`,
    );
  },
};

const setWallpaperTool: AgentTool = {
  name: 'set_wallpaper',
  description:
    '设置桌面壁纸。支持传入渐变色（gradient）、纯色（imageUrl 或 gradient）、预设（preset）以及模糊/亮度微调。',
  parameters: {
    gradient: {
      type: 'string',
      description:
        'CSS 渐变字符串，例如 linear-gradient(135deg,#0ea5e9,#6366f1)。',
      required: false,
    },
    imageUrl: {
      type: 'string',
      description: '图片 URL，作为壁纸图片。',
      required: false,
    },
    preset: {
      type: 'string',
      description: '动态壁纸预设名（dynamicPreset）。',
      required: false,
    },
    blur: {
      type: 'number',
      description: '模糊程度 0~20（像素）。',
      required: false,
    },
    brightness: {
      type: 'number',
      description: '亮度 50~120（百分比）。',
      required: false,
    },
  },
  run: (args) => {
    const patch: Partial<WallpaperConfig> = {};
    if (typeof args.gradient === 'string') patch.gradient = args.gradient;
    if (typeof args.imageUrl === 'string') patch.imageUrl = args.imageUrl;
    if (typeof args.preset === 'string') {
      patch.dynamicPreset = args.preset as WallpaperConfig['dynamicPreset'];
    }
    if (typeof args.blur === 'number') patch.blur = args.blur;
    if (typeof args.brightness === 'number') patch.brightness = args.brightness;
    if (Object.keys(patch).length === 0) {
      return err(
        'set_wallpaper',
        '至少需要提供一个壁纸参数（gradient/imageUrl/preset/blur/brightness）。',
      );
    }
    applyWallpaper(patch);
    return ok('set_wallpaper', '已更新桌面壁纸。');
  },
};

const resetSettingsTool: AgentTool = {
  name: 'reset_settings',
  description:
    '将主页的所有系统设置恢复为默认值，包括桌面布局、壁纸、便签、深色模式、主题色、音效开关、字号方案和屏幕亮度。',
  parameters: {
    scope: {
      type: 'string',
      description: "重置范围，当前仅支持 'all'（全部恢复默认）。",
      enum: ['all'],
      required: false,
    },
  },
  run: () => {
    resetSystemSettings();
    return ok('reset_settings', '已将所有设置重置为默认值。');
  },
};

/** 本模块导出的所有系统设置 AI 工具 */
export const systemSettingsTools: AgentTool[] = [
  resetSettingsTool,
  setDarkModeTool,
  setThemeColorTool,
  setSoundEnabledTool,
  setFontVariantTool,
  setScreenBrightnessTool,
  setWallpaperTool,
];
