import React, { useState, useEffect } from 'react';


export const ClockCalendarWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1 select-none">
      {/* Clock Display */}
      <div className="flex items-center justify-center mb-1.5 shrink-0">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-[color:var(--accent)] drop-shadow-xs leading-tight">
            {formattedTime}
          </div>
          <div className="text-xs  mt-1 text-slate-500 dark:text-slate-400 leading-tight">
            {formattedDate}
          </div>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="pt-1.5 border-t border-black/5 dark:border-white/10 text-xs min-h-0 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-7 gap-1 text-center  text-slate-500 dark:text-slate-400 mb-1">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-slate-800 dark:text-slate-100">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="py-1" />
          ))}
          {daysArray.map((day) => {
            const isToday = day === todayDate;
            return (
              <div
                key={day}
                className={`py-1 rounded-full  transition-colors leading-none flex items-center justify-center ${
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
