import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHomeStore } from '../../store/useHomeStore';
import { playSound } from '../../utils/sound';
import { parseImport } from './constants';
import { AIPanel } from './panels/AIPanel';
import { AppearancePanel } from './panels/AppearancePanel';
import { PetPanel } from './panels/PetPanel';
import { SystemPanel } from './panels/SystemPanel';
import type { SettingsTab } from './types';

export const SettingsWidget: React.FC<{
  activeTab: SettingsTab;
}> = ({ activeTab }) => {
  const {
    isDarkMode,
    setDarkMode,
    themeColor,
    setThemeColor,
    soundEnabled,
    setSoundEnabled,
    fontVariant,
    setFontVariant,
    cardRadius,
    setCardRadius,
    resetLayout,
    setWidgets,
    updateNotes,
    widgets,
    notes,
    resetAll,
    aiConfig,
    setAiConfig,
    petAutoActivity,
    setPetAutoActivity,
    petActivityInterval,
    setPetActivityInterval,
  } = useHomeStore(
    useShallow((s) => ({
      isDarkMode: s.isDarkMode,
      setDarkMode: s.setDarkMode,
      themeColor: s.themeColor,
      setThemeColor: s.setThemeColor,
      soundEnabled: s.soundEnabled,
      setSoundEnabled: s.setSoundEnabled,
      fontVariant: s.fontVariant,
      setFontVariant: s.setFontVariant,
      cardRadius: s.cardRadius,
      setCardRadius: s.setCardRadius,
      resetLayout: s.resetLayout,
      setWidgets: s.setWidgets,
      updateNotes: s.updateNotes,
      widgets: s.widgets,
      notes: s.notes,
      resetAll: s.resetAll,
      aiConfig: s.aiConfig,
      setAiConfig: s.setAiConfig,
      petAutoActivity: s.petAutoActivity,
      setPetAutoActivity: s.setPetAutoActivity,
      petActivityInterval: s.petActivityInterval,
      setPetActivityInterval: s.setPetActivityInterval,
    })),
  );

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
        <>
          <AIPanel config={aiConfig} onChange={setAiConfig} />

          <div className="mt-6 pt-5 border-t border-black/5 dark:border-white/10">
            <PetPanel
              enabled={petAutoActivity}
              onToggleEnabled={() => setPetAutoActivity(!petAutoActivity)}
              interval={petActivityInterval}
              onIntervalChange={setPetActivityInterval}
            />
          </div>
        </>
      )}
    </div>
  );
};
