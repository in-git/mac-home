import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoItem } from '../../api/video';
import { videoApi } from '../../api/video';

export interface UseVideoListOptions {
  /** 初始页码，默认 1 */
  defaultPage?: number;
  /** 每页条数，默认 12 */
  defaultSize?: number;
  /** 初始搜索关键字 */
  defaultKw?: string;
  /** 是否进入页面时自动加载，默认 true */
  autoFetch?: boolean;
  /** 排序字段，默认 createTime */
  defaultSortField?: string;
  /**
   * 排序方向，默认 descend（最新在前）。
   * 注意：后端只识别**小写** ascend / descend，其它写法一律 500。
   */
  defaultSortOrder?: string;
}

/**
 * 视频列表数据源（C 端只读）。
 * 结构与 useSiteList 保持一致：首屏 / 筛选走 fetchVideos，触底走 loadMore（追加）。
 */
export function useVideoList(options: UseVideoListOptions = {}) {
  const {
    defaultPage = 1,
    defaultSize = 12,
    defaultKw = '',
    autoFetch = true,
    defaultSortField = 'createTime',
    defaultSortOrder = 'descend',
  } = options;

  const [items, setItems] = useState<VideoItem[]>([]);
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

  /** 首屏 / 筛选加载：替换列表 */
  const fetchVideos = useCallback(
    async (
      p = pageRef.current,
      kw = defaultKw,
      size = defaultSize,
      sortField = defaultSortField,
      sortOrder = defaultSortOrder,
    ): Promise<VideoItem[] | null> => {
      setLoading(true);
      setError(null);
      pageRef.current = p;

      try {
        const data = await videoApi.getPage({
          current: p,
          size,
          searchKey: kw || undefined,
          sortField: sortField || undefined,
          sortOrder: sortOrder || undefined,
        });
        if (Array.isArray(data?.records)) {
          setItems(data.records);
          setPage(data.current ?? p);
          pageRef.current = data.current ?? p;
          setTotalPages(data.pages ?? 1);
          totalPagesRef.current = data.pages ?? 1;
          setTotal(data.total ?? 0);
          return data.records;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
      return null;
    },
    [defaultKw, defaultSize, defaultSortField, defaultSortOrder],
  );

  /** 触底加载：拉取下一页并追加，带并发防重入 */
  const loadMore = useCallback(
    async (
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

      try {
        const data = await videoApi.getPage({
          current: next,
          size,
          searchKey: kw || undefined,
          sortField: sortField || undefined,
          sortOrder: sortOrder || undefined,
        });
        if (Array.isArray(data?.records)) {
          setItems((prev) => [...prev, ...data.records]);
          setPage(data.current ?? next);
          pageRef.current = data.current ?? next;
          setTotalPages(data.pages ?? 1);
          totalPagesRef.current = data.pages ?? 1;
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setAppendLoading(false);
        loadingRef.current = false;
      }
    },
    [defaultKw, defaultSize, defaultSortField, defaultSortOrder],
  );

  const hasMore = page < totalPages;

  /**
   * 局部更新某一项（不重新请求列表）。
   * 用于点击后乐观更新浏览量等场景。
   */
  const patchItem = useCallback(
    (id: string, patch: Partial<VideoItem> | ((item: VideoItem) => Partial<VideoItem>)) => {
      setItems((prev) =>
        prev.map((v) =>
          v.id === id
            ? { ...v, ...(typeof patch === 'function' ? patch(v) : patch) }
            : v,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchVideos(defaultPage, defaultKw, defaultSize);
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
    fetchVideos,
    loadMore,
    patchItem,
  };
}
