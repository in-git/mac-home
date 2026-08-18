import { Compass, Droplets, Wind } from 'lucide-react';
import type { WeatherCondition } from '../../../types';
import { AQI_LABEL_CN, CONDITION_TEXT, getWeatherIcon } from '../types';

interface Props {
  weather: WeatherCondition;
}

export const CurrentWeatherCard: React.FC<Props> = ({ weather }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-1 flex-1 min-h-0">
    {/* Current Temp */}
    <div className="glass-panel p-4 rounded-[var(--card-radius)] flex flex-col justify-between bg-gradient-to-br from-blue-500/10 to-sky-400/10">
      <div className="flex items-center justify-between">
        <span className="text-font-sm   uppercase tracking-wider">
          实时天气
        </span>
        {getWeatherIcon(weather.condition, 24)}
      </div>
      <div className="my-2">
        <div className="text-2xl font-extrabold tracking-tight">{weather.temp}°</div>
        <div className="text-xs    capitalize mt-0.5">
          {CONDITION_TEXT[weather.condition] ?? weather.condition}
        </div>
      </div>
      <div className="flex items-center justify-between text-font-sm ">
        <span>最高 {weather.high}°</span>
        <span>最低 {weather.low}°</span>
      </div>
    </div>

    {/* Hourly Forecast Strip */}
    <div className="md:col-span-2 glass-panel p-4 rounded-[var(--card-radius)] flex flex-col justify-between">
      <div className="text-font-sm   mb-2 uppercase tracking-wider">
        逐小时预报
      </div>
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar space-x-2 py-2 my-auto">
        {weather.hourlyForecast.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center shrink-0 min-w-[42px] space-y-1.5"
          >
            <span className="text-font-sm ">{item.time}</span>
            {getWeatherIcon(item.condition, 18)}
            <span className="text-xs ">{item.temp}°</span>
          </div>
        ))}
      </div>
      {/* Weather Params Footer */}
      <div className="pt-2.5 mt-1 border-t border-black/5 dark:border-white/10 grid grid-cols-3 gap-2 text-font-sm">
        <div className="flex items-center space-x-1 ">
          <Droplets size={13} className="text-blue-500" />
          <span>湿度 {weather.humidity}%</span>
        </div>
        <div className="flex items-center space-x-1 ">
          <Wind size={13} className="text-sky-500" />
          <span>风速 {weather.windSpeed} km/h</span>
        </div>
        <div className="flex items-center space-x-1 ">
          <Compass size={13} className="text-amber-500" />
          <span>
            {weather.aqi >= 0
              ? `AQI ${weather.aqi} (${AQI_LABEL_CN[weather.aqiLabel] ?? weather.aqiLabel})`
              : 'AQI 暂无数据'}
          </span>
        </div>
      </div>
    </div>
  </div>
);
