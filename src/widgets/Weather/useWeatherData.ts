import { useCallback, useEffect, useRef, useState } from 'react';
import { PRESET_DATA } from '../../data/presetData';
import type {  WeatherCity } from '../../utils/weatherApi';
import {
  cityIdOf,
  fetchWeather,
  reverseGeocodeCityName,
  searchCity,
} from '../../utils/weatherApi';
import { useHomeStore } from '../../store/useHomeStore';
import type { WeatherSummary } from './types';
import { WeatherCondition } from '@/types';

/** 首次加载自动定位标记（只自动尝试一次，避免每次刷新都弹授权） */
const LOCATION_TRIED_KEY = 'weather-location-tried';

export function useWeatherData(onWeatherChange?: (s: WeatherSummary) => void) {
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
  const [searchResults, setSearchResults] = useState<WeatherCity[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCity = cities.find((c) => c.id === selectedId) ?? cities[0];

  // 加载选中城市的实时天气
  useEffect(() => {
    if (!selectedCity) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchWeather(selectedCity);
        if (!cancelled) setWeather(data);
      } catch {
        if (cancelled) return;
        setError('实时天气获取失败，显示离线数据');
        setWeather(PRESET_DATA.PRESET_WEATHER[selectedCity.name] ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCity, refreshKey]);

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
      (async () => {
        setSearching(true);
        try {
          const results = await searchCity(searchQuery.trim());
          setSearchResults(
            results.map((r) => ({
              ...r,
              id: String(r.id),
            }))
          );
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const selectCity = useCallback((id: string) => setSelectedCityId(id), [setSelectedCityId]);

  const addCity = useCallback(
    (result: WeatherCity) => {
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
    },
    [cities, setWeatherCities, setSelectedCityId]
  );

  const removeCity = useCallback(
    (id: string) => {
      const next = cities.filter((c) => c.id !== id);
      if (next.length === 0) return; // 至少保留一个城市
      setWeatherCities(next); // store 会自动在被删城市为选中项时回退选中
    },
    [cities, setWeatherCities]
  );

  /** 自动定位：坐标 → 反向解析城市 → 切换到该城市 */
  const locate = useCallback(async () => {
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
          addCity({
            ...results[0],
            id: String(results[0].id),
          });
          return;
        }
      }
      // 回退：直接以当前坐标作为城市
      addCity({
        id: -1 as unknown as string,
        name: cityName ?? '当前位置',
        country: '未知',
        latitude,
        longitude,
      } as WeatherCity);
    } catch {
      setError('定位失败，已为你显示默认城市');
    } finally {
      setLocating(false);
    }
  }, [locating, addCity]);

  // 首次加载自动定位一次（浏览器授权弹窗只出现一次）
  useEffect(() => {
    if (localStorage.getItem(LOCATION_TRIED_KEY)) return;
    localStorage.setItem(LOCATION_TRIED_KEY, '1');
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    cities,
    selectedId,
    selectedCity,
    weather,
    loading,
    error,
    locating,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    searchInputRef,
    selectCity,
    addCity,
    removeCity,
    locate,
    refresh,
  };
}
