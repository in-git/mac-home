import { useCallback, useEffect, useState } from 'react';
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
}

export function useSiteList(options: UseSiteListOptions = {}) {
  const {
    defaultPage = 1,
    defaultSize = 12,
    defaultCat = '',
    defaultKw = '',
    autoFetch = true,
  } = options;

  const [items, setItems] = useState<SiteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(defaultPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useCallback(
    async (p = page, cat = defaultCat, kw = defaultKw, size = defaultSize) => {
      setLoading(true);
      setError(null);
      setItems([]);

      const args: Record<string, unknown> = {
        current: p,
        size,
      };
      if (cat) args.categoryId = cat;
      if (kw) args.searchKey = kw;

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
            setTotalPages(data.pages ?? 1);
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
    [page, defaultCat, defaultKw, defaultSize],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchSites(defaultPage, defaultCat, defaultKw, defaultSize);
    }
  }, [autoFetch]);

  return {
    items,
    loading,
    page,
    totalPages,
    total,
    error,
    fetchSites,
    setItems,
    setPage,
  };
}
