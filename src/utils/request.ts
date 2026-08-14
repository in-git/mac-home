/**
 * 基于 axios 的 API 请求封装
 * 严格遵循「后端响应规范」：
 * - 统一响应结构：{ code, msg, data, traceId }
 * - 状态码处理：200 成功；非 200 提示 msg；401/1011007/1011008 未授权（静默，不跳转）
 * - 分页参数与返回结构封装
 *
 * 依赖：axios（需在 package.json 中安装）
 */
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

/** 统一响应体结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data?: T;
  traceId: string;
}

/** 分页请求参数 */
export interface PageParams {
  current?: number;
  size?: number;
}

/** 分页返回数据结构（位于 data 内） */
export interface PageResult<T = unknown> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** 业务错误（非 200） */
export class ApiError extends Error {
  code: number;
  traceId: string;
  constructor(code: number, msg: string, traceId: string) {
    super(msg);
    this.name = 'ApiError';
    this.code = code;
    this.traceId = traceId;
  }
}

/** 需要重新登录的状态码 */
const UNAUTHORIZED_CODES = [401, 1011007, 1011008];

/**
 * 后端接口路径集中管理（仅 path，baseURL 由 request 统一拼接）。
 * 新增业务接口请在此登记，组件层不要自己拼地址。
 */
export const API_ENDPOINTS = {
  aiChat: '/api/public/ai/chat',
} as const;

/** 可自定义配置 */
export interface RequestConfig {
  baseURL?: string;
  /** token 获取函数，默认读取 localStorage 的 token */
  getToken?: () => string | null;
  /** 未登录时的跳转处理，默认跳转 /login */
  onUnauthorized?: (code: number) => void;
  /** 全局错误提示，默认 console.error */
  onError?: (error: ApiError) => void;
}

/**
 * 默认 token 存储 key。
 * C 端约定见登录对接文档：浏览器 localStorage 的 `CLIENT_TOKEN`，
 * 请求头名为 `token`（不带 Bearer 前缀）。
 */
const TOKEN_KEY = 'CLIENT_TOKEN';

function createRequest(options: RequestConfig = {}) {
  const {
    // baseURL 仅含后端根地址（不含 /api 前缀），接口 path 由 API_ENDPOINTS 提供；
    // 未配置环境变量时回退空串，即走同源相对路径。
    baseURL = import.meta.env.VITE_API_BASE_URL ?? '',
    getToken = () => localStorage.getItem(TOKEN_KEY),
    onUnauthorized = (code) => {
      // 本项目无登录页路由，整页跳转 /login 会造成重定向死循环；
      // 改为仅警告，由调用方自行处理未授权（如 auth.ts 已静默）。
      console.warn(`[request] 未授权 (${code})，已静默处理（无登录页可跳转）`);
    },
    onError = (error) =>
      console.error(`[request] ${error.code}: ${error.message}`, error.traceId),
  } = options;

  const instance: AxiosInstance = axios.create({
    baseURL,
    timeout: 0,
    headers: { 'Content-Type': 'application/json' },
  });

  // 请求拦截：注入 token（C 端约定 header 名为 `token`，不带 Bearer 前缀）
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.set('token', token);
    }
    return config;
  });

  // 响应拦截：统一解包与状态码处理
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const body = response.data;

      // 非标准结构（如非业务接口直接返回数据）原样透传
      if (body == null || typeof body.code !== 'number') {
        return response;
      }

      if (body.code === 200) {
        // 成功：将 data 作为响应主体返回，调用方直接拿 data
        return body.data as never;
      }

      // 未授权 → 跳转登录
      if (UNAUTHORIZED_CODES.includes(body.code)) {
        onUnauthorized(body.code);
      }

      const err = new ApiError(body.code, body.msg, body.traceId);
      onError(err);
      return Promise.reject(err);
    },
    (error) => {
      // HTTP 层错误（网络/超时/5xx 等非业务响应）
      const status = error?.response?.status;
      const body = error?.response?.data as ApiResponse | undefined;
      const code = body?.code ?? status ?? -1;
      const msg = body?.msg ?? error?.message ?? '网络请求失败';
      const traceId = body?.traceId ?? '';

      if (status && UNAUTHORIZED_CODES.includes(status)) {
        onUnauthorized(status);
      }

      const err = new ApiError(code, msg, traceId);
      onError(err);
      return Promise.reject(err);
    },
  );

  /** 通用请求方法，返回 data */
  function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    // 响应拦截器已将 body.data 解包，此处断言为 T
    return instance.request<unknown, T>(config) as Promise<T>;
  }

  return {
    instance,
    get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
      request<T>({ ...config, url, method: 'GET' }),
    post: <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ) => request<T>({ ...config, url, method: 'POST', data }),
    put: <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ) => request<T>({ ...config, url, method: 'PUT', data }),
    delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
      request<T>({ ...config, url, method: 'DELETE' }),
    /** 分页请求：自动合并分页参数，返回完整分页结构 */
    getPage: <T = unknown>(
      url: string,
      params: PageParams = {},
      config?: AxiosRequestConfig,
    ): Promise<PageResult<T>> => {
      const merged: PageParams = {
        current: params.current ?? 1,
        size: params.size ?? 20,
        ...params,
      };
      return request<PageResult<T>>({
        ...config,
        url,
        method: 'GET',
        params: { ...config?.params, ...merged },
      });
    },
    postPage: <T = unknown>(
      url: string,
      data: unknown = {},
      params: PageParams = {},
      config?: AxiosRequestConfig,
    ): Promise<PageResult<T>> => {
      const merged: PageParams = {
        current: params.current ?? 1,
        size: params.size ?? 20,
        ...params,
      };
      return request<PageResult<T>>({
        ...config,
        url,
        method: 'POST',
        data,
        params: { ...config?.params, ...merged },
      });
    },
  };
}

export const request = createRequest();
export default request;
export { createRequest };
