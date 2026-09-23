import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteDevice, SiteItem } from '../../api/site';
import { isMobileDevice } from '../../utils/device';
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
  /** 排序字段，如 'createTime'；不传则不带排序参数，由后端返回默认顺序 */
  defaultSortField?: string;
  /** 排序方向，'ascend' | 'descend'；不传则不带排序参数 */
  defaultSortOrder?: string;
  /** 请求携带的设备标识；不传则按当前运行环境自动判定 */
  defaultDevice?: SiteDevice;
  /**
   * 推荐筛选：`true` 只看推荐、`false` 只看非推荐（两者互斥）。
   * 为 `undefined` 时才完全不传该参数、返回全部站点。
   *
   * 该条件会同时作用于**首页**与**翻页**（loadMore）两条链路，
   * 否则第 2 页起会换一套口径，列表前后不一致。
   */
  defaultRecommend?: boolean;
}

/** 按当前运行环境判定设备：触屏/移动 UA 视为 MOBILE，其余视为 PC */
function detectDevice(): SiteDevice {
  return isMobileDevice() ? 'MOBILE' : 'PC';
}

export function useSiteList(options: UseSiteListOptions = {}) {
  const {
    defaultPage = 1,
    defaultSize = 12,
    defaultCat = '',
    defaultKw = '',
    autoFetch = true,
    defaultSortField = '',
    defaultSortOrder = '',
    defaultDevice = detectDevice(),
    defaultRecommend = false,
  } = options;

  const [items, setItems] = useState<SiteItem[]>([]);
  /**
   * 是否**尚未就绪**（正在加载，或还没开始加载）。
   *
   * 初始值为 `true` 的原因同 `useSiteHomeAggregate`：首屏渲染发生在
   * `useEffect` 之前，那一刻请求还没发出、`items` 也是空的。
   * 若初始为 `false`，调用方看到「不在加载 + 无数据」，会渲染出
   * 「没有数据」的空态，下一帧才切回骨架 —— 首屏闪一下错误提示。
   */
  const [loading, setLoading] = useState(true);
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
      device = defaultDevice,
      recommend = defaultRecommend,
    ): Promise<SiteItem[] | null> => {
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
      if (device) args.device = device;
      // recommend 是 Boolean 请求参数（文档：`recommend | Boolean | 否 | 是否只看推荐`）。
      // 必须显式传 false，不能只在为 true 时才带 ——
      // 否则 recommend=false 时该参数被丢弃，后端会按「不带条件」返回**全部**站点（含 N 的）。
      if (recommend !== undefined) args.recommend = recommend;

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
            return data.records;
          }
        } else {
          setError(res.message || '获取站点列表失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
      return null;
    },
    [
      defaultCat,
      defaultKw,
      defaultSize,
      defaultSortField,
      defaultSortOrder,
      defaultDevice,
      defaultRecommend,
    ],
  );

  // 触底加载：拉取下一页并**追加**到已有列表（不清空），带并发防重入
  const loadMore = useCallback(
    async (
      cat = defaultCat,
      kw = defaultKw,
      size = defaultSize,
      sortField = defaultSortField,
      sortOrder = defaultSortOrder,
      device = defaultDevice,
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
      if (device) args.device = device;
      // 必须与首页 fetchSites 的筛选条件保持一致：漏传会被后端当成
      // 「不带条件」，于是第 2 页起又把推荐站点捞回来，与首页口径矛盾。
      // 与上方同因，false 也要显式下发。
      if (defaultRecommend !== undefined) args.recommend = defaultRecommend;

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
    [
      defaultCat,
      defaultKw,
      defaultSize,
      defaultSortField,
      defaultSortOrder,
      defaultDevice,
      defaultRecommend,
    ],
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
