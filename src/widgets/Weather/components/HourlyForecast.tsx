import { WeatherCondition } from '../../../types';
import { getWeatherIcon } from '../types';

interface Props {
  hourly: WeatherCondition['hourlyForecast'];
}

export const HourlyForecast: React.FC<Props> = ({ hourly }) => (
  <div>
    <div className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">每小时预报</div>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {hourly.map((h, i) => (
        <div
          key={i}
          className="flex min-w-[56px] flex-col items-center rounded-xl bg-white/40 px-2 py-3 dark:bg-white/5"
        >
          <span className="text-xs text-slate-500 dark:text-slate-400">{h.time}</span>
          <span className="my-1 text-xl">{getWeatherIcon(h.condition)}</span>
          <span className="text-sm  text-slate-700 dark:text-slate-200">{h.temp}°</span>
        </div>
      ))}
    </div>
  </div>
);
