import type { StickyNote, WidgetItem } from '../../types';

// 主题色（强调色）唯一数据源，见 src/data/options/themeColors.options.ts
export { ACCENT_COLORS } from '../../data/options/themeColors.options';

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
