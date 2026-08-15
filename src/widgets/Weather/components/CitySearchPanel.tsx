import { Search, X, Loader2, Plus } from 'lucide-react';
import type { WeatherCity } from '../../../utils/weatherApi';

interface Props {
  query: string;
  results: WeatherCity[];
  searching: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onQueryChange: (q: string) => void;
  onSelect: (c: WeatherCity) => void;
  onClose: () => void;
}

export const CitySearchPanel: React.FC<Props> = ({
  query,
  results,
  searching,
  inputRef,
  onQueryChange,
  onSelect,
  onClose,
}) => (
  <div className="relative mb-2">
    <div className="flex items-center gap-1.5 glass-panel rounded-[var(--card-radius)] px-2.5 py-1.5">
      <Search size={14} className="text-slate-400 shrink-0" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        placeholder="搜索城市，如：广州、纽约…"
        className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 py-0.5 min-w-0"
      />
      {searching && <Loader2 size={12} className="animate-spin shrink-0" />}
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
        <X size={12} />
      </button>
    </div>

    {results.length > 0 && (
      <div className="absolute top-full left-0 right-0 mt-1 z-10 glass-panel rounded-[var(--card-radius)] p-1 max-h-56 overflow-y-auto shadow-xl">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[var(--card-radius)] text-left hover:bg-[color:var(--accent)]/10 transition-colors"
          >
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {r.name}
              <span className="text-font-sm ml-1">
                {r.admin1 ? `${r.admin1} · ` : ''}
                {r.country}
              </span>
            </span>
            <Plus size={12} className="text-slate-400 shrink-0" />
          </button>
        ))}
      </div>
    )}
    {query.trim() && !searching && results.length === 0 && (
      <div className="absolute top-full left-0 right-0 mt-1 z-10 glass-panel rounded-[var(--card-radius)] p-2.5 text-center text-font-sm">
        未找到相关城市
      </div>
    )}
  </div>
);
