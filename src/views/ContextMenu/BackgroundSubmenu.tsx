import React, { useRef, useState } from 'react';
import {
  CARD_BACKGROUND_OPTIONS,
  ContextMenuItemConfig,
} from '../../data/contextMenuConfig';
import { WidgetItem } from '../../types';
import { SubmenuFlyout } from './SubmenuFlyout';

/** 卡片背景纯色快捷选项 —— 一排并列的「磨砂 / 透明 / 纯黑 / 纯白」。 */
const SOLID_BG_COLORS: {
  label: string;
  value: string | undefined;
  theme?: 'light' | 'dark';
  type: 'glass' | 'transparent' | 'color';
}[] = [
  { label: '磨砂', value: undefined, type: 'glass' },
  { label: '透明', value: 'transparent', theme: 'light', type: 'transparent' },
  { label: '纯黑', value: '#1a1a1a', theme: 'dark', type: 'color' },
  { label: '纯白', value: '#FFFFFF', theme: 'light', type: 'color' },
];

interface BackgroundSubmenuProps {
  item: ContextMenuItemConfig;
  targetWidget: WidgetItem;
  onChangeWidgetBackground: (
    id: string,
    background?: string,
    backgroundTheme?: 'light' | 'dark',
  ) => void;
  onClose: () => void;
}

/**
 * 「切换卡片背景」hover 次级子菜单 —— 飞出到菜单右侧的 flyout。
 * 管理自身的展开状态与亮/暗选项卡，选中后通过 onChangeWidgetBackground 应用背景。
 */
export const BackgroundSubmenu: React.FC<BackgroundSubmenuProps> = ({
  item,
  targetWidget,
  onChangeWidgetBackground,
  onClose,
}) => {
  // Hover submenu state.
  const [bgSubmenuOpen, setBgSubmenuOpen] = useState(false);
  const submenuLeaveTimer = useRef<number | null>(null);

  // 卡片背景选项卡：手动切换亮色 / 暗色，而非按系统模式自动匹配。
  const [bgTab, setBgTab] = useState<'light' | 'dark'>('light');

  const backgroundOptions = CARD_BACKGROUND_OPTIONS.filter((w) => {
    if (!w.theme || w.theme === 'both') return true;
    return w.theme === bgTab;
  });

  const openBgSubmenu = () => {
    if (submenuLeaveTimer.current) {
      window.clearTimeout(submenuLeaveTimer.current);
      submenuLeaveTimer.current = null;
    }
    setBgSubmenuOpen(true);
  };

  const scheduleCloseBgSubmenu = () => {
    if (submenuLeaveTimer.current)
      window.clearTimeout(submenuLeaveTimer.current);
    submenuLeaveTimer.current = window.setTimeout(
      () => setBgSubmenuOpen(false),
      120,
    );
  };

  const Icon = item.icon;

  return (
    <>
      <div
        className="relative"
        onMouseEnter={openBgSubmenu}
        onMouseLeave={scheduleCloseBgSubmenu}
      >
        <button
          className={`w-full px-3 py-2.5 rounded-[var(--card-radius)] flex items-center justify-between text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10`}
        >
          <span className="flex items-center space-x-3">
            <Icon size={18} className="text-[color:var(--accent)]" />
            <span className="text-font-md">{item.label}</span>
          </span>
          <span className="text-slate-400 text-lg leading-none">›</span>
        </button>

        {/* Hover secondary submenu — pops out to the right of the menu */}
        {bgSubmenuOpen && (
          <SubmenuFlyout
            open={bgSubmenuOpen}
            onMouseEnter={openBgSubmenu}
            onMouseLeave={scheduleCloseBgSubmenu}
            className="absolute left-full top-0 ml-3 w-72 p-5 rounded-[var(--card-radius)] bg-white dark:bg-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.28)] border border-black/10 dark:border-white/15"
          >
            <div className="px-1 mb-3 text-font-md font-semibold dark:text-slate-400 tracking-wide">
              卡片背景
            </div>
            {/* 纯色快捷选项：磨砂 / 透明 / 纯黑 / 纯白 */}
            <div className="mb-3 grid grid-cols-4 gap-2">
              {SOLID_BG_COLORS.map((c) => {
                const isSelected =
                  c.type === 'glass'
                    ? targetWidget.cardStyle?.background === undefined &&
                      targetWidget.cardStyle?.backgroundTheme === undefined
                    : targetWidget.cardStyle?.background === c.value;

                return (
                  <button
                    key={c.label}
                    title={c.label}
                    onClick={() => {
                      onChangeWidgetBackground(
                        targetWidget.id,
                        c.value,
                        c.theme,
                      );
                      setBgSubmenuOpen(false);
                      onClose();
                    }}
                    style={
                      c.type === 'glass'
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            backdropFilter: 'blur(8px)',
                          }
                        : c.type === 'transparent'
                        ? {
                            backgroundImage:
                              'linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)',
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0,5px 5px',
                            backgroundColor: '#fff',
                          }
                        : { background: c.value }
                    }
                    className={`h-10 rounded-[var(--card-radius)] border-2 text-xs font-medium transition-all hover:scale-105 hover:shadow-md flex items-center justify-center ${
                      isSelected
                        ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/40'
                        : 'border-black/10 dark:border-white/15'
                    }`}
                  >
                    {c.type === 'glass' && (
                      <span className="text-slate-800 dark:text-slate-200 drop-shadow-xs">
                        磨砂
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 亮色 / 暗色 选项卡，点击切换 */}
            <div className="mb-4 flex p-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10">
              {(['light', 'dark'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setBgTab(tab)}
                  className={`flex-1 py-2 rounded-[var(--card-radius)] text-font-md font-semibold transition-colors ${
                    bgTab === tab
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow'
                      : 'dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'light' ? '亮色' : '暗色'}
                </button>
              ))}
            </div>

        

            <div className="grid grid-cols-4 gap-3.5">
              {backgroundOptions.map((g) => (
                <button
                  key={g.gradient}
                  title={g.gradient}
                  onClick={() => {
                    const t =
                      g.theme === 'dark' || g.theme === 'light'
                        ? g.theme
                        : undefined;
                    onChangeWidgetBackground(targetWidget.id, g.gradient, t);
                    setBgSubmenuOpen(false);
                    onClose();
                  }}
                  style={{ background: g.gradient }}
                  className={`h-12 rounded-[var(--card-radius)] border-2 hover:scale-110 hover:shadow-lg ${
                    targetWidget.cardStyle?.background === g.gradient
                      ? 'border-[color:var(--accent)] ring-4 ring-[color:var(--accent)]/40'
                      : 'border-white/50 dark:border-white/15'
                  }`}
                />
              ))}
            </div>
          </SubmenuFlyout>
        )}
      </div>

      {item.dividerAfter && (
        <div className="my-1 border-t border-black/5 dark:border-white/10" />
      )}
    </>
  );
};
