import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteItem } from '../../api/site';
import { runRequestAction } from './index';

export interface UseSiteListOptions {
  /** 初始页码，默认 1 */
  defaultPage?: number;
  /** 每页条数，默认 12 */
  defaultSize?: number;
  /** 初始分类 ID */
  defaultCat?: string;
  /** 初始搜索关键字 */
  defaultKw?: string;
  /** 是否进入页面时自动加载，默认 true */
  autoFetch?: boolean;
  /** 排序字段，如 'createTime' */
  defaultSortField?: string;
  /** 排序方向，'ascend' | 'descend' */
  defaultSortOrder?: string;
}

export function useSiteList(options: UseSiteListOptions = {}) {
  const {
    defaultPage = 1,
    defaultSize = 12,
    defaultCat = '',
    defaultKw = '',
    autoFetch = true,
    defaultSortField = 'createTime',
    defaultSortOrder = 'ASCEND',
  } = options;

  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [appendLoading, setAppendLoading] = useState(false);
  const [page, setPage] = useState(defaultPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 用 ref 保存最新分页信息，避免回调闭包滞后导致并发重复加载同一页
  const pageRef = useRef(page);
  const totalPagesRef = useRef(totalPages);
  const loadingRef = useRef(false);
  pageRef.current = page;
  totalPagesRef.current = totalPages;

  // 首屏/筛选加载：依赖只保留常量，引用保持稳定，避免调用方 effect 因 page 变化反复触发
  const fetchSites = useCallback(
    async (
      p = pageRef.current,
      cat = defaultCat,
      kw = defaultKw,
      size = defaultSize,
      sortField = defaultSortField,
      sortOrder = defaultSortOrder,
    ) => {
      setLoading(true);
      setError(null);
      pageRef.current = p;

      const args: Record<string, unknown> = {
        current: p,
        size,
      };
      if (cat) args.categoryId = cat;
      if (kw) args.searchKey = kw;
      if (sortField) args.sortField = sortField;
      if (sortOrder) args.sortOrder = sortOrder;

      try {
        const res = await runRequestAction('site_get_page', args);
        if (res.ok && res.data) {
          const data = res.data as {
            records?: SiteItem[];
            current?: number;
            pages?: number;
            total?: number;
          };
          if (Array.isArray(data.records)) {
            setItems(data.records);
            setPage(data.current ?? p);
            pageRef.current = data.current ?? p;
            setTotalPages(data.pages ?? 1);
            totalPagesRef.current = data.pages ?? 1;
            setTotal(data.total ?? 0);
          }
        } else {
          setError(res.message || '获取站点列表失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [defaultCat, defaultKw, defaultSize, defaultSortField, defaultSortOrder],
  );

  // 触底加载：拉取下一页并**追加**到已有列表（不清空），带并发防重入
  const loadMore = useCallback(
    async (
      cat = defaultCat,
      kw = defaultKw,
      size = defaultSize,
      sortField = defaultSortField,
      sortOrder = defaultSortOrder,
    ) => {
      if (loadingRef.current) return; // 上一次尚未完成，避免重复加载
      const next = pageRef.current + 1;
      if (next > totalPagesRef.current) return;
      loadingRef.current = true;
      setAppendLoading(true);
      setError(null);

      const args: Record<string, unknown> = {
        current: next,
        size,
      };
      if (cat) args.categoryId = cat;
      if (kw) args.searchKey = kw;
      if (sortField) args.sortField = sortField;
      if (sortOrder) args.sortOrder = sortOrder;

      try {
        const res = await runRequestAction('site_get_page', args);
        if (res.ok && res.data) {
          const data = res.data as {
            records?: SiteItem[];
            current?: number;
            pages?: number;
            total?: number;
          };
          if (Array.isArray(data.records)) {
            // 追加而非替换
            setItems((prev) => [...prev, ...data.records!]);
            setPage(data.current ?? next);
            pageRef.current = data.current ?? next;
            setTotalPages(data.pages ?? 1);
            totalPagesRef.current = data.pages ?? 1;
            setTotal(data.total ?? 0);
          }
        } else {
          setError(res.message || '获取站点列表失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setAppendLoading(false);
        loadingRef.current = false;
      }
    },
    [defaultCat, defaultKw, defaultSize, defaultSortField, defaultSortOrder],
  );

  const hasMore = page < totalPages;

  useEffect(() => {
    if (autoFetch) {
      fetchSites(defaultPage, defaultCat, defaultKw, defaultSize);
    }
  }, [autoFetch]);

  return {
    items,
    loading,
    appendLoading,
    hasMore,
    page,
    totalPages,
    total,
    error,
    fetchSites,
    loadMore,
    setItems,
    setPage,
  };
}
