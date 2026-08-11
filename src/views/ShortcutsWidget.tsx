import {
  ExternalLink,
  Globe,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Skeleton, Tooltip } from '@heroui/react';
import { toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { siteApi, SiteCategory, SiteIdentity, SiteItem } from '../api/site';
import { PRESET_DATA } from '../data/presetData';
import { QuickShortcut } from '../types';
import { playSound } from '../utils/sound';
import { ShortcutsWidgetCard } from '../widgets/ShortcutsWidget';

interface ShortcutsWidgetProps {
  expanded?: boolean;
  onExpand?: () => void;
}

function flattenCategories(categories: SiteCategory[]): SiteCategory[] {
  const result: SiteCategory[] = [];
  const walk = (list: SiteCategory[]) => {
    for (const c of list) {
      result.push(c);
      if (c.children && c.children.length > 0) walk(c.children);
    }
  };
  walk(categories);
  return result;
}

interface SiteCardProps {
  item: SiteItem;
  onOpen: (item: SiteItem) => void;
  onAdd: (item: SiteItem) => void;
}

const SiteCard: React.FC<SiteCardProps> = ({ item, onOpen, onAdd }) => {
  const imgSrc = item.cover || item.logo;
  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40  bg-white dark:bg-white/5 min-h-[160px] cursor-pointer"
      title={`打开 ${item.name}`}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center text-white text-2xl font-bold"
            style={{
              background:
                item.background ||
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {(item.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {item.count !== undefined && item.count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[12px] font-semibold leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65">
            <ExternalLink size={12} className="opacity-90" />
            {item.count > 999 ? '999+' : item.count}
          </span>
        )}
      </div>
      <div className="p-2 text-left">
        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
          {item.name}
        </p>
        {item.des && (
          <p className="truncate text-font-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {item.des}
          </p>
        )}
      </div>

      {/* 添加按钮：不关闭弹窗、不触发外部打开 */}
      <Tooltip>
        <Tooltip.Trigger>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[color:var(--accent)] text-white shadow hover:bg-[color:var(--accent-hover)] transition-transform active:scale-95 opacity-0 group-hover:opacity-100"
          >
            <Plus size={13} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content showArrow placement="top" className="text-font-xs">
          添加到快捷导航
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
};

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({
  expanded = false,
  onExpand,
}) => {
  const [shortcuts, setShortcuts] = useState<QuickShortcut[]>(
    PRESET_DATA.INITIAL_SHORTCUTS,
  );
  const [showAdd, setShowAdd] = useState(false);

  const [categories, setCategories] = useState<SiteCategory[]>([]);
  const [identities, setIdentities] = useState<SiteIdentity[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedIdentity, setSelectedIdentity] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSites = useCallback(
    async (
      p = 1,
      cat = selectedCat,
      identity = selectedIdentity,
      kw = searchKeyword,
    ) => {
      setLoading(true);
      const params: Record<string, unknown> = { current: p, size: 12 };
      if (cat) params.categoryId = cat;
      if (identity) params.identityId = identity;
      if (kw) params.searchKey = kw;
      try {
        const res = await siteApi.getPage(
          params as Parameters<typeof siteApi.getPage>[0],
        );
        if (res && Array.isArray(res.records)) {
          setItems(res.records);
          setPage(res.current ?? p);
          setTotalPages(res.pages ?? 1);
        }
      } catch {
        /* noop */
      } finally {
        setLoading(false);
      }
    },
    [selectedCat, selectedIdentity, searchKeyword],
  );

  useEffect(() => {
    if (!showAdd) return;
    (async () => {
      try {
        const [identityRes, categoryRes] = await Promise.all([
          siteApi.getIdentityList(),
          siteApi.getCategoryTree(),
        ]);
        if (Array.isArray(identityRes)) setIdentities(identityRes);
        if (Array.isArray(categoryRes))
          setCategories(flattenCategories(categoryRes));
        fetchSites(1, '', '', '');
      } catch {
        /* noop */
      }
    })();
  }, [showAdd]);

  useEffect(() => {
    if (!showAdd) return;
    fetchSites(1, selectedCat, selectedIdentity, searchKeyword);
  }, [selectedCat, selectedIdentity, showAdd]);

  useEffect(() => {
    if (!showAdd) return;
    const timer = setTimeout(() => {
      fetchSites(1, selectedCat, selectedIdentity, searchKeyword);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const handleAddFromSite = (item: SiteItem) => {
    const url = item.link || '#';
    // 去重：已存在相同 URL 的快捷项则提示并跳过，避免重复添加
    if (shortcuts.some((s) => s.url === url)) {
      toast.warning(`「${item.name || '未命名'}」已在快捷导航中`);
      return;
    }
    const shortcut: QuickShortcut = {
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.name || item.des?.slice(0, 20) || '未命名',
      url,
      iconName: 'Globe',
      category: item.categoryList?.[0]?.name || item.module || '站点',
      bgColor: item.background || 'bg-slate-800 text-white',
      imageUrl: item.cover || item.logo,
      thumbnailUrl: item.logo,
      count: item.count ?? 0,
    };
    // 再次以函数式更新兜底，防止极速连点导致的竞态重复
    setShortcuts((prev) =>
      prev.some((s) => s.url === url) ? prev : [...prev, shortcut],
    );
    void (async () => {
      try {
        await siteApi.recordClick(item.id);
      } catch {
        /* noop */
      }
    })();
    // 不关闭弹窗，用全局 Toast 显示添加成功提示
    toast.success(`已添加「${item.name || '未命名'}」到快捷导航`);
  };

  // 在外部打开站点链接
  const handleOpenSite = (item: SiteItem) => {
    if (item.link) window.open(item.link, '_blank', 'noreferrer');
    playSound.playClick();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  // 点击卡片在外部打开，并本地递增访问次数（与「添加」逻辑互不冲突）
  const handleOpen = (s: QuickShortcut) => {
    playSound.playClick();
    setShortcuts((prev) =>
      prev.map((item) =>
        item.id === s.id ? { ...item, count: (item.count ?? 0) + 1 } : item,
      ),
    );
  };

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] w-full rounded-[var(--card-radius)]" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <ShortcutsWidgetCard
        expanded={expanded}
        onExpand={onExpand}
        shortcuts={shortcuts}
        onAddClick={() => setShowAdd(true)}
        onDelete={handleDelete}
        onOpen={handleOpen}
      />

      <Modal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
          setSelectedCat('');
          setSelectedIdentity('');
          setSearchKeyword('');
        }}
        title="站点库"
        icon={<Globe size={16} className="text-[color:var(--accent)]" />}
        className="w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[60vw] min-h-[80vh] md:min-h-[70vh]"
      >
        <div className="flex flex-col h-full max-h-[75vh]">
          {/* Filter Bar */}
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索站点名称/描述..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 outline-none text-xs focus:ring-2 ring-[color:var(--accent)]/40"
                />
              </div>
              <button
                onClick={() =>
                  fetchSites(page, selectedCat, selectedIdentity, searchKeyword)
                }
                className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 text-slate-500 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                title="刷新"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline text-xs">刷新</span>
              </button>
            </div>

            {/* Identity filter */}
            {identities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-font-xs mr-1">身份</span>
                <button
                  onClick={() => setSelectedIdentity('')}
                  className={`rounded-[var(--card-radius)] px-2.5 py-1 transition-colors ${
                    selectedIdentity === ''
                      ? 'bg-[color:var(--accent)] font-medium text-white'
                      : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  全部
                </button>
                {identities.map((id) => (
                  <button
                    key={id.id}
                    onClick={() => setSelectedIdentity(id.id)}
                    className={`rounded-[var(--card-radius)] px-2.5 py-1 transition-colors ${
                      selectedIdentity === id.id
                        ? 'bg-[color:var(--accent)] font-medium text-white'
                        : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
                    }`}
                  >
                    {id.identityName}
                  </button>
                ))}
              </div>
            )}

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-font-xs mr-1">分类</span>
                <button
                  onClick={() => setSelectedCat('')}
                  className={`rounded-[var(--card-radius)] px-2.5 py-1 transition-colors ${
                    selectedCat === ''
                      ? 'bg-[color:var(--accent)] font-medium text-white'
                      : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  全部
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`rounded-[var(--card-radius)] px-2.5 py-1 transition-colors ${
                      selectedCat === c.id
                        ? 'bg-[color:var(--accent)] font-medium text-white'
                        : 'bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Site Grid */}
          <div className="flex-1 overflow-y-auto p-4 min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
            {loading && items.length === 0 ? (
              renderSkeletonGrid()
            ) : items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((item) => (
                  <SiteCard
                    key={item.id}
                    item={item}
                    onOpen={handleOpenSite}
                    onAdd={handleAddFromSite}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400 gap-2 min-h-[300px]">
                <Globe size={32} strokeWidth={1} />
                <p className="text-sm">暂无站点</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
              <span>
                共 {totalPages} 页 · {items.length} 条/页
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    fetchSites(page - 1, selectedCat, selectedIdentity, searchKeyword)
                  }
                  className="rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <span className="px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() =>
                    fetchSites(page + 1, selectedCat, selectedIdentity, searchKeyword)
                  }
                  className="rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
