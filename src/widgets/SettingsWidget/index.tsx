import React, { useEffect, useRef, useState } from 'react';
import { useHomeStore } from '../../store/useHomeStore';
import { playSound } from '../../utils/sound';
import { parseImport } from './constants';
import { AppearancePanel } from './panels/AppearancePanel';
import { SystemPanel } from './panels/SystemPanel';
import { AIPanel } from './panels/AIPanel';
import type { SettingsTab } from './types';

export const SettingsWidget: React.FC<{
  activeTab: SettingsTab;
}> = ({ activeTab }) => {
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
  const setWidgets = useHomeStore((s) => s.setWidgets);
  const updateNotes = useHomeStore((s) => s.updateNotes);
  const widgets = useHomeStore((s) => s.widgets);
  const notes = useHomeStore((s) => s.notes);
  const resetAll = useHomeStore((s) => s.resetAll);
  const aiConfig = useHomeStore((s) => s.aiConfig);
  const setAiConfig = useHomeStore((s) => s.setAiConfig);

  const [justReset, setJustReset] = useState(false);
  const [justResetSystem, setJustResetSystem] = useState(false);
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
    <div className="h-full flex flex-col text-slate-800 dark:text-slate-100">
      {activeTab === 'appearance' && (
        <AppearancePanel
          isDarkMode={isDarkMode}
          setDarkMode={setDarkMode}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          fontVariant={fontVariant}
          setFontVariant={setFontVariant}
          cardRadius={cardRadius}
          setCardRadius={setCardRadius}
          openWallpaper={openWallpaper}
        />
      )}

      {activeTab === 'system' && (
        <SystemPanel
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onExport={handleExport}
          onReset={handleReset}
          justReset={justReset}
          importMsg={importMsg}
          onImportFile={handleImportFile}
          fileInputRef={fileInputRef}
          justResetSystem={justResetSystem}
          onResetSystem={handleResetSystem}
        />
      )}

      {activeTab === 'ai' && (
        <AIPanel config={aiConfig} onChange={setAiConfig} />
      )}
    </div>
  );
};
