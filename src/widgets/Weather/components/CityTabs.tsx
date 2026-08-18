interface Props {
  cities: string[];
  activeCity: string;
  onSwitch: (city: string) => void;
  onRemove: (city: string) => void;
  onAddClick: () => void;
  searchOpen: boolean;
}

export const CityTabs: React.FC<Props> = ({
  cities,
  activeCity,
  onSwitch,
  onRemove,
  onAddClick,
  searchOpen,
}) => (
  <div className="flex flex-wrap gap-1.5">
    {cities.map((c) => (
      <div
        key={c}
        className={`group flex items-center gap-1 rounded-full px-3 py-1 text-sm transition ${
          activeCity === c
            ? 'bg-sky-500 text-white'
            : 'bg-white/50  hover:bg-white/80 dark:bg-white/10  dark:hover:bg-white/20'
        }`}
      >
        <button onClick={() => onSwitch(c)}>{c}</button>
        {cities.length > 1 && (
          <button
            onClick={() => onRemove(c)}
            className="opacity-50 transition hover:opacity-100"
            title="移除城市"
          >
            ×
          </button>
        )}
      </div>
    ))}
    <button
      onClick={onAddClick}
      className="rounded-full bg-white/50 px-3 py-1 text-sm  transition hover:bg-white/80 dark:bg-white/10  dark:hover:bg-white/20"
    >
      + 城市
    </button>
    {searchOpen && null}
  </div>
);
