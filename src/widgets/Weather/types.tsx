import { Cloud, CloudRain, Snowflake, Sun, Zap } from 'lucide-react';

/** 卡片天气汇总，用于同步给顶部状态栏（以卡片为准） */
export interface WeatherSummary {
  cityName: string;
  country: string;
  temp: number | null;
}

export const CONDITION_TEXT: Record<string, string> = {
  sunny: '晴朗',
  cloudy: '多云',
  rainy: '小雨到中雨',
  snowy: '降雪',
  thunder: '雷暴',
};

export const AQI_LABEL_CN: Record<string, string> = {
  Excellent: '优',
  Good: '良',
  Moderate: '中度',
  Unhealthy: '重度',
};

export const getWeatherIcon = (cond: string, size = 18) => {
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
