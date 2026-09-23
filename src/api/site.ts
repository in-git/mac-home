import { PageResult, request } from '../utils/request';

export interface SiteCategory {
  id: string;
  parentId?: string;
  name: string;
  icon?: string;
  sort?: number;
  module?: string;
  children?: SiteCategory[];
}

export interface SiteIdentity {
  id: string;
  identityName: string;
}

/** 站点适用设备：请求参数 device 的取值 */
export type SiteDevice = 'PC' | 'MOBILE' | 'COMPATIBLE';

/**
 * 归一化信号强度：合法范围 1-5（1 最弱、5 最强）。
 * 非法值（非数值 / 越界）返回 null，表示不展示信号。
 */
export function normalizeSignal(signal?: number): number | null {
  if (typeof signal !== 'number' || !Number.isFinite(signal)) return null;
  const rounded = Math.round(signal);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

export interface SiteItem {
  // 数据库的ID
  id?: string;
  // 应用名称
  name: string;
  // 网页的logo
  logo?: string;
  // 应用的描述
  des?: string;
  // 应用的链接
  link?: string;
  // 应用的点击数量
  count?: number;
  // 是否为推荐
  recommend?: boolean;
  // 应用的背景颜色
  background?: string;
  // 应用的封面图片
  cover?: string;
  // 应用的关键词
  keyword?: string;
  // 应用的排序号
  orderNum?: number;
  // 应用所属的模块
  module?: string;

  // 应用的创建时间
  createTime?: string;
  // 应用所属的分类列表
  categoryList?: SiteCategory[];
  /** 信号强度：1-5，1 最弱、5 最强 */
  signal?: number;
  /** 适用设备：PC / MOBILE / COMPATIBLE */
  device?: SiteDevice;
}

export interface SitePageParams {
  current?: number;
  size?: number;
  searchKey?: string;
  categoryId?: string;
  identityId?: string;
  keyword?: string;
  recommend?: boolean;
  module?: string;
  sortField?: string;
  sortOrder?: string;
  /** 按适用设备筛选：PC / MOBILE / COMPATIBLE */
  device?: SiteDevice;
}

/**
 * 首页聚合请求参数（`GET /public/site/homeAggregate`）。
 */
export interface SiteHomeAggregateParams {
  /** `latest` / `hottest` 各自返回的条数，默认 5，范围 1-50（超出按 50 处理） */
  size?: number;
  /**
   * 当前用户设备：`PC` / `MOBILE` / `COMPATIBLE`。
   *
   * 语义是**分组**而非精确匹配：
   * - `PC` 返回「仅 PC + 兼容」
   * - `MOBILE` 返回「仅移动端 + 兼容」
   * - 不传则不限制设备
   */
  device?: SiteDevice;
}

/**
 * 首页聚合返回结构（`BizSiteHomeAggregateVo`）。
 *
 * 一次请求带回头条区所需的全部数据，替代原先「推荐 / 最新 / 最热」
 * 三次独立分页调用（详情接口见 `/public/site/homeAggregate`）。
 */
export interface SiteHomeAggregate {
  /** 最新发布，按 createTime 倒序，同值时按 orderNum 升序 */
  latest: SiteItem[];
  /** 访问量最高，按 count 倒序，同值时按 createTime 倒序 */
  hottest: SiteItem[];
  /** 所有推荐站点，按 orderNum 升序、createTime 倒序 */
  recommends: SiteItem[];
}

const inFlight = new Map<string, Promise<unknown>>();

function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = factory().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export const siteApi = {
  getPage: (
    params: SitePageParams = {},
  ): Promise<PageResult<SiteItem>> =>
    dedupe(`site:page:${JSON.stringify(params)}`, () =>
      request.get<PageResult<SiteItem>>('/api/public/site/page', { params }),
    ),

  getCategoryTree: (module?: string): Promise<SiteCategory[]> =>
    dedupe(`site:categoryTree:${module ?? ''}`, () =>
      request.get<SiteCategory[]>('/api/public/site/categoryTree', {
        params: module ? { module } : {},
      }),
    ),

  /**
   * 首页聚合：一次拿到「最新 / 最热 / 推荐」三组站点。
   *
   * 取代首屏原本并发的三次 `page` 请求（各自还要带不同排序 / 推荐条件），
   * 减少请求数、也让三份榜单在同一时刻的快照上，不会互相错位。
   */
  getHomeAggregate: (
    params: SiteHomeAggregateParams = {},
  ): Promise<SiteHomeAggregate> =>
    dedupe(`site:homeAggregate:${JSON.stringify(params)}`, () =>
      request.get<SiteHomeAggregate>('/api/public/site/homeAggregate', {
        params,
      }),
    ),

  getIdentityList: (): Promise<SiteIdentity[]> =>
    dedupe('site:identityList', () =>
      request.get<SiteIdentity[]>('/api/public/site/identityList'),
    ),

  getIdentityCategoryTree: (identityId: string): Promise<SiteCategory[]> =>
    dedupe(`site:identityCategoryTree:${identityId}`, () =>
      request.get<SiteCategory[]>('/api/public/site/identityCategoryTree', {
        params: { identityId },
      }),
    ),

  getDetail: (id: string): Promise<SiteItem> =>
    request.get<SiteItem>('/api/public/site/detail', { params: { id } }),

  recordClick: (id: string): Promise<string> =>
    request.post<string>('/api/public/site/click', null, { params: { id } }),

  fetchMeta: (link: string): Promise<SiteItem> =>
    request.post<SiteItem>('/api/public/site/fetch', null, { params: { link } }),
};
