import type React from 'react';
import type { AIConfig, CardRadiusTier } from '../../types';

export type SettingsTab = 'appearance' | 'system' | 'ai' | 'pet';

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
  onExport: () => void;
  onReset: () => void;
  justReset: boolean;
  importMsg: { type: 'success' | 'error'; text: string } | null;
  onImportFile: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  justResetSystem: boolean;
  onResetSystem: () => void;
}

export interface AIPanelProps {
  config: AIConfig;
  onChange: (patch: Partial<AIConfig>) => void;
}

export interface PetPanelProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  interval: number;
  onIntervalChange: (seconds: number) => void;
}
