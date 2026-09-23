import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  SiteDevice,
  SiteHomeAggregate,
  SiteItem,
} from '../../api/site';
import { isMobileDevice } from '../../utils/device';
import { runRequestAction } from './index';

export interface UseSiteHomeAggregateOptions {
  /** 是否进入页面时自动加载，默认 true */
  autoFetch?: boolean;
  /**
   * `latest` / `hottest` 各自返回的条数，默认 5（接口范围 1-50）。
   * 推荐榜不受该参数影响，接口固定返回全部推荐。
   */
  defaultSize?: number;
  /** 请求携带的设备标识；不传则按当前运行环境自动判定 */
  defaultDevice?: SiteDevice;
}

/** 按当前运行环境判定设备：触屏/移动 UA 视为 MOBILE，其余视为 PC */
function detectDevice(): SiteDevice {
  return isMobileDevice() ? 'MOBILE' : 'PC';
}

/** 空结果：接口异常或字段缺失时的稳定兜底，避免调用方到处判空 */
const EMPTY_AGGREGATE: SiteHomeAggregate = {
  latest: [],
  hottest: [],
  recommends: [],
};

/**
 * 把接口返回的 `data` 规整为 `SiteHomeAggregate`。
 *
 * 逐字段做 `Array.isArray` 校验而不是整体信任响应：三组数据里只要有一组
 * 不是数组（后端字段名调整 / 异常返回），直接 `.map` 就会整页白屏。
 * 缺的那组退化为空数组，其余两组照常渲染。
 */
function normalize(data: unknown): SiteHomeAggregate {
  const raw = (data ?? {}) as Partial<Record<keyof SiteHomeAggregate, unknown>>;
  const pick = (value: unknown): SiteItem[] =>
    Array.isArray(value) ? (value as SiteItem[]) : [];

  return {
    latest: pick(raw.latest),
    hottest: pick(raw.hottest),
    recommends: pick(raw.recommends),
  };
}

/**
 * 首页聚合数据源（`GET /public/site/homeAggregate`）。
 *
 * 一次请求带回头条区所需的全部站点，替代原先「推荐 / 最新 / 最热」
 * 三次独立分页调用：
 * - 少两次首屏请求；
 * - 三份榜单来自同一时刻的快照，不会出现「最新榜已刷新、推荐榜还是旧的」。
 *
 * 与 `useSiteList` 的区别：本 hook 只负责「首屏整块拉取」，不涉及分页追加，
 * 因此没有 `loadMore` / `hasMore`，也没有分类、搜索等筛选参数。
 * 常规列表仍需用 `useSiteList` 分页（见 WebListPicker）。
 */
export function useSiteHomeAggregate(options: UseSiteHomeAggregateOptions = {}) {
  const {
    autoFetch = true,
    defaultSize = 5,
    defaultDevice = detectDevice(),
  } = options;

  const [data, setData] = useState<SiteHomeAggregate>(EMPTY_AGGREGATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 并发防重入：首屏与刷新可能同时触发 */
  const loadingRef = useRef(false);

  const fetchAggregate = useCallback(
    async (
      size = defaultSize,
      device = defaultDevice,
    ): Promise<SiteHomeAggregate | null> => {
      if (loadingRef.current) return null;
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const res = await runRequestAction('site_get_home_aggregate', {
          size,
          device,
        });
        if (res.ok) {
          const normalized = normalize(res.data);
          setData(normalized);
          return normalized;
        }
        setError(res.message || '获取首页聚合数据失败');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
      return null;
    },
    [defaultSize, defaultDevice],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchAggregate(defaultSize, defaultDevice);
    }
    // 与 useSiteList 保持同样的取舍：仅以 autoFetch 为触发条件，
    // 参数变化由调用方显式重新调用 fetchAggregate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    /** 最新发布榜（按 createTime 倒序） */
    latest: data.latest,
    /** 最热榜（按 count 倒序） */
    hottest: data.hottest,
    /** 全部推荐站点（按 orderNum 升序、createTime 倒序） */
    recommends: data.recommends,
    loading,
    error,
    fetchAggregate,
  };
}

export default useSiteHomeAggregate;
