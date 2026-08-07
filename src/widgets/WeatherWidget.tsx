import React, { useState } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Zap,
  Wind,
  Droplets,
  Search,
  Compass,
  MapPin
} from 'lucide-react';
import { PRESET_WEATHER } from '../data/presetData';
import { playSound } from '../utils/sound';

export const WeatherWidget: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState('上海');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const weather = PRESET_WEATHER[selectedCity] || PRESET_WEATHER['上海'];

  const getWeatherIcon = (cond: string, size = 18) => {
    switch (cond) {
      case 'sunny':
        return <Sun size={size} className="text-amber-400 fill-amber-400/20" />;
      case 'cloudy':
        return <Cloud size={size} className="text-slate-400 fill-slate-300/20" />;
      case 'rainy':
        return <CloudRain size={size} className="text-sky-400" />;
      case 'snowy':
        return <Snowflake size={size} className="text-blue-300" />;
      case 'thunder':
        return <Zap size={size} className="text-yellow-400" />;
      default:
        return <Sun size={size} className="text-amber-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1">
      {/* City Header & Selector */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <MapPin size={14} className="text-[#007AFF]" />
          <div className="font-bold text-sm tracking-tight">
            {weather.city}, {weather.country}
          </div>
        </div>

        {/* City Switcher dropdown */}
        <div className="flex items-center space-x-1">
          {Object.keys(PRESET_WEATHER).map((c) => (
            <button
              key={c}
              onClick={() => {
                playSound.playClick();
                setSelectedCity(c);
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                selectedCity === c
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Weather Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
        {/* Current Temp */}
        <div className="glass-panel p-3.5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-blue-500/10 to-sky-400/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              实时天气
            </span>
            {getWeatherIcon(weather.condition, 24)}
          </div>
          <div className="my-1">
            <div className="text-3xl font-extrabold tracking-tight">{weather.temp}°</div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
              {weather.condition === 'sunny' && '晴朗'}
              {weather.condition === 'cloudy' && '多云'}
              {weather.condition === 'rainy' && '小雨到中雨'}
              {weather.condition === 'snowy' && '降雪'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>最高 {weather.high}°</span>
            <span>最低 {weather.low}°</span>
          </div>
        </div>

        {/* Hourly Forecast Strip */}
        <div className="md:col-span-2 glass-panel p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
            逐小时预报
          </div>
          <div className="flex items-center justify-between overflow-x-auto no-scrollbar space-x-2 py-1">
            {weather.hourlyForecast.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center shrink-0 min-w-[42px] space-y-1">
                <span className="text-[10px] text-slate-400">{item.time}</span>
                {getWeatherIcon(item.condition, 16)}
                <span className="text-xs font-semibold">{item.temp}°</span>
              </div>
            ))}
          </div>
          {/* Weather Params Footer */}
          <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/10 grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex items-center space-x-1 text-slate-500">
              <Droplets size={12} className="text-blue-500" />
              <span>湿度 {weather.humidity}%</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-500">
              <Wind size={12} className="text-sky-500" />
              <span>风速 {weather.windSpeed} km/h</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-500">
              <Compass size={12} className="text-amber-500" />
              <span>AQI {weather.aqi} ({weather.aqiLabel})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast Row */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10">
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {weather.dailyForecast.map((day, idx) => (
            <div
              key={idx}
              className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-between"
            >
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {day.day}
              </span>
              <div className="my-1">{getWeatherIcon(day.condition, 14)}</div>
              <span className="text-[11px] font-bold">{day.high}°</span>
              <span className="text-[10px] text-slate-400">{day.low}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
