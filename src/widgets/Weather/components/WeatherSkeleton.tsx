export const WeatherSkeleton: React.FC = () => (
  <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
    {/* 实时天气：对应主卡片（高度与数据卡完全一致） */}
    <div className="glass-panel p-3.5 rounded-[var(--card-radius)] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-16 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
      <div className="my-1">
        <div className="h-7 w-16 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-4 w-14 bg-slate-200 dark:bg-white/10 rounded mt-1.5" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-12 bg-slate-200 dark:bg-white/10 rounded" />
        <div className="h-3.5 w-12 bg-slate-200 dark:bg-white/10 rounded" />
      </div>
    </div>

    {/* 逐小时预报：对应 col-span-2 卡片 */}
    <div className="md:col-span-2 glass-panel p-3.5 rounded-[var(--card-radius)] flex flex-col justify-between">
      <div className="h-3.5 w-20 bg-slate-200 dark:bg-white/10 rounded mb-2" />
      <div className="flex items-center justify-between">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-3.5 w-6 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-6 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>
      {/* 天气参数(湿度/风速/AQI) */}
      <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/10 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3.5 w-full bg-slate-200 dark:bg-white/10 rounded" />
        ))}
      </div>
    </div>

    {/* 5天预报：对应底部 5 列 */}
    <div className="md:col-span-3 pt-2 border-t border-black/5 dark:border-white/10">
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/5 flex flex-col items-center justify-between gap-1"
          >
            <div className="h-3.5 w-6 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-3.5 w-6 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3.5 w-4 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
