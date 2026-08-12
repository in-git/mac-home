import type { StickyNote, WidgetItem } from '../../types';

// Curated accent colors exposed in the settings panel. Each entry is a CSS
// color used for the `--accent` CSS variable (drives buttons, rings, focus).
// 柔和化苹果系统色：降低饱和度与亮度，去掉原色板中过近的“红/粉”重复。
export const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: '蓝', value: '#4F9DE0' },
  { name: '绿', value: '#5BBF8A' },
  { name: '橙', value: '#F3A463' },
  { name: '粉', value: '#F07C97' },
  { name: '紫', value: '#B07CD6' },
  { name: '石墨', value: '#8A8F98' },
  { name: '青', value: '#54C1D6' },
  { name: '黄', value: '#F0CF6B' },
];

// 解析导入的配置文件（与“导出布局”格式对应：{ app, version, exportedAt, widgets, notes }）。
// 对 widgets / notes 做宽松校验并过滤出有效项，结构不合法时抛错提示用户。
export function parseImport(text: string): {
  widgets: WidgetItem[];
  notes: StickyNote[];
} {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('无法解析 JSON，请确认是导出的配置文件');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('配置文件格式不正确');
  }
  const { widgets, notes } = data as {
    widgets?: unknown;
    notes?: unknown;
  };
  if (!Array.isArray(widgets) || !Array.isArray(notes)) {
    throw new Error('配置缺少 widgets / notes 数据');
  }
  const validWidgets = widgets.filter(
    (w): w is WidgetItem =>
      !!w &&
      typeof w === 'object' &&
      typeof (w as WidgetItem).id === 'string' &&
      typeof (w as WidgetItem).type === 'string' &&
      typeof (w as WidgetItem).size === 'string',
  );
  const validNotes = notes.filter(
    (n): n is StickyNote =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as StickyNote).id === 'string',
  );
  if (widgets.length > 0 && validWidgets.length === 0) {
    throw new Error('未找到有效的小组件数据');
  }
  return { widgets: validWidgets, notes: validNotes };
}
