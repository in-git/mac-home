import {
  Check,
  ExternalLink,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Skeleton, Tooltip } from '@heroui/react';
import { siteApi, SiteCategory, SiteIdentity, SiteItem } from '../api/site';

/**
 * 网页列表（WebListPicker）：
 * 通用站点选择器，供多个组件复用（如快捷导航的「站点库」）。
 * 内置搜索/身份/分类过滤、分页加载与站点卡片网格。
 * 选中状态由父组件传入（selected），新增 / 删除等变更事件均交由父组件处理。
 */
export interface WebListPickerProps {
  /** 已选中的站点列表（由父组件持有），用于标记「已新增」并渲染删除入口 */
  selected: SiteItem[];
  /** 点击「添加」按钮时的回调 */
  onAdd: (item: SiteItem) => void;
  /** 点击「删除」已选站点时的回调；缺省时已选卡片只显示勾标记 */
  onRemove?: (item: SiteItem) => void;
  /** 点击卡片打开站点时的回调；缺省时在新窗口打开 */
  onOpen?: (item: SiteItem) => void;
  /** 添加按钮的 Tooltip 文案 */
  addTip?: string;
  /** 删除按钮的 Tooltip 文案 */
  removeTip?: string;
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
  onRemove?: (item: SiteItem) => void;
  exists: boolean;
  addTip: string;
  removeTip?: string;
}

const SiteCard: React.FC<SiteCardProps> = ({
  item,
  onOpen,
  onAdd,
  onRemove,
  exists,
  addTip,
  removeTip = '删除',
}) => {
  const imgSrc = item.cover || item.logo;
  return (
    <div
      onClick={() => onOpen(item)}
      className="group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 hover:border-[color:var(--accent)] hover:ring-2 hover:ring-[color:var(--accent)]/40  bg-white dark:bg-white/5 min-h-[190px] cursor-pointer"
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
            className="h-full w-full flex items-center justify-center text-white text-3xl font-bold"
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
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 text-white text-[13px] font-semibold leading-none shadow-md ring-1 ring-white/15 backdrop-blur-md duration-200 group-hover:scale-105 group-hover:bg-black/65">
            <ExternalLink size={13} className="opacity-90" />
            {item.count > 999 ? '999+' : item.count}
          </span>
        )}

        {/* 已存在：左上角显示勾图标 + 删除按钮；否则居中显示添加按钮（悬停时出现） */}
        {exists ? (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-1 ring-white/15"
              title="已新增"
            >
              <Check size={14} strokeWidth={3} />
            </span>
            {onRemove && (
              <Tooltip>
                <Tooltip.Trigger>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white shadow-md ring-1 ring-white/15 hover:bg-red-500 transition-colors"
                    title={removeTip}
                  >
                    <Trash2 size={13} />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content showArrow placement="top" className="text-xs">
                  {removeTip}
                </Tooltip.Content>
              </Tooltip>
            )}
          </div>
        ) : (
          <Tooltip>
            <Tooltip.Trigger>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd(item);
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-[color:var(--accent)] text-white shadow hover:bg-[color:var(--accent-hover)] transition-transform active:scale-95 opacity-0 group-hover:opacity-100"
              >
                <Plus size={15} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content showArrow placement="top" className="text-xs">
              {addTip}
            </Tooltip.Content>
          </Tooltip>
        )}
      </div>
      <div className="p-2.5 text-left">
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {item.name}
        </p>
        {item.des && (
          <p className="truncate text-xs dark:text-slate-400 mt-0.5">
            {item.des}
          </p>
        )}
      </div>
    </div>
  );
};

export const WebListPicker: React.FC<WebListPickerProps> = ({
  selected = [],
  onAdd,
  onRemove,
  onOpen,
  addTip = '添加',
  removeTip = '删除',
}) => {
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

  // 挂载时加载身份/分类元数据并拉取首批站点
  useEffect(() => {
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
  }, []);

  // 身份/分类变化时回到第一页重新拉取
  useEffect(() => {
    fetchSites(1, selectedCat, selectedIdentity, searchKeyword);
  }, [selectedCat, selectedIdentity]);

  // 关键词搜索：400ms 防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSites(1, selectedCat, selectedIdentity, searchKeyword);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 点击卡片打开站点：优先走调用方回调，缺省时新窗口打开
  const handleOpen = (item: SiteItem) => {
    if (onOpen) {
      onOpen(item);
    } else if (item.link) {
      window.open(item.link, '_blank', 'noreferrer');
    }
  };

  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2.5">
          <Skeleton className="aspect-[4/3] w-full rounded-[var(--card-radius)]" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      {/* Filter Bar */}
      <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索站点名称/描述..."
              className="w-full pl-9 pr-3 py-2 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 outline-none text-sm focus:ring-2 ring-[color:var(--accent)]/40"
            />
          </div>
          <button
            onClick={() =>
              fetchSites(page, selectedCat, selectedIdentity, searchKeyword)
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--card-radius)] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
            title="刷新"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline text-sm">刷新</span>
          </button>
        </div>

        {/* Identity filter */}
        {identities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400 text-xs mr-1">身份</span>
            <button
              onClick={() => setSelectedIdentity('')}
              className={`rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
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
                className={`rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
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
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400 text-xs mr-1">分类</span>
            <button
              onClick={() => setSelectedCat('')}
              className={`rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
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
                className={`rounded-[var(--card-radius)] px-3 py-1.5 transition-colors ${
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
      <div className="flex-1 overflow-y-auto p-5 min-h-[320px] md:min-h-[420px] lg:min-h-[520px]">
        {loading && items.length === 0 ? (
          renderSkeletonGrid()
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <SiteCard
                key={item.id}
                item={item}
                onOpen={handleOpen}
                onAdd={onAdd}
                onRemove={onRemove}
                exists={selected.some((s) => s.link === (item.link || '#'))}
                addTip={addTip}
                removeTip={removeTip}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-slate-400 gap-2 min-h-[320px]">
            <Globe size={36} strokeWidth={1} />
            <p className="text-base">暂无站点</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-sm text-slate-500">
          <span>
            共 {totalPages} 页 · {items.length} 条/页
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() =>
                fetchSites(page - 1, selectedCat, selectedIdentity, searchKeyword)
              }
              className="rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 px-3.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              className="rounded-[var(--card-radius)] border border-black/10 dark:border-white/10 px-3.5 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebListPicker;
