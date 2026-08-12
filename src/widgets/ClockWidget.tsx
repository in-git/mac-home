import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// 精简版时钟小组件：模拟表盘 + 数字时间 + 日期。
// 区别于 ClockCalendarWidget（时间 & 日历，含月历网格）。
export const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const formattedTime = time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 p-1 select-none">
      {/* Analog dial */}
      <div className="relative w-20 h-20 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-black/30 flex items-center justify-center shadow-inner">
        {[
          { n: 12, style: { top: 4, left: '50%', transform: 'translateX(-50%)' } },
          { n: 3, style: { right: 4, top: '50%', transform: 'translateY(-50%)' } },
          { n: 6, style: { bottom: 4, left: '50%', transform: 'translateX(-50%)' } },
          { n: 9, style: { left: 4, top: '50%', transform: 'translateY(-50%)' } },
        ].map(({ n, style }) => (
          <span
            key={n}
            className="absolute text-font-sm font-bold dark:text-slate-400"
            style={style}
          >
            {n}
          </span>
        ))}
        {/* Hour hand */}
        <div
          className="absolute w-1 h-6 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom bottom-1/2"
          style={{ transform: `rotate(${hourAngle}deg)` }}
        />
        {/* Minute hand */}
        <div
          className="absolute w-0.5 h-8 bg-slate-600 dark:bg-slate-300 rounded-full origin-bottom bottom-1/2"
          style={{ transform: `rotate(${minAngle}deg)` }}
        />
        {/* Second hand */}
        <div
          className="absolute w-0.5 h-9 bg-red-500 rounded-full origin-bottom bottom-1/2"
          style={{ transform: `rotate(${secAngle}deg)` }}
        />
        <div className="w-2 h-2 rounded-full bg-red-500 z-10 border border-white" />
      </div>

      {/* Digital time */}
      <div className="mt-2 text-lg font-extrabold tracking-tight font-mono text-[color:var(--accent)]">
        {formattedTime}
      </div>
      <div className="text-font-sm font-medium dark:text-slate-400">
        {formattedDate}
      </div>
    </div>
  );
};

export default ClockWidget;
