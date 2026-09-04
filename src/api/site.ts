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
  /** 是否显示在系统应用中：网页应用（web-app）为 false，其余为 true。 */
  showInSystem?: boolean;
  // 应用的创建时间
  createTime?: string;
  // 应用所属的分类列表
  categoryList?: SiteCategory[];
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
