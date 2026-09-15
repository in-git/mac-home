import React from 'react';
import { DesktopItem, SubApp } from '../types';

interface FolderModalProps {
  item: DesktopItem | null;
  grayMode?: boolean;
  onClose: () => void;
  onAppClick?: (subApp: SubApp) => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  item,
  grayMode = true,
  onClose,
  onAppClick,
}) => {
  if (!item) return null;

  const subApps = item.subApps || [];

  const renderModalAppIcon = (sub: SubApp) => {
    if (grayMode) {
      return (
        <div className="w-[72px] h-[72px] rounded-[22px] bg-neutral-800/90 border border-neutral-700/60 shadow-[0_4px_16px_rgba(0,0,0,0.35)] flex items-center justify-center text-2xl font-bold text-neutral-200">
          {sub.symbol || sub.name.slice(0, 1)}
        </div>
      );
    }

    return (
      <div
        style={{ backgroundColor: sub.color || '#3b82f6' }}
        className="w-[72px] h-[72px] rounded-[22px] shadow-lg flex items-center justify-center text-2xl font-bold text-white border border-white/15"
      >
        {sub.symbol || sub.name.slice(0, 1)}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xl flex items-center justify-center p-5 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] rounded-[32px] bg-neutral-900/85 backdrop-blur-2xl border border-neutral-700/60 p-6 flex flex-col items-center shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Folder Title (No close button as requested) */}
        <h3 className="text-xl font-bold tracking-tight text-white/95 text-center mb-6">
          {item.name || item.title}
        </h3>

        {/* Sub-apps 3-column Grid */}
        <div className="grid grid-cols-3 gap-y-6 gap-x-3 w-full justify-items-center py-1">
          {subApps.map((sub) => (
            <div
              key={sub.id}
              className="flex flex-col items-center cursor-pointer group active:scale-90 transition-transform duration-150"
              onClick={() => {
                if (onAppClick) {
                  onAppClick(sub);
                } else {
                  alert(`打开应用: ${sub.name}`);
                }
              }}
            >
              {renderModalAppIcon(sub)}
              <span className=" font-medium text-neutral-200 tracking-tight text-center truncate max-w-[88px] mt-2 leading-tight">
                {sub.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
