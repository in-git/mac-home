import { Check, ChevronDown, Search } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import googleIcon from './assets/google.png';
import bingIcon from './assets/bing.png';
import baiduIcon from './assets/baidu.png';

export type SearchEngineId = 'google' | 'bing' | 'baidu';

export interface SearchEngine {
  id: SearchEngineId;
  name: string;
  url: string;
  placeholder: string;
  icon: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    placeholder: '输入搜索内容',
    icon: googleIcon,
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=%s',
    placeholder: '输入搜索内容',
    icon: bingIcon,
  },
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd=%s',
    placeholder: '输入搜索内容',
    icon: baiduIcon,
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const currentEngine =
    SEARCH_ENGINES.find((e) => e.id === engineId) ?? SEARCH_ENGINES[0];

  const handleToggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setShowDropdown(!showDropdown);
  };

  const handleSelectEngine = (id: SearchEngineId) => {
    setEngineId(id);
    setShowDropdown(false);
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
    <div className="h-full flex items-center justify-center p-6">
      <form onSubmit={handleSearch} className="w-full max-w-2xl">
        <div className="relative flex items-stretch bg-white/95 dark:bg-white/10 rounded-full backdrop-blur-md transition-colors focus-within:ring-2 focus-within:ring-[color:var(--accent)]/50">
          {/* 左侧：搜索引擎选择器 */}
          <div className="relative flex items-center">
            <button
              ref={buttonRef}
              type="button"
              onClick={handleToggleDropdown}
              className="flex items-center gap-1 px-3 h-full text-xs hover:text-[color:var(--accent)] transition-colors active:scale-95"
            >
              <img
                src={currentEngine.icon}
                alt={currentEngine.name}
                className="w-4 h-4 rounded-full object-contain"
              />
              <ChevronDown
                size={14}
                className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            {/* 下拉菜单（Portal 挂载到 body） */}
            {showDropdown &&
              createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div
                    className="fixed z-[9999] bg-white dark:bg-slate-900 rounded-[var(--card-radius)] shadow-lg border border-black/5 dark:border-white/10 overflow-hidden min-w-[140px]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                    }}
                  >
                    {SEARCH_ENGINES.map((engine) => {
                      const active = engine.id === engineId;
                      return (
                        <button
                          key={engine.id}
                          type="button"
                          onClick={() => handleSelectEngine(engine.id)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                            active
                              ? 'bg-black/5 dark:bg-white/10 text-[color:var(--accent)]'
                              : 'hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={engine.icon}
                              alt={engine.name}
                              className="w-4 h-4 rounded-full object-contain"
                            />
                            <span>{engine.name}</span>
                          </div>
                          {active && (
                            <Check size={14} className="text-[color:var(--accent)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>,
                document.body,
              )}
          </div>

          {/* 分隔线 */}
          <div className="w-px bg-black/10 dark:bg-white/20 my-2" />

          {/* 中间：输入框 */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentEngine.placeholder}
            className="flex-1 px-4 py-3 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />

          {/* 右侧：搜索图标按钮 */}
          <button
            type="submit"
            className="flex items-center justify-center px-4 hover:text-[color:var(--accent)] transition-colors active:scale-95"
          >
            <Search size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchWidget;
