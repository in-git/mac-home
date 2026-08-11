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
  id: string;
  name: string;
  logo?: string;
  des?: string;
  link: string;
  count?: number;
  visible?: boolean;
  recommend?: boolean;
  background?: string;
  cover?: string;
  keyword?: string;
  orderNum?: number;
  screenshot?: string;
  module?: string;
  createTime?: string;
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
      request.get<PageResult<SiteItem>>('/public/site/page', { params }),
    ),

  getCategoryTree: (module?: string): Promise<SiteCategory[]> =>
    dedupe(`site:categoryTree:${module ?? ''}`, () =>
      request.get<SiteCategory[]>('/public/site/categoryTree', {
        params: module ? { module } : {},
      }),
    ),

  getIdentityList: (): Promise<SiteIdentity[]> =>
    dedupe('site:identityList', () =>
      request.get<SiteIdentity[]>('/public/site/identityList'),
    ),

  getIdentityCategoryTree: (identityId: string): Promise<SiteCategory[]> =>
    dedupe(`site:identityCategoryTree:${identityId}`, () =>
      request.get<SiteCategory[]>('/public/site/identityCategoryTree', {
        params: { identityId },
      }),
    ),

  getDetail: (id: string): Promise<SiteItem> =>
    request.get<SiteItem>('/public/site/detail', { params: { id } }),

  recordClick: (id: string): Promise<string> =>
    request.post<string>('/public/site/click', null, { params: { id } }),

  fetchMeta: (link: string): Promise<SiteItem> =>
    request.post<SiteItem>('/public/site/fetch', null, { params: { link } }),
};
