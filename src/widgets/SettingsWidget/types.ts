import type React from 'react';
import type { CardRadiusTier } from '../../types';

export type SettingsTab = 'appearance' | 'system';

export interface AppearancePanelProps {
  isDarkMode: boolean;
  setDarkMode: (v: boolean) => void;
  themeColor: string;
  setThemeColor: (v: string) => void;
  fontVariant: 'A' | 'B' | 'C';
  setFontVariant: (v: 'A' | 'B' | 'C') => void;
  cardRadius: CardRadiusTier;
  setCardRadius: (v: CardRadiusTier) => void;
}

export interface SystemPanelProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  showResizeHandle: boolean;
  onToggleResizeHandle: () => void;
  onExport: () => void;
  importMsg: { type: 'success' | 'error'; text: string } | null;
  onImportFile: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  justResetSystem: boolean;
  onResetSystem: () => void;
}
