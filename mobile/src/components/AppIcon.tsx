import React from 'react';
import { DesktopItem } from '../types';
import { AppIconRenderer } from './AppIconRenderer';

interface AppIconProps {
  item: DesktopItem;
  grayMode?: boolean;
  isEditMode?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  item,
  grayMode = true,
  isEditMode = false,
}) => {
  const displayName = item.name || item.title || '应用';
  const logoKey = item.logo || item.iconName;
  const bg = item.background || item.iconColor;

  return (
    <div className="w-full h-full flex flex-col items-center select-none relative group min-h-0">
      {/* Icon squircle - fills available height, keeps 1:1 square */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          className={`aspect-square h-full max-w-full rounded-[14px] flex items-center justify-center relative transition-transform duration-200 active:scale-95 ${
            grayMode
              ? 'bg-neutral-800/85 backdrop-blur-md border border-neutral-700/60 shadow-[0_4px_12px_rgba(0,0,0,0.35)]'
              : ''
          } ${isEditMode ? 'ring-2 ring-blue-400/60 animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`}
        >
          <AppIconRenderer
            name={displayName}
            logo={logoKey}
            iconName={logoKey}
            background={bg}
            iconColor={bg}
            grayMode={grayMode}
          />

          {/* Badge if present */}
          {item.badge && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white shadow-xs">
              {item.badge}
            </span>
          )}
        </div>
      </div>

      {/* App Title / Name */}
      <span className="text-[11px] font-medium text-white/95 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] text-center truncate w-full mt-1 leading-tight shrink-0">
        {displayName}
      </span>
    </div>
  );
};
