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
  /** 时长（秒）。后端当前未返回，前端按需兜底 */
  duration?: number;
  /** 作者 / UP 主名称。后端当前未返回，回退到 createUser */
  author?: string;
  /** 弹幕数（角标展示用） */
  danmakuCount?: number;
  /** 状态：ENABLE / DISABLE */
  status?: string;
  /** 排序码 */
  sortCode?: number;
  /** 备注 */
  remark?: string;
  /** 扩展信息（JSON 字符串，可能内含 author / duration） */
  extJson?: string;
  createTime?: string;
  updateTime?: string;
  /** 创建人 ID（后端当前以此为作者标识） */
  createUser?: string;
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

/** 解析 extJson（后端扩展字段，可能是 JSON 字符串或已是对象） */
function parseExt(item: VideoItem): Record<string, unknown> {
  const raw = item.extJson;
  if (!raw) return {};
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** 秒 → `mm:ss` / `h:mm:ss`；无有效时长返回空串（不渲染角标） */
export function formatDuration(seconds?: number): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 播放量 / 弹幕数：B 站式紧凑写法（1.2万 / 3.4亿） */
export function formatCount(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '';
  }
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return String(Math.floor(value));
}

/** 发布时间：3 天内显示「N 天前 / 今天」，更早显示 YYYY-MM-DD */
export function formatDate(createTime?: string): string {
  if (!createTime) return '';
  const normalized = createTime.trim().replace(' ', 'T');
  const time = Date.parse(
    /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : normalized,
  );
  if (Number.isNaN(time)) return createTime.slice(0, 10);

  const diff = Date.now() - time;
  const day = 24 * 60 * 60 * 1000;
  if (diff >= 0 && diff < day) return '今天';
  if (diff >= day && diff < 2 * day) return '昨天';
  if (diff >= 2 * day && diff < 30 * day) return `${Math.floor(diff / day)} 天前`;
  return createTime.slice(0, 10);
}

/** 卡片展示所需的派生字段（后端缺失时从 extJson / createUser 兜底） */
export function videoMetaOf(item: VideoItem) {
  const ext = parseExt(item);
  const duration =
    item.duration ??
    (typeof ext.duration === 'number' ? (ext.duration as number) : undefined);
  const author =
    item.author ??
    (typeof ext.author === 'string' ? (ext.author as string) : undefined);

  return {
    /** 格式化时长，空串表示不展示 */
    duration: formatDuration(duration),
    /** 作者名；后端未提供时显示占位（不暴露内部用户 ID） */
    author: author || '未知作者',
    /** 紧凑播放量 */
    playCount: formatCount(item.count),
    /** 紧凑弹幕数 */
    danmakuCount: formatCount(item.danmakuCount),
    /** 发布时间 */
    date: formatDate(item.createTime),
  };
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
