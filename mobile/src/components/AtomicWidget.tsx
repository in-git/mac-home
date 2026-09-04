import React, { useState, useEffect } from 'react';
import { DesktopItem } from '../types';

interface AtomicWidgetProps {
  item: DesktopItem;
  isEditMode?: boolean;
  grayMode?: boolean;
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const AtomicWidget: React.FC<AtomicWidgetProps> = ({
  item,
  isEditMode = false,
  grayMode = true,
}) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  const month = String(currentTime.getMonth() + 1).padStart(2, '0');
  const day = String(currentTime.getDate()).padStart(2, '0');
  const dateStr = `${month}/${day}`;
  const weekdayStr = WEEKDAYS[currentTime.getDay()];

  return (
    <div className="w-full h-full flex flex-col items-center select-none min-h-0">
      {/* Widget Container Card */}
      <div
        className={`flex-1 min-h-0 w-full rounded-[16px] px-4 py-2 flex items-center justify-between transition-all duration-200 ${
          grayMode
            ? 'bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)]'
            : 'bg-white/18 backdrop-blur-2xl border border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.25)]'
        } ${isEditMode ? 'ring-2 ring-blue-400/50' : ''}`}
      >
        {/* Left: Big Digital Time */}
        <div className="flex items-baseline">
          <span className="text-[28px] font-bold text-white tracking-tight leading-none font-mono">
            {timeStr}
          </span>
        </div>

        {/* Right: Dynamic Date & Weekday (Location removed as requested) */}
        <div className="flex flex-col items-end justify-center text-[11px] leading-tight text-white/90">
          <span className="text-white/85 font-medium">{dateStr}</span>
          <span className="text-rose-400 font-semibold text-[10.5px] mt-0.5">{weekdayStr}</span>
        </div>
      </div>

      {/* Widget Label */}
      <span className="text-[11px] font-medium text-white/90 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] text-center mt-1 shrink-0">
        {item.title}
      </span>
    </div>
  );
};
