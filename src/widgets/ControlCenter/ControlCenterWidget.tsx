import { MapPin, Moon, Sliders, Sun } from 'lucide-react';
import React, { useState } from 'react';
import { useHomeStore } from '../../store/useHomeStore';
import { CARD_RADIUS, CardRadiusTier } from '../../types';

import { reverseGeocodeCityName } from '../../utils/weatherApi';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ControlCenterWidget: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const cardRadius = useHomeStore((s) => s.cardRadius);
  const setCardRadius = useHomeStore((s) => s.setCardRadius);
  const screenBrightness = useHomeStore((s) => s.screenBrightness);
  const setScreenBrightness = useHomeStore((s) => s.setScreenBrightness);
  // 上一次成功定位的位置（持久化，用于本次进入时回显）
  const lastLocation = useHomeStore((s) => s.lastLocation);
  const setLastLocation = useHomeStore((s) => s.setLastLocation);

  // 定位状态：idle 未定位 / locating 请求中 / done 成功 / error 失败
  const [locating, setLocating] = useState(false);
  const [locCity, setLocCity] = useState<string | null>(null);
  const [locCoords, setLocCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  // 定位失败时的错误原因（图标下方展示「定位失败」+ 具体原因）
  const [locError, setLocError] = useState<string | null>(null);

  /** 点击位置模块：调用 Geolocation API 获取坐标，并反向解析城市名 */
  const locate = () => {
    if (!('geolocation' in navigator)) {
      setLocError('浏览器不支持定位');
      return;
    }
    // 浏览器仅在「安全上下文」（localhost 或 https）中才会弹出定位权限。
    // 通过局域网 IP 以 http 访问时 geolocation 会被静默禁用，提前给出明确提示。
    if (!window.isSecureContext) {
      setLocError('需在 localhost 或 https 下定位');
      return;
    }
    if (locating) return;

    setLocating(true);
    setLocCity(null);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocCoords({ lat: latitude, lon: longitude });
        const city = await reverseGeocodeCityName(latitude, longitude);
        const cityName = city ?? '当前位置';
        setLocCity(cityName);
        // 持久化最近一次成功定位，下次进入时回显
        setLastLocation({ city: cityName, lat: latitude, lon: longitude });
        setLocating(false);
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? '已拒绝定位权限，请在地址栏允许'
            : err.code === err.POSITION_UNAVAILABLE
              ? '位置信息不可用'
              : '定位超时，请重试';
        setLocError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
    );
  };

  return (
    <div className="h-full flex flex-col justify-between gap-2.5 ">
      {/* Module grid: 2 columns of equal square-ish tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Location tile */}
        <button
          onClick={locate}
          className="glass-panel p-2.5 rounded-[var(--card-radius)] flex flex-col items-center justify-center text-center gap-1.5 transition-transform active:scale-[0.98]"
        >
          <div
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              locError
                ? 'bg-red-500 text-white shadow-sm'
                : locCoords || lastLocation
                  ? 'bg-[#34C759] text-white shadow-sm'
                  : 'bg-slate-400/30  shadow-sm'
            }`}
          >
            <MapPin size={15} />
          </div>
          <div className="min-w-0">
            {locating ? (
              <div className=" text-font-sm leading-tight">
                定位中…
              </div>
            ) : locError ? (
              <>
                <div className=" text-font-sm leading-tight text-red-500">
                  定位失败
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate max-w-[70px]">
                  {locError}
                </div>
              </>
            ) : (
              <div className=" text-font-sm leading-tight truncate max-w-[80px]">
                {locCity ?? lastLocation?.city ?? '位置'}
              </div>
            )}
          </div>
        </button>

        {/* Dark mode tile */}
        <button
          onClick={() => {
            onToggleDarkMode();
          }}
          className={`p-2.5 rounded-[var(--card-radius)] flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] ${
            isDarkMode
              ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-md'
              : 'glass-panel'
          }`}
        >
          <div
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? 'bg-amber-400/20 text-amber-300'
                : 'bg-slate-200'
            }`}
          >
            {isDarkMode ? <Moon size={15} /> : <Sun size={15} />}
          </div>
          <div className="min-w-0">
            <div className=" text-font-sm leading-tight">
              {isDarkMode ? '深色模式' : '浅色模式'}
            </div>
          </div>
        </button>
      </div>

      {/* Brightness slider */}
      <div className="glass-panel p-3 rounded-[var(--card-radius)] flex flex-col justify-center">
        <div>
          <div className="flex justify-between items-center text-font-sm mb-1.5">
            <span className="flex items-center space-x-1 ">
              <Sun size={13} />
              <span>屏幕亮度</span>
            </span>
            <span className="font-mono text-xs">{screenBrightness}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={screenBrightness}
            onChange={(e) => setScreenBrightness(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer h-2"
          />
        </div>
      </div>

      {/* Card Radius */}
      <div className="glass-panel p-3 rounded-[var(--card-radius)] flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center space-x-1.5 text-font-sm ">
            <span className="w-4 h-4 rounded-[var(--card-radius)] bg-[color:var(--accent)]/15 text-[color:var(--accent)] flex items-center justify-center">
              <Sliders size={11} />
            </span>
            <span>卡片圆角</span>
          </span>
        </div>
        <div className="relative grid grid-cols-4 gap-1 p-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10">
          {/* 苹果风格滑块高亮：跟随选中项移动 */}
          {(() => {
            const tiers: CardRadiusTier[] = ['tiny', 'small', 'medium', 'large'];
            const activeIndex = tiers.indexOf(cardRadius);
            return (
              <>
                <span
                  aria-hidden
                  className="absolute top-1 bottom-1 rounded-[calc(var(--card-radius)-4px)] bg-white dark:bg-slate-700 shadow-sm transition-transform duration-200 ease-out"
                  style={{
                    width: 'calc((100% - 0.75rem) / 4)',
                    transform: `translateX(${activeIndex * 100}%)`,
                  }}
                />
                {tiers.map((tier) => {
                  const active = cardRadius === tier;
                  return (
                    <label
                      key={tier}
                      className={`relative z-10 py-1 text-xs font-bold text-center cursor-pointer transition-colors rounded-[calc(var(--card-radius)-4px)] ${
                        active
                          ? 'text-slate-900 dark:text-white'
                          : ' hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cardRadius"
                        value={tier}
                        checked={active}
                        onChange={() => setCardRadius(tier)}
                        className="sr-only"
                      />
                      {CARD_RADIUS[tier].label}
                    </label>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ControlCenterWidget;
