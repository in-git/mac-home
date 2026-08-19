import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteList } from '../../agent/request';
import type { SiteItem } from '../../api/site';

// 原生 SVG 旋转 Loading 动画组件
const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => (
  <svg
    className={`animate-spin ${className}`}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3.5"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export interface RandomWebWidgetCardProps {
  expanded: boolean;
}

/**
 * 随机站点发现卡片：
 * 从后端站点库中随机抽取一个站点展示，封面占满容器，左右箭头导航。
 */
export const RandomWebWidgetCard: React.FC<RandomWebWidgetCardProps> = ({
  expanded,
}) => {
  const [randomSite, setRandomSite] = useState<SiteItem | null>(null);
  const [history, setHistory] = useState<SiteItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { items, loading, fetchSites, total } = useSiteList({
    defaultPage: 1,
    defaultSize: 1, // 每次只请求 1 个站点；首次请求同时获取 total 总数
    autoFetch: true,
  });

  // 用 ref 保存最新的 items 和 total，避免闭包问题
  const itemsRef = useRef<SiteItem[]>([]);
  const totalRef = useRef(total);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    totalRef.current = total;
  }, [total]);

  // 直接取第一个站点（每次只请求 1 个）
  const pickRandomSite = () => {
    if (items.length === 0) return null;
    return items[0];
  };

  // 添加到历史记录
  const addToHistory = (site: SiteItem) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(site);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setRandomSite(site);
  };

  // 初始化：items 加载完成后选取第一个随机站点
  useEffect(() => {
    if (!loading && items.length > 0 && !randomSite) {
      const site = pickRandomSite();
      if (site) addToHistory(site);
    }
  }, [loading, items, randomSite]);

  // 左箭头：返回上一个
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setRandomSite(history[prevIndex]);
    }
  };

  // 右箭头：随机下一个
  const handleNext = async () => {
    // 如果在历史记录中间，先尝试前进
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setRandomSite(history[nextIndex]);
      return;
    }

    // 否则随机新站点：需要重新获取最新的 total
    setIsRefreshing(true);
    const randomPage = total > 0 ? Math.floor(Math.random() * total) + 1 : 1;
    await fetchSites(randomPage, '', '', 1);

    // 直接从 fetchSites 后的 items 中获取（fetchSites 已经是 async 等待完成的）
    // 需要用 setTimeout 确保状态已更新
    setTimeout(() => {
      // 重新获取最新的 items 和 total
      const currentItems = itemsRef.current;
      if (currentItems.length > 0) {
        const randomSite = currentItems[0];
        addToHistory(randomSite);
      } else {
        // 如果 items 仍然为空，尝试再获取一次
        fetchSites(Math.floor(Math.random() * (totalRef.current || 10)) + 1, '', '', 1).then(() => {
          const retryItems = itemsRef.current;
          if (retryItems.length > 0) {
            addToHistory(retryItems[0]);
          }
        });
      }
      setIsRefreshing(false);
    }, 100);
  };

  // 展开态下锁定页面滚动
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [expanded]);

  const handleVisit = () => {
    if (randomSite?.link) {
      window.open(randomSite.link, '_blank', 'noreferrer');
    }
  };

  // 加载中（首次加载且无数据）
  if (loading && !randomSite) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-[var(--card-radius)]">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <LoadingSpinner size={36} />
          <p className="text-sm">正在加载站点...</p>
        </div>
      </div>
    );
  }

  // 无数据
  if (!randomSite) {
    return (
      <div className="relative w-full h-full  flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-[var(--card-radius)]">
        <p className="text-sm ">暂无站点数据</p>
      </div>
    );
  }

  const coverImage = randomSite.cover || randomSite.screenshot || randomSite.background;

  return (
    <div 
      className="relative w-full h-full overflow-hidden rounded-[var(--card-radius)] group cursor-pointer"
      onClick={handleVisit}
    >
      {/* 背景封面图（占满容器） */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: coverImage
            ? `url(${coverImage})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />

      {/* 左右箭头导航（鼠标悬停显示） */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrevious();
        }}
        disabled={currentIndex <= 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 active:scale-95 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={24} className="text-white" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        disabled={isRefreshing}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 active:scale-95 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* 刷新加载遮罩：点击右箭头时在整个容器居中展示 loading */}
      {isRefreshing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-all">
          <div className="flex flex-col items-center gap-3 text-white">
            <LoadingSpinner size={40} />
            <p className="text-sm font-medium drop-shadow">正在获取站点...</p>
          </div>
        </div>
      )}

      {/* 内容层：只在底部文字区域添加深色背景 */}
      <div className="relative h-full flex flex-col justify-end">
        {/* 站点信息：带半透明深色背景 */}
        <div className="space-y-2 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          {/* Logo + 名称 */}
          <div className="flex items-center gap-3">
            {randomSite.logo && (
              <img
                src={randomSite.logo}
                alt={randomSite.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-white/30"
              />
            )}
            <div>
              <h3 className="text-xl text-nowrap  truncate w-40 font-bold text-white drop-shadow-lg">
                {randomSite.name}
              </h3>
                {/* 描述 */}
          {randomSite.des && (
            <p className="text-sm text-white line-clamp-2 drop-shadow">
              {randomSite.des}
            </p>
          )}
            </div>
          </div>

       
        </div>
      </div>
    </div>
  );
};
