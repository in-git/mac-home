import { LocateFixed, MapPin, RefreshCw, Loader2 } from 'lucide-react';
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
  searchOpen: boolean;
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
  searchOpen,
}) => (
  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-black/5 dark:border-white/10">
    <div className="flex items-center space-x-2 shrink-0">
      <MapPin size={14} className="text-[color:var(--accent)]" />
      <div className="font-bold text-sm tracking-tight whitespace-nowrap">
        {selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : '未选择城市'}
      </div>
      <button
        onClick={onLocate}
        title="自动定位到当前位置"
        disabled={locating}
        className="p-1 rounded-[var(--card-radius)] hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-60"
      >
        {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
      </button>
      <button
        onClick={onRefresh}
        title="刷新天气"
        className="p-1 rounded-[var(--card-radius)] hover:text-[color:var(--accent)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>

    {/* City switcher chips */}
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {cities.map((c) => (
        <div key={c.id} className="relative shrink-0">
          <button
            onClick={() => onSelect(c.id)}
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
              onClick={() => onRemove(c.id)}
              title="移除城市"
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            >
              <span className="text-[8px] leading-none font-bold">×</span>
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onToggleSearch}
        title="添加城市"
        className="shrink-0 p-1 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 hover:bg-[color:var(--accent)] hover:text-white transition-colors"
      >
        <span className="text-xs leading-none">+</span>
      </button>
    </div>
  </div>
);
