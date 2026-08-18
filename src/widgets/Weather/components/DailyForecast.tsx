import type { WeatherCondition } from '../../../types';
import { getWeatherIcon } from '../types';

interface Props {
  daily: WeatherCondition['dailyForecast'];
}

export const DailyForecast: React.FC<Props> = ({ daily }) => (
  <div className="pt-2 border-t border-black/5 dark:border-white/10">
    <div className="grid grid-cols-5 gap-1.5 text-center">
      {daily.map((day, idx) => (
        <div
          key={idx}
          className="p-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-between"
        >
          <span className="text-font-sm font-medium dark:text-slate-400">{day.day}</span>
          <div className="my-1">{getWeatherIcon(day.condition, 14)}</div>
          <span className="text-font-sm font-bold">{day.low}~{day.high}°</span>
        </div>
      ))}
    </div>
  </div>
);
