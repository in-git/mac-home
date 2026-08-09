import { AlertDialog, Button } from '@heroui/react';
import {
  Check,
  Download,
  Image as ImageIcon,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Settings as SettingsIcon,
  Sun,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useHomeStore } from '../store/useHomeStore';
import {
  CARD_RADIUS_LABEL,
  CardRadiusTier,
  FONT_VARIANT_LABEL,
  StickyNote as StickyNoteType,
  WidgetItem,
} from '../types';
import { playSound } from '../utils/sound';

// Curated accent colors exposed in the settings panel. Each entry is a CSS
// color used for the `--accent` CSS variable (drives buttons, rings, focus).
const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: '蓝', value: '#007AFF' },
  { name: '绿', value: '#34C759' },
  { name: '橙', value: '#FF9500' },
  { name: '粉', value: '#FF2D55' },
  { name: '紫', value: '#AF52DE' },
  { name: '红', value: '#FF3B30' },
  { name: '青', value: '#5AC8FA' },
  { name: '黄', value: '#FFCC00' },
];

// 解析导入的配置文件（与“导出布局”格式对应：{ app, version, exportedAt, widgets, notes }）。
// 对 widgets / notes 做宽松校验并过滤出有效项，结构不合法时抛错提示用户。
function parseImport(text: string): {
  widgets: WidgetItem[];
  notes: StickyNoteType[];
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
    (n): n is StickyNoteType =>
      !!n &&
      typeof n === 'object' &&
      typeof (n as StickyNoteType).id === 'string',
  );
  if (widgets.length > 0 && validWidgets.length === 0) {
    throw new Error('未找到有效的小组件数据');
  }
  return { widgets: validWidgets, notes: validNotes };
}

export const SettingsWidget: React.FC = () => {
  const isDarkMode = useHomeStore((s) => s.isDarkMode);
  const setDarkMode = useHomeStore((s) => s.setDarkMode);
  const themeColor = useHomeStore((s) => s.themeColor);
  const setThemeColor = useHomeStore((s) => s.setThemeColor);
  const soundEnabled = useHomeStore((s) => s.soundEnabled);
  const setSoundEnabled = useHomeStore((s) => s.setSoundEnabled);
  const fontVariant = useHomeStore((s) => s.fontVariant);
  const setFontVariant = useHomeStore((s) => s.setFontVariant);
  const cardRadius = useHomeStore((s) => s.cardRadius);
  const setCardRadius = useHomeStore((s) => s.setCardRadius);
  const openWallpaper = useHomeStore((s) => s.openWallpaper);
  const resetLayout = useHomeStore((s) => s.resetLayout);
  const resetAll = useHomeStore((s) => s.resetAll);
  const widgets = useHomeStore((s) => s.widgets);
  const notes = useHomeStore((s) => s.notes);
  const setWidgets = useHomeStore((s) => s.setWidgets);
  const updateNotes = useHomeStore((s) => s.updateNotes);

  const [justReset, setJustReset] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importMsg, setImportMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导入成功/失败提示在数秒后自动消失。
  useEffect(() => {
    if (!importMsg) return;
    const t = setTimeout(() => setImportMsg(null), 3000);
    return () => clearTimeout(t);
  }, [importMsg]);

  // 读取文件并写入 store（widgets + notes）。
  const handleImportFile = (file: File) => {
    if (!file) return;
    if (
      file.type &&
      !file.type.includes('json') &&
      !file.name.toLowerCase().endsWith('.json')
    ) {
      setImportMsg({ type: 'error', text: '仅支持 .json 配置文件' });
      return;
    }
    file
      .text()
      .then((text) => {
        try {
          const { widgets: w, notes: n } = parseImport(text);
          setWidgets(w);
          updateNotes(n);

          setImportMsg({
            type: 'success',
            text: `已导入 ${w.length} 个组件、${n.length} 条便签`,
          });
        } catch (err) {
          setImportMsg({
            type: 'error',
            text: err instanceof Error ? err.message : '导入失败',
          });
        }
      })
      .catch(() => setImportMsg({ type: 'error', text: '读取文件失败' }));
  };

  // Keep the sound engine's master switch in sync with persisted state.
  useEffect(() => {
    playSound.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleToggleSound = () => {
    // Play the confirmation click before muting so the user gets feedback.

    setSoundEnabled(!soundEnabled);
  };

  const handleReset = () => {
    resetLayout();
    setJustReset(true);
    setTimeout(() => setJustReset(false), 1500);
  };

  // 重置系统：恢复全部持久化配置（由确认弹窗触发）
  const [justResetSystem, setJustResetSystem] = useState(false);
  const handleResetSystem = () => {
    resetAll();
    setJustResetSystem(true);
    setTimeout(() => setJustResetSystem(false), 1500);
  };

  // 导出布局：将当前组件顺序、尺寸与便签序列化为 JSON 下载
  const handleExport = () => {
    const payload = {
      app: 'macOS 主页',
      version: 1,
      exportedAt: new Date().toISOString(),
      widgets,
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `macos-home-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col text-xs text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <SettingsIcon size={16} className="text-[#007AFF]" />
          <span className="font-bold text-sm tracking-tight">系统设置</span>
        </div>
        <span className="text-font-sm text-slate-400 font-mono">macOS</span>
      </div>

      {/* 两栏设置区：左列通用（分组表格），右列个性化 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 flex-1">
        {/* 左列：通用设置 */}
        <div className="rounded-[12px] overflow-hidden bg-black/5 dark:bg-white/10">
          {/* 外观 — 分段控制器 */}
          <div className="px-3 py-2.5">
            <div className="flex items-center space-x-1.5 text-font-sm font-medium text-slate-500 mb-2">
              <Sun size={12} />
              <span>外观</span>
            </div>
            <div className="grid grid-cols-2 p-1 rounded-[12px] bg-white/60 dark:bg-white/5">
              {[
                { dark: false, label: '浅色', icon: <Sun size={12} /> },
                { dark: true, label: '深色', icon: <Moon size={12} /> },
              ].map((opt) => (
                <button
                  key={String(opt.dark)}
                  onClick={() => {
                    setDarkMode(opt.dark);
                  }}
                  className={`flex items-center justify-center space-x-1 py-1.5 rounded-[10px] transition-colors active:scale-95 ${
                    isDarkMode === opt.dark
                      ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs font-medium'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-black/5 dark:border-white/10" />

          {/* 点击音效 — Toggle 行 */}
          <button
            onClick={handleToggleSound}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
          >
            <span className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-[10px] flex items-center justify-center ${
                  soundEnabled
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-white/60 dark:bg-white/10 text-slate-400'
                }`}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </div>
              <span>
                <span className="block font-medium">点击音效</span>
                <span className="block text-font-sm text-slate-400">
                  {soundEnabled ? '已开启' : '已静音'}
                </span>
              </span>
            </span>
            <ToggleDot active={soundEnabled} />
          </button>

          <div className="border-t border-black/5 dark:border-white/10" />

          {/* 壁纸 — 导航行 */}
          <button
            onClick={() => {
              openWallpaper();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left"
          >
            <span className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-white/60 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                <ImageIcon size={14} />
              </div>
              <span>
                <span className="block font-medium">壁纸</span>
                <span className="block text-font-sm text-slate-400">
                  动态 / 静态
                </span>
              </span>
            </span>
            <span className="text-font-sm text-slate-400">更改 ›</span>
          </button>
        </div>

        {/* 右列：个性化 */}
        <div className="space-y-3">
          {/* 主题色 */}
          <div className="rounded-[12px] p-3 bg-black/5 dark:bg-white/10">
            <div className="flex items-center space-x-1.5 text-font-sm text-slate-500 font-medium mb-2">
              <Palette size={12} />
              <span>主题色</span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setThemeColor(c.value);
                  }}
                  title={c.name}
                  className={`aspect-square rounded-full transition-transform hover:scale-110 active:scale-95 ${
                    themeColor.toLowerCase() === c.value.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-white/70'
                      : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {themeColor.toLowerCase() === c.value.toLowerCase() && (
                    <Check
                      size={12}
                      className="mx-auto text-white drop-shadow"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 字体方案 — 分段控制器 */}
          <div className="rounded-[12px] p-3 bg-black/5 dark:bg-white/10">
            <div className="flex items-center space-x-1.5 text-font-sm text-slate-500 font-medium mb-2">
              <span className="font-bold leading-none">字</span>
              <span>字体大小</span>
            </div>
            <div className="grid grid-cols-3 p-1 rounded-[12px] bg-white/60 dark:bg-white/5">
              {(['A', 'B', 'C'] as const).map((v) => {
                const active = fontVariant === v;
                const sample =
                  v === 'A'
                    ? '12 / 14 / 16'
                    : v === 'B'
                      ? '13 / 15 / 17'
                      : '14 / 16 / 18';
                return (
                  <button
                    key={v}
                    onClick={() => {
                      setFontVariant(v);
                    }}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-[10px] transition-colors active:scale-95 ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs font-medium'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold">{FONT_VARIANT_LABEL[v]}</span>
                    <span className="font-mono opacity-80">{sample}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 卡片圆角 — 分段控制器 */}
          <div className="rounded-[12px] p-3 bg-black/5 dark:bg-white/10">
            <div className="flex items-center space-x-1.5 text-font-sm text-slate-500 font-medium mb-2">
              <span className="font-bold leading-none">圆</span>
              <span>卡片圆角</span>
            </div>
            <div className="grid grid-cols-3 p-1 rounded-[12px] bg-white/60 dark:bg-white/5">
              {(['small', 'medium', 'large'] as const).map((v) => {
                const active = cardRadius === v;
                return (
                  <button
                    key={v}
                    onClick={() => setCardRadius(v)}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-[10px] transition-colors active:scale-95 ${
                      active
                        ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs font-medium'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold">{CARD_RADIUS_LABEL[v]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作区：导出 / 恢复 / 导入 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-black/5 dark:border-white/10">
        <button
          onClick={handleExport}
          className="flex items-center justify-center space-x-1.5 p-2 rounded-[12px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors active:scale-95 text-font-sm font-medium text-slate-500"
        >
          <Download size={12} />
          <span>导出布局</span>
        </button>

        <button
          onClick={handleReset}
          className={`flex items-center justify-center space-x-1.5 p-2 rounded-[12px] transition-colors active:scale-95 text-font-sm font-medium ${
            justReset
              ? 'bg-[#28C840]/10 text-[#28C840]'
              : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-500'
          }`}
        >
          <RotateCcw size={12} />
          <span>{justReset ? '已恢复默认布局' : '恢复默认布局'}</span>
        </button>

        {/* 导入配置 — 拖拽 / 点击 */}
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleImportFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`sm:col-span-2 flex items-center justify-center space-x-2 p-2.5 rounded-[12px] border-2 border-dashed cursor-pointer transition-colors ${
            isDragging
              ? 'border-[#007AFF] bg-[#007AFF]/10'
              : 'border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          <Upload size={12} className="text-slate-500" />
          <span
            className={`text-font-sm font-medium ${
              importMsg?.type === 'error'
                ? 'text-red-500'
                : importMsg?.type === 'success'
                  ? 'text-[#28C840]'
                  : 'text-slate-500'
            }`}
          >
            {importMsg
              ? importMsg.text
              : '拖拽配置文件到此处，或点击选择 JSON 文件'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* 重置系统 — 需弹窗确认 */}
        <AlertDialog>
          <AlertDialog.Trigger
            className={`sm:col-span-2 flex items-center justify-center space-x-1.5 p-2 rounded-[12px] text-font-sm font-medium transition-colors active:scale-95 ${
              justResetSystem
                ? 'bg-[#28C840]/10 text-[#28C840]'
                : 'bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/15'
            }`}
          >
            <RefreshCw size={12} />
            <span>{justResetSystem ? '已重置系统' : '重置系统'}</span>
          </AlertDialog.Trigger>
          <AlertDialog.Backdrop variant="blur">
            <AlertDialog.Container>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Heading>重置系统？</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  将恢复默认布局、壁纸、便签、外观、主题色、点击音效、字号与屏幕亮度等所有设置，此操作不可撤销。
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button
                    slot="close"
                    variant="tertiary"
                    onPress={() => playSound.playClick()}
                  >
                    取消
                  </Button>
                  <Button
                    slot="close"
                    variant="danger"
                    onPress={handleResetSystem}
                  >
                    确定重置
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </div>
    </div>
  );
};

/** Small pill toggle indicator shown on the right of each setting row. */
const ToggleDot: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
      active ? 'bg-[#007AFF]' : 'bg-black/15 dark:bg-white/15'
    }`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
        active ? 'translate-x-3.5' : 'translate-x-0.5'
      }`}
    />
  </span>
);
