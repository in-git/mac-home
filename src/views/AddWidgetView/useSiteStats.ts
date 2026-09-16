import { useEffect, useState } from 'react';
import { siteApi } from '@/api/site';
import { videoApi } from '@/api/video';
import { visitorApi } from '@/api/visitor';
import { onlineCountClient } from '@/api/websocket';

export interface SiteStats {
  /** 在线人数：WebSocket 实时推送；未连通时为 null（降级为 HTTP 轮询值） */
  online: number | null;
  /** 网页（站点）总数 */
  siteTotal: number;
  /** 视频总数 */
  videoTotal: number;
}

/**
 * WS 首帧超时：超时未收到推送则认为通道不可用，降级为轮询
 */
const WS_FIRST_MESSAGE_TIMEOUT = 10_000;
/** 降级后的 HTTP 轮询间隔 */
const FALLBACK_POLL_MS = 60_000;

/**
 * 站点统计：在线人数走 WebSocket 实时推送（/ws/ws-online），
 * 网页总数 / 视频总数走 HTTP 接口（非实时，取一次即可）。
 *
 * 计数类接口都用 `size: 1` 只取 `total`，避免为了拿总数而拉回整页数据。
 *
 * 降级策略：WS 未连通或超时未收到首帧时，回退为轮询 /api/public/visitor/dashboard
 * 拿 onlineCount；WS 恢复后自动切回实时值。
 */
export function useSiteStats(): { stats: SiteStats | null; wsLive: boolean } {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [wsLive, setWsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | undefined;
    let firstMsgTimer: number | undefined;

    /** 拉取非实时数据（网页总数 / 视频总数），并视情况回填在线人数 */
    const fetchBase = (fillOnline: boolean) => {
      Promise.all([
        visitorApi.getDashboard(),
        // size=1：仅为了拿 total，避免拉取整页数据
        siteApi.getPage({ current: 1, size: 1 }),
        videoApi.getPage({ current: 1, size: 1 }),
      ])
        .then(([dashboard, sitePage, videoPage]) => {
          if (cancelled) return;
          const overview = dashboard?.overview;
          setStats((prev) => ({
            online:
              fillOnline || prev === null
                ? Number(overview?.onlineCount ?? 0)
                : prev.online,
            siteTotal: Number(sitePage?.total ?? 0),
            videoTotal: Number(videoPage?.total ?? 0),
          }));
        })
        .catch(() => {
          /* 统计属增强信息，失败时静默 */
        });
    };

    // 1) 首屏：先拿一次 HTTP 数据，保证统计区立刻有值
    fetchBase(true);

    // 2) 订阅 WebSocket 在线人数
    const release = onlineCountClient.acquire();
    const off = onlineCountClient.onCount((total: number) => {
      if (cancelled) return;
      if (firstMsgTimer !== undefined) {
        window.clearTimeout(firstMsgTimer);
        firstMsgTimer = undefined;
      }
      setWsLive(true);
      setStats((prev) =>
        prev === null
          ? { online: total, siteTotal: 0, videoTotal: 0 }
          : { ...prev, online: total },
      );
    });

    // 3) 降级：超时未收到首帧则轮询；页面隐藏时不轮询
    firstMsgTimer = window.setTimeout(() => {
      setWsLive((live) => {
        if (!live) startFallbackPoll();
        return live;
      });
    }, WS_FIRST_MESSAGE_TIMEOUT);

    const startFallbackPoll = () => {
      if (pollTimer !== undefined) return;
      const tick = () => {
        if (!cancelled && !document.hidden) fetchBase(true);
        if (!cancelled) pollTimer = window.setTimeout(tick, FALLBACK_POLL_MS);
      };
      pollTimer = window.setTimeout(tick, FALLBACK_POLL_MS);
    };

    return () => {
      cancelled = true;
      if (pollTimer !== undefined) window.clearTimeout(pollTimer);
      if (firstMsgTimer !== undefined) window.clearTimeout(firstMsgTimer);
      off();
      release();
      setWsLive(false);
    };
  }, []);

  return { stats, wsLive };
}
