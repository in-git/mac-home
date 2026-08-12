import { ArrowRight, ExternalLink, Globe, Search } from 'lucide-react';
import React, { useState } from 'react';

export type SearchEngineId = 'google' | 'bing' | 'baidu';

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  url: string; // 拼接关键词用的 URL 格式，%s 替换为 query
  placeholder: string;
  iconBg: string; // 图标气泡底色
  badgeColor: string; // 选中状态的亮点颜色
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    placeholder: '用 Google 搜索...',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-[color:var(--accent)] text-white',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=%s',
    placeholder: '用 必应 搜索...',
    iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    badgeColor: 'bg-cyan-600 text-white',
  },
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd=%s',
    placeholder: '用 百度 搜索...',
    iconBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
    badgeColor: 'bg-red-500 text-white',
  },
];

const STORAGE_KEY = 'weather-search-engine';

export const SearchWidget: React.FC = () => {
  const [engineId, setEngineId] = useState<SearchEngineId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['google', 'bing', 'baidu'].includes(saved)) {
        return saved as SearchEngineId;
      }
    } catch {
      // 忽略存储异常
    }
    return 'google';
  });

  const [query, setQuery] = useState('');
  const currentEngine =
    SEARCH_ENGINES.find((e) => e.id === engineId) ?? SEARCH_ENGINES[0];

  const handleSelectEngine = (id: SearchEngineId) => {
    setEngineId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // 忽略存储异常
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const targetUrl = currentEngine.url.replace(
      '%s',
      encodeURIComponent(trimmed),
    );
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1">
      {/* 引擎分段切换器 (Segmented Control 遵循 UI 规范 12px / 10px 圆角与哑光底色) */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center space-x-1.5 text-xs font-semibold dark:text-slate-400 uppercase tracking-wider">
          <Globe size={13} className="text-[color:var(--accent)]" />
          <span>搜索</span>
        </div>

        {/* 12px 哑光容器 + 10px Pill 选中项 */}
        <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-[var(--card-radius)]">
          {SEARCH_ENGINES.map((engine) => {
            const isSelected = engine.id === engineId;
            return (
              <button
                key={engine.id}
                type="button"
                onClick={() => handleSelectEngine(engine.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-[var(--card-radius)] transition-colors ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-[color:var(--accent)] shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {engine.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 搜索输入表单（遵循 UI 规范：12px 圆角、哑光磨砂底色、Focus 蓝光） */}
      <form onSubmit={handleSearch} className="my-auto py-2">
        <div className="relative flex items-center">
          {/* 左侧搜索图标 */}
          <div className="absolute left-3 flex items-center justify-center  pointer-events-none">
            <Search size={15} />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentEngine.placeholder}
            className="search-input w-full pl-9 pr-24 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 rounded-[var(--card-radius)] transition-colors outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50 placeholder:text-slate-400"
          />

          {/* 右侧直接提交按钮（遵循 UI 规范 严格 2:1 或正方形操作，使用 Apple 蓝） */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute right-1.5 px-3 py-1.5 bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] text-white rounded-[var(--card-radius)] text-xs font-medium active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center space-x-1 shadow-xs"
          >
            <span>搜索</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </form>

      {/* 底部常用热搜/快速提示脚部 */}
      <div className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-font-sm dark:text-slate-400">
        <span>
          当前引擎:{' '}
          <strong className="text-slate-700 dark:text-slate-200">
            {currentEngine.name}
          </strong>
        </span>
        <a
          href={currentEngine.url.replace('%s', '')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-0.5 hover:text-[color:var(--accent)] transition-colors"
        >
          <span>访问主页</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};
