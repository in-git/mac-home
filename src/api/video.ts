import {
  API_ENDPOINTS,
  getApiBaseUrl,
  PageResult,
  request,
} from '../utils/request';

/**
 * C 端视频（只读、免登录公开读）。
 * 后端路径 `/public/video/**`，已加入 NO_LOGIN_PATH_ARR 放行，无需 token。
 * 见「C端视频读取对接文档」。
 */
export interface VideoItem {
  /** 视频主键 */
  id: string;
  /** 视频名称 */
  title: string;
  /** 视频地址（相对路径，需 withBase 拼接后使用） */
  url: string;
  /** 封面地址（相对路径，需 withBase 拼接后使用） */
  cover?: string;
  /** 描述 */
  description?: string;
  /** 浏览量 */
  count?: number;
  /** 状态：ENABLE / DISABLE */
  status?: string;
  /** 排序码 */
  sortCode?: number;
  /** 备注 */
  remark?: string;
  /** 扩展信息（JSON 字符串） */
  extJson?: string;
  createTime?: string;
  updateTime?: string;
}

export interface VideoPageParams {
  current?: number;
  size?: number;
  /** 排序字段（驼峰），如 createTime、count */
  sortField?: string;
  /**
   * 排序方式：**小写** `ascend` 升序 / `descend` 降序。
   * 后端严格校验，其它写法（DESC / DESCEND / ASCEND）会返回 500。
   */
  sortOrder?: string;
  /** 关键词，模糊匹配视频名称等 */
  searchKey?: string;
  /** 按视频名字过滤 */
  title?: string;
}

/**
 * 相对路径 → 可访问的完整地址（对接文档 §5.1）。
 *
 * 实测后端当前返回的 `url` / `cover` 已是完整地址
 * （如 `https://www.mx2d.cn/2026/9/16/xxx.mp4`），此时原样返回；
 * 若后端改为返回 `/dev/file/download?id=...` 这类相对路径，
 * 则拼接 API base 后使用。
 */
export function withBase(value?: string): string {
  if (!value) return '';
  return value.startsWith('/') ? `${getApiBaseUrl()}${value}` : value;
}

const inFlight = new Map<string, Promise<unknown>>();

/** 同一参数的并发请求合并，避免严格模式下重复打接口 */
function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = factory().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export const videoApi = {
  /** 视频分页列表（免登录公开读） */
  getPage: (params: VideoPageParams = {}): Promise<PageResult<VideoItem>> =>
    dedupe(`video:page:${JSON.stringify(params)}`, () =>
      request.get<PageResult<VideoItem>>(API_ENDPOINTS.videoPage, { params }),
    ),

  /** 视频详情（免登录公开读） */
  getDetail: (id: string): Promise<VideoItem> =>
    dedupe(`video:detail:${id}`, () =>
      request.get<VideoItem>(API_ENDPOINTS.videoDetail, { params: { id } }),
    ),
};
