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

const STORAGE_KEY = 'weather-cities';
/** 当前选中城市的 id（持久化，保证下次进入恢复上一次的查看/定位城市） */
const SELECTED_KEY = 'weather-selected-id';
/** 首次加载自动定位标记（只自动尝试一次，避免每次刷新都弹授权） */
const LOCATION_TRIED_KEY = 'weather-location-tried';

const DEFAULT_CITIES: WeatherCity[] = [
  {
    id: cityIdOf(31.2304, 121.4737),
    name: '上海',
    country: '中国',
    latitude: 31.2304,
    longitude: 121.4737,
  },
  {
    id: cityIdOf(39.9042, 116.4074),
    name: '北京',
    country: '中国',
    latitude: 39.9042,
    longitude: 116.4074,
  },
  {
    id: cityIdOf(22.5431, 114.0579),
    name: '深圳',
    country: '中国',
    latitude: 22.5431,
    longitude: 114.0579,
  },
  {
    id: cityIdOf(30.2741, 120.1551),
    name: '杭州',
    country: '中国',
    latitude: 30.2741,
    longitude: 120.1551,
  },
  {
    id: cityIdOf(35.6762, 139.6503),
    name: '东京',
    country: '日本',
    latitude: 35.6762,
    longitude: 139.6503,
  },
];

function loadCities(): WeatherCity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WeatherCity[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // 忽略损坏的本地数据
  }
  return DEFAULT_CITIES;
}

function saveCities(cities: WeatherCity[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
  } catch {
    // 忽略存储失败
  }
}

function loadSelectedId(cities: WeatherCity[]): string {
  try {
    const raw = localStorage.getItem(SELECTED_KEY);
    if (raw && cities.some((c) => c.id === raw)) return raw;
  } catch {
    // 忽略损坏的本地数据
  }
  return cities[0]?.id ?? '';
}

function saveSelectedId(id: string) {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch {
    // 忽略存储失败
  }
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

export const WeatherWidget: React.FC = () => {
  const [cities, setCities] = useState<WeatherCity[]>(loadCities);
  const [selectedId, setSelectedId] = useState<string>(() => loadSelectedId(loadCities()));
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

  /** 切换选中城市并持久化，保证下次进入恢复 */
  const selectCity = (id: string) => {
    setSelectedId(id);
    saveSelectedId(id);
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
      setCities(next);
      saveCities(next);
    }
    setSelectedId(id);
    saveSelectedId(id);
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    
  };

  const removeCity = (id: string) => {
    const next = cities.filter((c) => c.id !== id);
    if (next.length === 0) return; // 至少保留一个城市
    saveCities(next);
    setCities(next);
    if (id === selectedId) selectCity(next[0].id);
  };

  /** 自动定位：Geolocation 获取坐标 → 反向解析城市 → 切换到该城市 */
  const locate = async () => {
    if (!('geolocation' in navigator)) {
      setError('当前浏览器不支持自动定位');
      return;
    }
    if (locating) return;
    setLocating(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 10 * 60 * 1000,
        });
      });
      const { latitude, longitude } = pos.coords;
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
      setError('定位失败，请在浏览器设置中允许位置权限');
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
      <div className="glass-panel p-3.5 rounded-2xl">
        <div className="h-3 w-16 bg-slate-200 dark:bg-white/10 rounded mb-4" />
        <div className="h-9 w-20 bg-slate-200 dark:bg-white/10 rounded mb-2" />
        <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
      <div className="md:col-span-2 glass-panel p-3.5 rounded-2xl">
        <div className="h-3 w-20 bg-slate-200 dark:bg-white/10 rounded mb-4" />
        <div className="flex items-center justify-between">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-8 h-14 bg-slate-200 dark:bg-white/10 rounded"
            />
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
          <MapPin size={14} className="text-[#007AFF]" />
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
            className="p-1 rounded-md text-slate-400 hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-60"
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
            className="p-1 rounded-md text-slate-400 hover:text-[#007AFF] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
                className={`px-2 py-0.5 rounded-md text-font-sm font-medium transition-colors whitespace-nowrap ${
                  c.id === selectedId
                    ? 'bg-[#007AFF] text-white shadow-xs'
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
            className="shrink-0 p-1 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 hover:bg-[#007AFF] hover:text-white transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* City search panel */}
      {searchOpen && (
        <div className="relative mb-2">
          <div className="flex items-center gap-1.5 glass-panel rounded-xl px-2.5 py-1.5">
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
                className="animate-spin text-slate-400 shrink-0"
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
            <div className="absolute top-full left-0 right-0 mt-1 z-20 glass-panel rounded-xl p-1 max-h-56 overflow-y-auto shadow-xl">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addCity(r)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left hover:bg-[#007AFF]/10 transition-colors"
                >
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    {r.name}
                    <span className="text-font-sm text-slate-400 ml-1">
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
            <div className="absolute top-full left-0 right-0 mt-1 z-20 glass-panel rounded-xl p-2.5 text-center text-font-sm text-slate-400">
              未找到相关城市
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-2 px-2.5 py-1 rounded-lg bg-amber-500/10 text-font-sm text-amber-600 dark:text-amber-400">
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
            <div className="glass-panel p-3.5 rounded-2xl flex flex-col justify-between bg-gradient-to-br from-blue-500/10 to-sky-400/10">
              <div className="flex items-center justify-between">
                <span className="text-font-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
              <div className="flex items-center justify-between text-font-sm text-slate-500 font-medium">
                <span>最高 {weather.high}°</span>
                <span>最低 {weather.low}°</span>
              </div>
            </div>

            {/* Hourly Forecast Strip */}
            <div className="md:col-span-2 glass-panel p-3.5 rounded-2xl flex flex-col justify-between">
              <div className="text-font-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                逐小时预报
              </div>
              <div className="flex items-center justify-between overflow-x-auto no-scrollbar space-x-2 py-1">
                {weather.hourlyForecast.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center shrink-0 min-w-[42px] space-y-1"
                  >
                    <span className="text-font-sm text-slate-400">
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
                  className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-between"
                >
                  <span className="text-font-sm font-medium text-slate-500 dark:text-slate-400">
                    {day.day}
                  </span>
                  <div className="my-1">
                    {getWeatherIcon(day.condition, 14)}
                  </div>
                  <span className="text-font-sm font-bold">{day.high}°</span>
                  <span className="text-font-sm text-slate-400">{day.low}°</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
          暂无天气数据
        </div>
      )}
    </div>
  );
};
