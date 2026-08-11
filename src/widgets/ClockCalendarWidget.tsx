import React, { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, ToggleLeft, ToggleRight } from 'lucide-react';


export const ClockCalendarWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const [isDigitalMode, setIsDigitalMode] = useState(true);

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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // Calendar setup for current month
  const currentYear = time.getFullYear();
  const currentMonth = time.getMonth();
  const todayDate = time.getDate();

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Analog Clock angles
  const secAngle = seconds * 6;
  const minAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <Clock size={16} className="text-[color:var(--accent)]" />
          <span className="font-bold tracking-tight">时间 & 日历</span>
        </div>

        <button
          onClick={() => {
            
            setIsDigitalMode(!isDigitalMode);
          }}
          className="flex items-center space-x-1 text-font-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <span>{isDigitalMode ? '数字时钟' : '模拟表盘'}</span>
        </button>
      </div>

      {/* Clock Display */}
      <div className="my-2 flex items-center justify-center">
        {isDigitalMode ? (
          <div className="text-center">
            <div className="text-lg font-extrabold tracking-tight font-mono text-[color:var(--accent)] drop-shadow-xs">
              {formattedTime}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">{formattedDate}</div>
          </div>
        ) : (
          /* Analog Clock Canvas */
          <div className="relative w-28 h-28 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-black/30 flex items-center justify-center shadow-inner">
            {/* Hour hand */}
            <div
              className="absolute w-1 h-8 bg-slate-800 dark:bg-slate-200 rounded-full origin-bottom bottom-1/2"
              style={{ transform: `rotate(${hourAngle}deg)` }}
            />
            {/* Minute hand */}
            <div
              className="absolute w-0.5 h-11 bg-slate-600 dark:bg-slate-300 rounded-full origin-bottom bottom-1/2"
              style={{ transform: `rotate(${minAngle}deg)` }}
            />
            {/* Second hand */}
            <div
              className="absolute w-0.5 h-12 bg-red-500 rounded-full origin-bottom bottom-1/2"
              style={{ transform: `rotate(${secAngle}deg)` }}
            />
            {/* Center Cap */}
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 z-10 border border-white" />
          </div>
        )}
      </div>

      {/* Mini Calendar Grid */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 text-xs">
        <div className="grid grid-cols-7 gap-1 text-center font-medium text-slate-400 text-font-sm mb-1">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-font-sm">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="p-1" />
          ))}
          {daysArray.map((day) => {
            const isToday = day === todayDate;
            return (
              <div
                key={day}
                className={`p-1 rounded-full font-medium transition-colors ${
                  isToday
                    ? 'bg-[color:var(--accent)] text-white font-bold shadow-xs'
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
