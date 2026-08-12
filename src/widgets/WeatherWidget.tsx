import {
  Cloud,
  CloudRain,
  Compass,
  Droplets,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Snowflake,
  Sun,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { PRESET_DATA } from '../data/presetData';
import { WeatherCondition } from '../types';

import {
  cityIdOf,
  CitySearchResult,
  fetchWeather,
  reverseGeocodeCityName,
  searchCity,
  WeatherCity,
} from '../utils/weatherApi';
import { useHomeStore } from '../store/useHomeStore';

/** 首次加载自动定位标记（只自动尝试一次，避免每次刷新都弹授权） */
const LOCATION_TRIED_KEY = 'weather-location-tried';

/** 卡片天气汇总，用于同步给顶部状态栏（以卡片为准） */
export interface WeatherSummary {
  cityName: string;
  country: string;
  temp: number | null;
}

const CONDITION_TEXT: Record<string, string> = {
  sunny: '晴朗',
  cloudy: '多云',
  rainy: '小雨到中雨',
  snowy: '降雪',
  thunder: '雷暴',
};

const AQI_LABEL_CN: Record<string, string> = {
  Excellent: '优',
  Good: '良',
  Moderate: '中度',
  Unhealthy: '重度',
};

export const WeatherWidget: React.FC<{ onWeatherChange?: (s: WeatherSummary) => void }> = ({
  onWeatherChange,
}) => {
  // 城市列表与选中项统一由主页 store（zustand + persist）持久化，避免组件内散落的 localStorage 调用
  const cities = useHomeStore((s) => s.weatherCities);
  const selectedId = useHomeStore((s) => s.selectedCityId);
  const setWeatherCities = useHomeStore((s) => s.setWeatherCities);
  const setSelectedCityId = useHomeStore((s) => s.setSelectedCityId);
  const [weather, setWeather] = useState<WeatherCondition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [locating, setLocating] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? cities[0];

  /** 切换选中城市（store 自动持久化，保证下次进入恢复） */
  const selectCity = (id: string) => {
    setSelectedCityId(id);
  };

  // 加载选中城市的实时天气
  useEffect(() => {
    if (!selectedCity) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWeather(selectedCity)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError('实时天气获取失败，显示离线数据');
        setWeather(PRESET_DATA.PRESET_WEATHER[selectedCity.name] ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, refreshKey]);

  // 把当前选中城市与天气同步给父级（顶部状态栏以卡片为准）
  const onWeatherChangeRef = useRef(onWeatherChange);
  onWeatherChangeRef.current = onWeatherChange;
  useEffect(() => {
    const cb = onWeatherChangeRef.current;
    if (!cb) return;
    cb({
      cityName: selectedCity?.name ?? '',
      country: selectedCity?.country ?? '',
      temp: weather ? weather.temp : null,
    });
  }, [selectedCity, weather]);

  // 城市搜索（300ms 防抖）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchCity(searchQuery.trim())
        .then((results) => setSearchResults(results))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const addCity = (result: CitySearchResult) => {
    const id = cityIdOf(result.latitude, result.longitude);
    let next = cities;
    if (!cities.some((c) => c.id === id)) {
      next = [
        ...cities,
        {
          id,
          name: result.name,
          country: result.country,
          admin1: result.admin1,
          latitude: result.latitude,
          longitude: result.longitude,
        },
      ];
      setWeatherCities(next);
    }
    setSelectedCityId(id);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  const removeCity = (id: string) => {
    const next = cities.filter((c) => c.id !== id);
    if (next.length === 0) return; // 至少保留一个城市
    setWeatherCities(next); // store 会自动在被删城市为选中项时回退选中
  };

  /** 自动定位：坐标 → 反向解析城市 → 切换到该城市 */
  const locate = async () => {
    if (locating) return;
    setLocating(true);
    setError(null);

    // 1. 优先浏览器 Geolocation（仅安全上下文可用：https 或 localhost）
    let coords: { latitude: number; longitude: number } | null = null;
    if (window.isSecureContext && 'geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 10 * 60 * 1000,
          });
        });
        coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      } catch {
        coords = null; // 拒绝授权/超时/非安全上下文 → 走 IP 回退
      }
    }

    // 2. IP 地理定位回退（无需授权，http 局域网下也能用）
    if (!coords) {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            coords = { latitude: data.latitude, longitude: data.longitude };
          }
        }
      } catch {
        coords = null;
      }
    }

    if (!coords) {
      setError('定位失败，已为你显示默认城市');
      setLocating(false);
      return;
    }

    const { latitude, longitude } = coords;
    try {
      const cityName = await reverseGeocodeCityName(latitude, longitude);
      if (cityName) {
        // 优先用正向地理编码规范化为标准城市坐标
        const results = await searchCity(cityName);
        if (results.length > 0) {
          addCity(results[0]);
          return;
        }
      }
      // 回退：直接以当前坐标作为城市
      addCity({
        id: -1,
        name: cityName ?? '当前位置',
        country: '未知',
        latitude,
        longitude,
      });
    } catch {
      setError('定位失败，已为你显示默认城市');
    } finally {
      setLocating(false);
    }
  };

  // 首次加载自动定位一次（浏览器授权弹窗只出现一次）
  useEffect(() => {
    if (localStorage.getItem(LOCATION_TRIED_KEY)) return;
    localStorage.setItem(LOCATION_TRIED_KEY, '1');
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getWeatherIcon = (cond: string, size = 18) => {
    switch (cond) {
      case 'sunny':
        return <Sun size={size} className="text-amber-400 fill-amber-400/20" />;
      case 'cloudy':
        return (
          <Cloud size={size} className="text-slate-400 fill-slate-300/20" />
        );
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

  const renderSkeleton = () => (
    <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
      {/* 实时天气：对应主卡片（高度与数据卡完全一致） */}
      <div className="glass-panel p-3.5 rounded-[var(--card-radius)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="my-1">
          <div className="h-7 w-16 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-4 w-14 bg-slate-200 dark:bg-white/10 rounded mt-1.5" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-12 bg-slate-200 dark:bg-white/10 rounded" />
          <div className="h-3.5 w-12 bg-slate-200 dark:bg-white/10 rounded" />
        </div>
      </div>

      {/* 逐小时预报：对应 col-span-2 卡片 */}
      <div className="md:col-span-2 glass-panel p-3.5 rounded-[var(--card-radius)] flex flex-col justify-between">
        <div className="h-3.5 w-20 bg-slate-200 dark:bg-white/10 rounded mb-2" />
        <div className="flex items-center justify-between">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-3.5 w-6 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-3 w-6 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
        {/* 天气参数(湿度/风速/AQI) */}
        <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/10 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3.5 w-full bg-slate-200 dark:bg-white/10 rounded" />
          ))}
        </div>
      </div>

      {/* 5天预报：对应底部 5 列 */}
      <div className="md:col-span-3 pt-2 border-t border-black/5 dark:border-white/10">
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-between gap-1"
            >
              <div className="h-3.5 w-6 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="h-3.5 w-6 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="h-3.5 w-4 bg-slate-200 dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1">
      {/* City Header & Selector */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-2 shrink-0">
          <MapPin size={14} className="text-[color:var(--accent)]" />
          <div className="font-bold text-sm tracking-tight whitespace-nowrap">
            {selectedCity
              ? `${selectedCity.name}, ${selectedCity.country}`
              : '未选择城市'}
          </div>
          <button
            onClick={() => {
              
              locate();
            }}
            title="自动定位到当前位置"
            disabled={locating}
            className="p-1 rounded-[var(--card-radius)]  hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-60"
          >
            {locating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <LocateFixed size={13} />
            )}
          </button>
          <button
            onClick={() => {
              
              setRefreshKey((k) => k + 1);
            }}
            title="刷新天气"
            className="p-1 rounded-[var(--card-radius)]  hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* City switcher chips */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {cities.map((c) => (
            <div key={c.id} className="relative shrink-0">
              <button
                onClick={() => {
                  
                  selectCity(c.id);
                }}
                className={`px-2 py-0.5 rounded-[var(--card-radius)] text-font-sm font-medium transition-colors whitespace-nowrap ${
                  c.id === selectedId
                    ? 'bg-[color:var(--accent)] text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/20'
                }`}
              >
                {c.name}
              </button>
              {cities.length > 1 && (
                <button
                  onClick={() => removeCity(c.id)}
                  title="移除城市"
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                >
                  <X size={8} strokeWidth={3} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              setSearchOpen((o) => !o);
              if (!searchOpen)
                setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            title="添加城市"
            className="shrink-0 p-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 hover:bg-[color:var(--accent)] hover:text-white transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* City search panel */}
      {searchOpen && (
        <div className="relative mb-2">
          <div className="flex items-center gap-1.5 glass-panel rounded-[var(--card-radius)] px-2.5 py-1.5">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              placeholder="搜索城市，如：广州、纽约…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 py-0.5 min-w-0"
            />
            {searching && (
              <Loader2
                size={12}
                className="animate-spin  shrink-0"
              />
            )}
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X size={12} />
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 glass-panel rounded-[var(--card-radius)] p-1 max-h-56 overflow-y-auto shadow-xl">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addCity(r)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--card-radius)] text-left hover:bg-[color:var(--accent)]/10 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {r.name}
                    <span className="text-font-sm  ml-1">
                      {r.admin1 ? `${r.admin1} · ` : ''}
                      {r.country}
                    </span>
                  </span>
                  <Plus size={12} className="text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim() && !searching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 glass-panel rounded-[var(--card-radius)] p-2.5 text-center text-font-sm ">
              未找到相关城市
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-2 px-2.5 py-1 rounded-[var(--card-radius)] bg-amber-500/10 text-font-sm text-amber-600 dark:text-amber-400">
          {error}
        </div>
      )}

      {loading ? (
        renderSkeleton()
      ) : weather ? (
        <>
          {/* Main Weather Hero Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
            {/* Current Temp */}
            <div className="glass-panel p-3.5 rounded-[var(--card-radius)] flex flex-col justify-between bg-gradient-to-br from-blue-500/10 to-sky-400/10">
              <div className="flex items-center justify-between">
                <span className="text-font-sm font-semibold dark:text-slate-400 uppercase tracking-wider">
                  实时天气
                </span>
                {getWeatherIcon(weather.condition, 24)}
              </div>
              <div className="my-1">
                <div className="text-lg font-extrabold tracking-tight">
                  {weather.temp}°
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">
                  {CONDITION_TEXT[weather.condition] ?? weather.condition}
                </div>
              </div>
              <div className="flex items-center justify-between text-font-sm font-medium">
                <span>最高 {weather.high}°</span>
                <span>最低 {weather.low}°</span>
              </div>
            </div>

            {/* Hourly Forecast Strip */}
            <div className="md:col-span-2 glass-panel p-3.5 rounded-[var(--card-radius)] flex flex-col justify-between">
              <div className="text-font-sm font-semibold dark:text-slate-400 mb-2 uppercase tracking-wider">
                逐小时预报
              </div>
              <div className="flex items-center justify-between overflow-x-auto no-scrollbar space-x-2 py-1">
                {weather.hourlyForecast.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center shrink-0 min-w-[42px] space-y-1"
                  >
                    <span className="text-font-sm ">
                      {item.time}
                    </span>
                    {getWeatherIcon(item.condition, 16)}
                    <span className="text-xs font-semibold">{item.temp}°</span>
                  </div>
                ))}
              </div>
              {/* Weather Params Footer */}
              <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/10 grid grid-cols-3 gap-2 text-font-sm">
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
                  <span>
                    {weather.aqi >= 0
                      ? `AQI ${weather.aqi} (${AQI_LABEL_CN[weather.aqiLabel] ?? weather.aqiLabel})`
                      : 'AQI 暂无数据'}
                  </span>
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
                  className="p-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-between"
                >
                  <span className="text-font-sm font-medium dark:text-slate-400">
                    {day.day}
                  </span>
                  <div className="my-1">
                    {getWeatherIcon(day.condition, 14)}
                  </div>
                  <span className="text-font-sm font-bold">{day.high}~{day.low}°</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs ">
          暂无天气数据
        </div>
      )}
    </div>
  );
};
