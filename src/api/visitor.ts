import { createRequest } from '../utils/request';

/**
 * C 端访客统计接口：
 * - 免鉴权（/public/** 已放行），走同源 /api 经 dev server proxy 转发到后端
 * - 看板数据读取 + 进入页面时上报访客信息
 */

/** localStorage 中持久化的访客标识 key（跨会话 UV 识别） */
const VISITOR_ID_KEY = 'VISITOR_ID';

/** 获取或生成持久化的访客标识（文档 4.1 建议） */
export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}
const visitorRequest = createRequest({
  getToken: () => null,
  onUnauthorized: () => {
    /* 静默，免登接口不会出现未授权 */
  },
  onError: () => {
    /* 静默，由调用方 catch 处理 */
  },
});

/** 看板概览字段（overview） */
export interface VisitorOverview {
  todayPv: number;
  todayUv: number;
  todayIp: number;
  yesterdayPv: number;
  yesterdayUv: number;
  yesterdayIp: number;
  weekPv: number;
  weekUv: number;
  weekIp: number;
  monthPv: number;
  monthUv: number;
  monthIp: number;
  onlineCount: number;
  [key: string]: unknown;
}

/** 看板完整返回（data 部分） */
export interface VisitorDashboard {
  overview: VisitorOverview;
  dailyTrend: unknown[];
  weeklyTrend: unknown[];
  monthlyTrend: unknown[];
  [key: string]: unknown;
}

/** 进入页面上报所需字段（与文档 4.1 params 对齐） */
export interface VisitorReportPayload {
  visitorId?: string;
  path?: string;
  referrer?: string;
  title?: string;
  userAgent?: string;
}

export const visitorApi = {
  /** 获取访客统计看板聚合数据（含今日/本周/本月 PV/UV/IP 与在线人数） */
  getDashboard: (): Promise<VisitorDashboard> =>
    visitorRequest.get<VisitorDashboard>('/api/public/visitor/dashboard'),

  /** 进入页面时上报访客信息（PV/UV/IP 统计） */
  report: (payload: VisitorReportPayload = {}): Promise<unknown> =>
    visitorRequest.post('/api/public/visitor/report', {
      visitorId: payload.visitorId ?? getVisitorId(),
      path: payload.path ?? window.location.pathname,
      referrer: payload.referrer ?? document.referrer,
      title: payload.title ?? document.title,
      userAgent: payload.userAgent ?? navigator.userAgent,
    }),
};

export default visitorApi;
