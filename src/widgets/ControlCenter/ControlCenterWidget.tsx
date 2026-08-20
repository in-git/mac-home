import { MapPin, Moon, Sliders, Sun } from 'lucide-react';
import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useHomeStore } from '../../store/useHomeStore';
import { CARD_RADIUS, CardRadiusTier } from '../../types';

import { reverseGeocodeCityName } from '../../utils/weatherApi';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  /** 卡片自身的背景模式：'dark' | 'light'；如果不传，则默认跟随当前系统的 isDarkMode */
  theme?: 'dark' | 'light';
}

export const ControlCenterWidget: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
  theme,
}) => {
  // 判断当前卡片自身是否为深色背景（优先取传入的局部 theme，缺省时回退到全局 isDarkMode）
  const isDarkCard = theme ? theme === 'dark' : isDarkMode;

  // 独立的局部主题样式类名
  const tilePanelClass = isDarkCard
    ? 'bg-white/10 text-white border border-white/10 shadow-sm'
    : 'bg-black/[0.04] text-slate-800 border border-black/5 shadow-xs';

  const subTextClass = isDarkCard ? 'text-white/60' : 'text-slate-500';

  const {
    cardRadius,
    setCardRadius,
    screenBrightness,
    setScreenBrightness,
    lastLocation,
    setLastLocation,
  } = useHomeStore(
    useShallow((s) => ({
      cardRadius: s.cardRadius,
      setCardRadius: s.setCardRadius,
      screenBrightness: s.screenBrightness,
      setScreenBrightness: s.setScreenBrightness,
      lastLocation: s.lastLocation,
      setLastLocation: s.setLastLocation,
    })),
  );

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
    <div className={`h-full flex flex-col justify-between gap-2.5 select-none ${isDarkCard ? 'text-white' : 'text-slate-800'}`}>
      {/* Module grid: 2 columns of equal square-ish tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Location tile */}
        <button
          onClick={locate}
          className={`${tilePanelClass} p-2.5 rounded-[var(--card-radius)] flex flex-col items-center justify-center text-center gap-1.5 transition-transform active:scale-[0.98]`}
        >
          <div
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              locError
                ? 'bg-red-500 text-white shadow-sm'
                : locCoords || lastLocation
                  ? 'bg-[#34C759] text-white shadow-sm'
                  : isDarkCard
                    ? 'bg-white/20 text-white/80 shadow-sm'
                    : 'bg-slate-300/60 text-slate-600 shadow-sm'
            }`}
          >
            <MapPin size={15} />
          </div>
          <div className="min-w-0">
            {locating ? (
              <div className="text-font-sm leading-tight">
                定位中…
              </div>
            ) : locError ? (
              <>
                <div className="text-font-sm leading-tight text-red-500">
                  定位失败
                </div>
                <div className={`text-[10px] ${subTextClass} leading-tight mt-0.5 truncate max-w-[70px]`}>
                  {locError}
                </div>
              </>
            ) : (
              <div className="text-font-sm leading-tight truncate max-w-[80px]">
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
          className={`p-2.5 rounded-[var(--card-radius)] flex flex-col items-center justify-center text-center gap-1.5 active:scale-[0.98] transition-colors ${
            isDarkMode
              ? 'bg-slate-800 text-amber-300 border border-slate-700 shadow-md'
              : tilePanelClass
          }`}
        >
          <div
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDarkMode
                ? 'bg-amber-400/20 text-amber-300'
                : isDarkCard
                  ? 'bg-white/20 text-white/80'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isDarkMode ? <Moon size={15} /> : <Sun size={15} />}
          </div>
          <div className="min-w-0">
            <div className="text-font-sm leading-tight">
              {isDarkMode ? '深色模式' : '浅色模式'}
            </div>
          </div>
        </button>
      </div>

      {/* Brightness slider */}
      <div className={`${tilePanelClass} p-3 rounded-[var(--card-radius)] flex flex-col justify-center`}>
        <div>
          <div className="flex justify-between items-center text-font-sm mb-1.5">
            <span className="flex items-center space-x-1">
              <Sun size={13} />
              <span>屏幕亮度</span>
            </span>
            <span className="font-mono text-xs opacity-80">{screenBrightness}%</span>
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
      <div className={`${tilePanelClass} p-3 rounded-[var(--card-radius)] flex flex-col justify-center`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center space-x-1.5 text-font-sm">
            <span className="w-4 h-4 rounded-[var(--card-radius)] bg-[color:var(--accent)]/15 text-[color:var(--accent)] flex items-center justify-center">
              <Sliders size={11} />
            </span>
            <span>卡片圆角</span>
          </span>
        </div>
        <div className={`relative grid grid-cols-3 gap-1 p-1 rounded-[var(--card-radius)] ${isDarkCard ? 'bg-white/10' : 'bg-black/5'}`}>
          {/* 苹果风格滑块高亮：跟随选中项移动 */}
          {(() => {
            const tiers: CardRadiusTier[] = ['small', 'medium', 'large'];
            // 旧数据可能保存了已移除的 tiny 档，钳制到第一档避免滑块错位
            const activeIndex = Math.max(0, tiers.indexOf(cardRadius));
            return (
              <>
                <span
                  aria-hidden
                  className={`absolute top-1 bottom-1 rounded-[calc(var(--card-radius)-4px)] shadow-sm transition-transform duration-200 ease-out ${
                    isDarkCard ? 'bg-white/20' : 'bg-white shadow-xs'
                  }`}
                  style={{
                    width: 'calc((100% - 0.5rem) / 3)',
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
                          ? isDarkCard
                            ? 'text-white'
                            : 'text-slate-900'
                          : isDarkCard
                            ? 'text-white/60 hover:text-white'
                            : 'text-slate-600 hover:text-slate-900'
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
