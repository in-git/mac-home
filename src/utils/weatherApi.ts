/**
 * Open-Meteo 公共免费天气 API 服务封装
 * - 无需 API Key，支持 CORS 浏览器直连
 * - 文档: https://open-meteo.com/en/docs
 */
import { WeatherCondition } from '../types';

export interface WeatherCity {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface CitySearchResult {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_API = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const REVERSE_GEOCODING_API =
  'https://api.bigdatacloud.net/data/reverse-geocode-client';

/** 内存缓存，10 分钟内不重复请求 */
const cache = new Map<string, { data: WeatherCondition; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;
/**
 * 进行中请求去重：同一城市在请求未返回前再次调用时复用同一个 Promise。
 * 避免 StrictMode（开发模式 effect 双执行）/ 重复挂载导致的同一城市重复请求。
 */
const inFlight = new Map<string, Promise<WeatherCondition>>();

/** 城市搜索（中文友好） */
export async function searchCity(query: string): Promise<CitySearchResult[]> {
  const url = `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=6&language=zh&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`城市搜索失败: ${res.status}`);
  const data = await res.json();
  return data.results ?? [];
}

/**
 * 反向地理编码：坐标 → 最近城市名（BigDataCloud 免费客户端 API，无需 Key）
 * https://www.bigdatacloud.com/docs/api/free-reverse-geocode-to-city-api
 */
export async function reverseGeocodeCityName(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = `${REVERSE_GEOCODING_API}?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const raw =
      data?.city || data?.principalSubdivision || data?.locality || '';
    // 去掉中文行政区后缀（上海市 → 上海），便于后续正向地理编码匹配
    const cleaned = String(raw).trim().replace(/市$/, '');
    return cleaned || null;
  } catch {
    return null;
  }
}

/** WMO 天气代码 → 组件条件类型 */
function mapWeatherCode(code: number): WeatherCondition['condition'] {
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57)
    return 'rainy';
  if (code === 61 || code === 63 || code === 65 || code === 66 || code === 67)
    return 'rainy';
  if (code === 71 || code === 73 || code === 75 || code === 77) return 'snowy';
  if (code === 80 || code === 81 || code === 82) return 'rainy';
  if (code === 85 || code === 86) return 'snowy';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

/** US AQI → 等级标签 */
function mapAqiLabel(aqi: number): WeatherCondition['aqiLabel'] {
  if (aqi <= 50) return 'Excellent';
  if (aqi <= 100) return 'Good';
  if (aqi <= 150) return 'Moderate';
  return 'Unhealthy';
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 构建逐小时预报（当前时刻起 6 条） */
function buildHourly(hourly: {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
}): WeatherCondition['hourlyForecast'] {
  const now = new Date();
  const currentHour = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
  let start = hourly.time.findIndex((t) => t >= currentHour);
  if (start < 0) start = 0;
  return hourly.time.slice(start, start + 6).map((t, i) => ({
    time: i === 0 ? '现在' : t.slice(11, 16),
    temp: Math.round(hourly.temperature_2m[start + i]),
    condition: mapWeatherCode(hourly.weather_code[start + i]),
  }));
}

/** 构建未来 5 天预报 */
function buildDaily(daily: {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}): WeatherCondition['dailyForecast'] {
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'short' });
  return daily.time.slice(0, 5).map((t, i) => {
    const date = new Date(`${t}T00:00:00`);
    return {
      day: i === 0 ? '今天' : weekday.format(date),
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
      condition: mapWeatherCode(daily.weather_code[i]),
    };
  });
}

/** 获取城市实时天气 + 逐小时/每日预报 + AQI */
export async function fetchWeather(
  city: WeatherCity,
): Promise<WeatherCondition> {
  const hit = cache.get(city.id);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  // 同一城市已有请求在途时直接复用，避免重复网络请求
  const pending = inFlight.get(city.id);
  if (pending) return pending;

  const request = (async (): Promise<WeatherCondition> => {
    const forecastUrl =
      `${FORECAST_API}?latitude=${city.latitude}&longitude=${city.longitude}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,uv_index' +
      '&hourly=temperature_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto&forecast_days=7';
    const aqiUrl = `${AIR_QUALITY_API}?latitude=${city.latitude}&longitude=${city.longitude}&current=us_aqi&timezone=auto`;

    // AQI 接口失败不影响整体天气展示
    const [forecastRes, aqiRes] = await Promise.allSettled([
      fetch(forecastUrl),
      fetch(aqiUrl),
    ]);

    if (forecastRes.status === 'rejected') throw new Error('天气数据获取失败');
    const forecast = await forecastRes.value.json();

    let aqi = -1; // -1 表示无 AQI 数据
    if (aqiRes.status === 'fulfilled') {
      try {
        const aqiData = await aqiRes.value.json();
        const usAqi = aqiData?.current?.us_aqi;
        if (typeof usAqi === 'number') aqi = Math.round(usAqi);
      } catch {
        // 忽略 AQI 解析失败
      }
    }

    const data: WeatherCondition = {
      city: city.name,
      country: city.country,
      temp: Math.round(forecast.current.temperature_2m),
      condition: mapWeatherCode(forecast.current.weather_code),
      high: Math.round(forecast.daily.temperature_2m_max[0]),
      low: Math.round(forecast.daily.temperature_2m_min[0]),
      humidity: forecast.current.relative_humidity_2m,
      windSpeed: Math.round(forecast.current.wind_speed_10m),
      uvIndex: Math.round(forecast.current.uv_index ?? 0),
      aqi,
      aqiLabel: aqi >= 0 ? mapAqiLabel(aqi) : 'Good',
      hourlyForecast: buildHourly(forecast.hourly),
      dailyForecast: buildDaily(forecast.daily),
    };

    cache.set(city.id, { data, ts: Date.now() });
    return data;
  })();

  inFlight.set(city.id, request);
  try {
    return await request;
  } finally {
    inFlight.delete(city.id);
  }
}

/** 基于坐标生成稳定的城市 id */
export function cityIdOf(latitude: number, longitude: number): string {
  return `city-${latitude.toFixed(2)}-${longitude.toFixed(2)}`;
}
