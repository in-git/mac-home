import { MapPin, Moon, Sliders, Sun } from 'lucide-react';
import { Select, ListBox } from '@heroui/react';
import React, { useState } from 'react';
import { useHomeStore } from '../store/useHomeStore';
import { CARD_RADIUS_LABEL, CardRadiusTier, FONT_VARIANT_LABEL } from '../types';

import { reverseGeocodeCityName } from '../utils/weatherApi';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ControlCenterWidget: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const fontVariant = useHomeStore((s) => s.fontVariant);
  const setFontVariant = useHomeStore((s) => s.setFontVariant);
  const cardRadius = useHomeStore((s) => s.cardRadius);
  const setCardRadius = useHomeStore((s) => s.setCardRadius);
  const screenBrightness = useHomeStore((s) => s.screenBrightness);
  const setScreenBrightness = useHomeStore((s) => s.setScreenBrightness);

  // 定位状态：idle 未定位 / locating 请求中 / done 成功 / error 失败
  const [locating, setLocating] = useState(false);
  const [_, setLocCity] = useState<string | null>(null);
  const [locCoords, setLocCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  /** 点击位置模块：调用 Geolocation API 获取坐标，并反向解析城市名 */
  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocCity('浏览器不支持定位');
      return;
    }
    // 浏览器仅在「安全上下文」（localhost 或 https）中才会弹出定位权限。
    // 通过局域网 IP 以 http 访问时 geolocation 会被静默禁用，提前给出明确提示。
    if (!window.isSecureContext) {
      setLocCity('需在 localhost 或 https 下定位');
      return;
    }
    if (locating) return;

    setLocating(true);
    setLocCity(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocCoords({ lat: latitude, lon: longitude });
        const city = await reverseGeocodeCityName(latitude, longitude);
        setLocCity(city ?? '当前位置');
        setLocating(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? '已拒绝定位权限，请在地址栏允许'
            : err.code === err.POSITION_UNAVAILABLE
              ? '位置信息不可用'
              : '定位超时，请重试';
        setLocCity(msg);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  };

  return (
    <div className="h-full flex flex-col gap-2 p-2 text-slate-800 dark:text-slate-100">
      {/* Module grid: 2 columns of equal square-ish tiles */}
      <div className="grid grid-cols-2 gap-2">
        {/* Location tile */}
        <button
          onClick={locate}
          className="glass-panel p-4 rounded-[var(--card-radius)] flex flex-col items-center text-center gap-2 transition-transform active:scale-[0.98]"
        >
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              locCoords
                ? 'bg-[#34C759] text-white shadow-sm'
                : 'bg-slate-400/30 text-slate-500 shadow-sm'
            }`}
          >
            <MapPin size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-font-sm leading-tight">位置</div>
       
          </div>
        </button>

        {/* Dark mode tile */}
        <button
          onClick={() => {
            onToggleDarkMode();
          }}
          className={`p-4 rounded-[var(--card-radius)] flex flex-col items-center text-center gap-2 transition-all active:scale-[0.98] ${
            isDarkMode
              ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-md'
              : 'glass-panel'
          }`}
        >
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? 'bg-amber-400/20 text-amber-300'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Moon size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-font-sm leading-tight">
              {isDarkMode ? '深色模式' : '浅色模式'}
            </div>
          </div>
        </button>
      </div>

      {/* Brightness slider */}
      <div className="glass-panel p-3.5 rounded-[var(--card-radius)]">
        <div>
          <div className="flex justify-between items-center text-font-sm text-slate-500 mb-1.5">
            <span className="flex items-center space-x-1.5 font-medium">
              <Sun size={13} />
              <span>屏幕亮度</span>
            </span>
            <span className="font-mono">{screenBrightness}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={screenBrightness}
            onChange={(e) => setScreenBrightness(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>
      </div>

      {/* Font size: A (12/14/16) / B (13/15/17) / C (14/16/18) */}
      <div className="glass-panel p-3.5 rounded-[var(--card-radius)]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="flex items-center space-x-1.5 text-font-sm text-slate-500 font-medium">
            <span className="w-5 h-5 rounded-[var(--card-radius)] bg-[color:var(--accent)]/15 text-[color:var(--accent)] flex items-center justify-center">
              <Sliders size={11} />
            </span>
            <span>字体大小</span>
          </span>
   
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['A', 'B', 'C'] as const).map((v) => {
            const active = fontVariant === v;
            return (
              <button
                key={v}
                onClick={() => {
                  setFontVariant(v);
                }}
                className={`py-2.5 rounded-[var(--card-radius)] border text-font-md font-bold transition-all active:scale-[0.98] ${
                  active
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                    : 'border-black/10 dark:border-white/10 text-slate-500 hover:bg-white/60 dark:hover:bg-white/5'
                }`}
              >
                {FONT_VARIANT_LABEL[v]}
              </button>
            );
          })}
        </div>
      </div>

      {/* bottom spacer: push the dropdown to the screen bottom */}
      <div className="flex-1" />

      {/* Card corner radius: dropdown pinned to the bottom of the screen */}
      <div className="glass-panel p-3.5 rounded-[var(--card-radius)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-font-sm text-slate-500 font-medium">
            <span className="w-5 h-5 rounded-[var(--card-radius)] bg-[color:var(--accent)]/15 text-[color:var(--accent)] flex items-center justify-center">
              <Sliders size={11} />
            </span>
            <span>圆角</span>
          </span>
          <Select
            aria-label="卡片圆角"
            value={cardRadius}
            onChange={(key) => {
              if (key != null) setCardRadius(String(key) as CardRadiusTier);
            }}
            variant="secondary"
            className="w-32"
          >
            <Select.Trigger className="bg-black/5 dark:bg-white/10 border-0">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {(['tiny', 'small', 'medium', 'large'] as const).map((v) => (
                  <ListBox.Item key={v} id={v}>
                    {CARD_RADIUS_LABEL[v]}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>
    </div>
  );
};
