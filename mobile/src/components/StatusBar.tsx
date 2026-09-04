import React from 'react';
import { Music, MessageCircle, Wifi, Activity } from 'lucide-react';

interface StatusBarProps {
  time?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({ time = '19:24' }) => {
  return (
    <div className="w-full pt-2 pb-1.5 px-4 flex items-center justify-between text-white text-[11px] font-medium select-none z-30 tracking-tight">
      {/* Left side: Time and notification icons */}
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-bold tracking-tight text-white/95">
          {time}
        </span>
        <div className="flex items-center gap-1 ml-0.5">
          {/* Music notification badge */}
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/90 flex items-center justify-center text-[8px] text-white">
            <Music className="w-2.5 h-2.5 text-white stroke-[2.5]" />
          </span>
          {/* Message notification badge */}
          <span className="w-3.5 h-3.5 rounded-full bg-cyan-400/90 flex items-center justify-center text-[8px] text-white">
            <MessageCircle className="w-2.5 h-2.5 text-white stroke-[2.5]" />
          </span>
        </div>
      </div>

      {/* Right side: Network speed, Dual 4G, WiFi, Battery */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/90">
        {/* Activity / sensor icon */}
        <Activity className="w-3 h-3 text-white/80" />

        {/* Speed */}
        <div className="flex flex-col items-end leading-[10px] text-[9px] font-mono">
          <span>0.00</span>
          <span className="text-[7.5px] text-white/70">KB/s</span>
        </div>

        {/* First 4G SIM */}
        <div className="flex items-center gap-0.5">
          <span className="text-[8px] font-bold text-white/90">4G</span>
          <div className="flex items-end gap-[1px] h-2.5">
            <span className="w-[1.5px] h-1 bg-white rounded-xs" />
            <span className="w-[1.5px] h-1.5 bg-white rounded-xs" />
            <span className="w-[1.5px] h-2 bg-white rounded-xs" />
            <span className="w-[1.5px] h-2.5 bg-white rounded-xs" />
          </div>
        </div>

        {/* Second 4G SIM */}
        <div className="flex items-center gap-0.5">
          <span className="text-[8px] font-bold text-white/90">4G</span>
          <div className="flex items-end gap-[1px] h-2.5">
            <span className="w-[1.5px] h-1 bg-white rounded-xs" />
            <span className="w-[1.5px] h-1.5 bg-white rounded-xs" />
            <span className="w-[1.5px] h-2 bg-white rounded-xs" />
            <span className="w-[1.5px] h-2.5 bg-white rounded-xs" />
          </div>
        </div>

        {/* WiFi */}
        <Wifi className="w-3.5 h-3.5 text-white stroke-[2.5]" />

        {/* Battery with 65% inside */}
        <div className="flex items-center">
          <div className="w-6 h-3.5 rounded-[4px] border border-white/80 p-[1.5px] flex items-center justify-center relative bg-black/20">
            <span className="text-[8px] font-bold leading-none text-white tracking-tighter">
              65
            </span>
            <span className="absolute -right-[2.5px] top-1 bottom-1 w-[2px] bg-white/80 rounded-r-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
};
