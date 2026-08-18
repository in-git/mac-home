import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHomeStore } from '../../store/useHomeStore';
import { playSound } from '../../utils/sound';
import { parseImport } from './constants';
import { CURRENT_DATA_VERSION } from '../../utils/migration';
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
    selectedRoleId,
    setSelectedRoleId,
    updateWallpaper,
    setScreenBrightness,
    setWeatherCities,
    setSelectedCityId,
    setLastLocation,
  } = useHomeStore(
    useShallow((s) => s),
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
    const run = async () => {
      try {
        const text = await file.text();
        try {
          const cfg = parseImport(text);
          const { widgets: w, notes: n } = cfg;
          setWidgets(w);
          updateNotes(n);
          if (cfg.wallpaper) updateWallpaper(cfg.wallpaper);
          if (cfg.isDarkMode !== undefined) setDarkMode(cfg.isDarkMode);
          if (cfg.themeColor !== undefined) setThemeColor(cfg.themeColor);
          if (cfg.soundEnabled !== undefined) setSoundEnabled(cfg.soundEnabled);
          if (cfg.fontVariant !== undefined) setFontVariant(cfg.fontVariant);
          if (cfg.cardRadius !== undefined) setCardRadius(cfg.cardRadius);
          if (cfg.screenBrightness !== undefined)
            setScreenBrightness(cfg.screenBrightness);
          if (cfg.aiConfig !== undefined) setAiConfig(cfg.aiConfig);
          if (cfg.petAutoActivity !== undefined)
            setPetAutoActivity(cfg.petAutoActivity);
          if (cfg.weatherCities !== undefined)
            setWeatherCities(cfg.weatherCities);
          if (cfg.selectedCityId !== undefined)
            setSelectedCityId(cfg.selectedCityId);
          if (cfg.lastLocation !== undefined) setLastLocation(cfg.lastLocation);

          const parts = [`${w.length} 个组件`, `${n.length} 条便签`];
          if (cfg.wallpaper) parts.push('桌面背景');
          if (cfg.themeColor || cfg.isDarkMode !== undefined)
            parts.push('外观设置');
          setImportMsg({
            type: 'success',
            text: `已导入 ${parts.join('、')}`,
          });
        } catch (err) {
          setImportMsg({
            type: 'error',
            text: err instanceof Error ? err.message : '导入失败',
          });
        }
      } catch {
        setImportMsg({ type: 'error', text: '读取文件失败' });
      }
    };
    run();
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

  // 导出布局：将本地存储的全部持久化数据（组件、壁纸、便签、外观、主题、音效、字体、圆角、
  // 亮度、AI 配置、桌宠、天气城市与定位等）序列化为 JSON 下载。
  const handleExport = () => {
    const s = useHomeStore.getState();
    const payload = {
      app: 'macOS 主页',
      version: CURRENT_DATA_VERSION,
      exportedAt: new Date().toISOString(),
      ...s
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
          cardRadius={cardRadius}
          setCardRadius={setCardRadius}
        />
      )}

      {activeTab === 'system' && (
        <SystemPanel
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          fontVariant={fontVariant}
          setFontVariant={setFontVariant}
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
          <PetPanel
            enabled={petAutoActivity}
            onToggleEnabled={() => setPetAutoActivity(!petAutoActivity)}
            selectedRoleId={selectedRoleId}
            onSelectRole={setSelectedRoleId}
          />
          <AIPanel config={aiConfig} onChange={setAiConfig} />
        </>
      )}
    </div>
  );
};
