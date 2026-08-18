import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, RefreshCw, Loader2, ChevronDown, X } from 'lucide-react';
import type { WeatherCity } from '../../../utils/weatherApi';

interface Props {
  cities: WeatherCity[];
  selectedId: string;
  selectedCity?: WeatherCity;
  locating: boolean;
  loading: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleSearch: () => void;
  onLocate: () => void;
  onRefresh: () => void;
}

export const CityHeader: React.FC<Props> = ({
  cities,
  selectedId,
  selectedCity,
  locating,
  loading,
  onSelect,
  onRemove,
  onToggleSearch,
  onLocate,
  onRefresh,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击下拉容器外部时关闭列表
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative mb-1" ref={containerRef}>
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-1 border-b border-black/5 dark:border-white/10">
        {/* 左：当前地址 + 定位 / 刷新 */}
        <div className="flex items-center space-x-2 shrink-0 min-w-0">
          <MapPin size={14} className="text-[color:var(--accent)] shrink-0" />
          <div className="font-bold text-sm tracking-tight whitespace-nowrap truncate">
            {selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : '未选择城市'}
          </div>
          <button
            onClick={onLocate}
            title="自动定位到当前位置"
            disabled={locating}
            className="p-1 rounded-[var(--card-radius)] hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-60 shrink-0"
          >
            {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
          </button>
          <button
            onClick={onRefresh}
            title="刷新天气"
            className="p-1 rounded-[var(--card-radius)] hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 右：城市下拉列表触发器 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-[var(--card-radius)] text-xs  bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
        >
          <span className="whitespace-nowrap">切换城市</span>
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 城市下拉列表 */}
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 glass-panel rounded-[var(--card-radius)] p-1 shadow-xl">
            <div className="px-2 py-1 text-font-sm text-slate-400">选择城市</div>
            <div className="max-h-52 overflow-y-auto">
              {cities.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-[var(--card-radius)] ${
                    c.id === selectedId
                      ? 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelect(c.id);
                      setOpen(false);
                    }}
                    className="flex-1 text-left text-xs  truncate"
                  >
                    {c.name}
                    {c.admin1 ? <span className="text-font-sm ml-1">{c.admin1}</span> : null}
                  </button>
                  {cities.length > 1 && (
                    <button
                      onClick={() => onRemove(c.id)}
                      title="移除城市"
                      className="ml-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity shrink-0"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onToggleSearch();
              }}
              className="w-full mt-1 flex items-center gap-1 px-2 py-1.5 rounded-[var(--card-radius)] text-xs text-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 transition-colors"
            >
              <span className="text-sm leading-none">+</span> 添加城市
            </button>
          </div>
      )}
    </div>
  );
};
