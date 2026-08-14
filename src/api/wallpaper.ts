import { PageResult, request } from '../utils/request';

/** 壁纸项 */
export interface WallpaperItem {
  id: string;
  title: string;
  categoryTag?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  fileSizeKb?: number;
  resolution?: string;
  aspectRatio?: string;
  fileSize?: string;
  downloadsCount?: number;
  likesCount?: number;
}

/** 分类字典项 */
export interface WallpaperCategory {
  value: string;
  label: string;
  sortCode: number;
}

/** 查询壁纸库分页参数 */
export interface WallpaperPageParams {
  current?: number;
  size?: number;
  categoryTag?: string;
  title?: string;
}

/** 进行中请求去重：同一 key 的请求未返回前复用同一个 Promise */
const inFlight = new Map<string, Promise<unknown>>();

function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = factory().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export const wallpaperApi = {
  /** 免登录壁纸库分页查询 */
  getPage: (
    params: WallpaperPageParams = {},
  ): Promise<PageResult<WallpaperItem>> =>
    dedupe(`page:${JSON.stringify(params)}`, () =>
      request.get<PageResult<WallpaperItem>>('/api/public/wallpaper/page', {
        params,
      }),
    ),

  /** 免登录获取壁纸分类列表 */
  getCategoryList: (): Promise<WallpaperCategory[]> =>
    dedupe('categoryList', () =>
      request.get<WallpaperCategory[]>('/api/public/wallpaper/categoryList'),
    ),

  /** 免登录更新壁纸下载计数（每次点击都应上报，不去重） */
  recordDownload: (id: string): Promise<string> =>
    request.get<string>('/api/public/wallpaper/download', { params: { id } }),
};
