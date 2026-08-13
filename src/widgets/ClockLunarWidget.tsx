import React, { useEffect, useState } from 'react';
import { Moon, CalendarDays } from 'lucide-react';
import { getLunarDateText } from '../utils/lunar';
import { WidgetItem } from '../types';

// 农历时钟小组件：顶部显示当前时间，下方显示日期、星期与农历日期。
// 支持通过 widget.data 自定义顶部数字时间与下方文字的颜色 / 字号 / 是否加粗。
export const ClockLunarWidget: React.FC<{ widget?: WidgetItem }> = ({
  widget,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const weekday = time.toLocaleDateString('zh-CN', {
    weekday: 'long',
  });

  const lunarText = getLunarDateText(time);

  // 农历时钟字体自定义：color 作用于顶部时间与下方文字，size 作用于顶部数字时间字号，bold 仅作用于数字时间。
  const { color, size, bold } = widget?.data ?? {};
  const timeStyle: React.CSSProperties = {
    color,
    fontSize: size,
    fontWeight: bold ?? true ? 800 : 400,
  };
  const textColorStyle = color ? { color } : undefined;

  return (
    <div className="h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1 select-none text-white ">
      {/* 顶部：当前时间 */}
      <div className="text-center">
        <div
          className="tracking-tight font-mono leading-none tabular-nums"
          style={timeStyle}
        >
          {formattedTime}
        </div>
      </div>

      {/* 下方：日期、星期、农历 */}
      <div className="text-center space-y-3 ">
        <div
          className="flex items-center justify-center space-x-1.5 text-font-sm font-medium mt-3"
          style={textColorStyle}
        >
          <CalendarDays size={13} className="shrink-0" />
          <span>{formattedDate}</span>
          <span >·</span>
          <span >{weekday}</span>
        </div>
        <div
          className="flex items-center justify-center space-x-1.5 text-font-sm "
          style={textColorStyle}
        >
          <Moon size={13} className="shrink-0" />
          <span>{lunarText}</span>
        </div>
      </div>
    </div>
  );
};

export default ClockLunarWidget;
