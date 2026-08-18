import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { getStoredToken } from './auth';

type Client = Stomp.Client;
type IMessage = Stomp.Message;

// 后端 WebSocket 端点（SockJS 强制走 HTTP/HTTPS，由 SockJS 内部自动完成 ws/wss 转换）
const WS_ENDPOINT = '/ws';
// 人数卡片订阅目的地（免登录，进入页面即有数据）
const DEST_MEMBER_COUNT = '/user/membercount/queue';
// 心跳间隔（与服务端保持一致，HTML 中为 10000ms）
const HEARTBEAT = 10000;
// 断线重连间隔（HTML 中为 5000ms）
const RECONNECT_INTERVAL = 5000;

// 服务端推送消息结构（参照 socket-test.html：{ module, type, data }）
export interface WsMessage {
  module?: string;
  type: string;
  data?: unknown;
  [key: string]: unknown;
}

export type WsMessageHandler = (msg: WsMessage) => void;

// 人数卡片 data 结构（module = 'membercount'，当前在线/今日/当月）
export interface MemberCountData {
  currentCount: number;
  todayCount: number;
  monthCount: number;
  [key: string]: unknown;
}

class BwsClient {
  private client: Client | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private manualClose = false;
  private handlers = new Set<WsMessageHandler>();

  // 走同源相对路径 /ws，由 dev server 的 proxy 转发到后端（见 vite.config.ts），不暴露真实后端地址
  private resolveUrl(): string {
    return `${WS_ENDPOINT}`;
  }

  // 构造带鉴权 token 的连接地址（仅在已登录时携带）
  private buildWsUrl(): string {
    const token = getStoredToken();
    const base = this.resolveUrl();
    if (token) {
      const sep = base.includes('?') ? '&' : '?';
      return `${base}${sep}token=${encodeURIComponent(token)}`;
    }
    return base;
  }

  connect() {
    if (this.connected || this.retryTimer) return;
    this.manualClose = false;

    const socket = new SockJS(this.buildWsUrl());
    const client = Stomp.over(socket);
    client.heartbeat = { incoming: HEARTBEAT, outgoing: HEARTBEAT };
    // 关闭 STOMP 自带的调试日志，避免控制台刷屏
    (client as unknown as { debug: (msg: string) => void }).debug = () => {};

    client.connect(
      {},
      () => {
        this.connected = true;
        this.retryTimer = null;
        // 连接成功后订阅人数卡片（免登录）。重连成功后此处会再次订阅并收到 snapshot。
        client.subscribe(DEST_MEMBER_COUNT, (frame: IMessage) => this.dispatch(frame));
      },
      (error: string | unknown) => {
        this.connected = false;
        this.scheduleReconnect();
        void error;
      },
    );

    this.client = client;
  }

  private scheduleReconnect() {
    if (this.manualClose || this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  private dispatch(frame: IMessage) {
    let msg: WsMessage | null = null;
    try {
      msg = JSON.parse(frame.body) as WsMessage;
    } catch {
      msg = null;
    }
    if (!msg || typeof msg.type !== 'string') return;
    this.handlers.forEach((h) => h(msg));
  }

  onMessage(handler: WsMessageHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect() {
    this.manualClose = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.client) {
      try {
        this.client.disconnect(() => {});
      } catch {
        /* noop */
      }
      this.client = null;
    }
    this.connected = false;
  }
}

export const bwsClient = new BwsClient();

// ===== 在线人数专用：原生 WebSocket /ws/ws-online（免登录，非 STOMP）=====
// 参照 md/SOCKET用户上线对接文档.md：连接即 +1、断开即 -1，服务端实时推送
// 消息格式：{ "data": { "total": N } }（后端实际不含 code 字段）

const ONLINE_WS_PATH = '/ws/ws-online';
const ONLINE_RECONNECT_INTERVAL = 5000;
// 心跳间隔：参照对接文档「推荐客户端心跳间隔 30 秒」，留出余量避免网络抖动误判（服务端 90s 超时）
const ONLINE_HEARTBEAT_INTERVAL = 30_000;

/** 在线人数推送消息结构（与对接文档一致） */
export interface OnlineCountMessage {
  code?: number;
  data?: {
    total?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type OnlineCountHandler = (total: number) => void;

class OnlineCountClient {
  private ws: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private manualClose = false;
  private handlers = new Set<OnlineCountHandler>();
  private _connected = false;

  get connected(): boolean {
    return this._connected;
  }

  /** 同源相对路径 /ws/ws-online，由 dev server proxy 转发到后端（见 vite.config.ts） */
  private resolveUrl(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}${ONLINE_WS_PATH}`;
  }

  connect() {
    if (this._connected || this.retryTimer || this.manualClose) return;

    const url = this.resolveUrl();
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this._connected = true;
      this.retryTimer = null;
      // 连接成功即计入在线人数，立即启动心跳定时器（每 30s 上行 'ping' 维持在线）
      this.startHeartbeat();
    };

    ws.onmessage = (evt: MessageEvent) => {
      let msg: OnlineCountMessage | null = null;
      try {
        msg = JSON.parse(evt.data as string) as OnlineCountMessage;
      } catch {
        msg = null;
      }
      // 后端实际推送 {"data":{"total":N}}（见对接文档，无 code 字段），只要 data.total 为数字即渲染
      if (msg && msg.data && typeof msg.data.total === 'number') {
        const total = msg.data.total;
        this.handlers.forEach((h) => h(total));
      }
    };

    ws.onclose = () => {
      this._connected = false;
      this.ws = null;
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    ws.onerror = () => {
      // 错误后浏览器会触发 onclose，由 onclose 负责重连
      this._connected = false;
    };
  }

  /** 启动心跳：定时上行任意文本（'ping'）以维持在线状态，断开连接后由 onclose 停止 */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('ping');
        } catch {
          /* 发送失败等待 onclose 重连 */
        }
      }
    }, ONLINE_HEARTBEAT_INTERVAL);
  }

  /** 停止心跳定时器 */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.manualClose || this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, ONLINE_RECONNECT_INTERVAL);
  }

  onCount(handler: OnlineCountHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect() {
    this.manualClose = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* noop */
      }
      this.ws = null;
    }
    this._connected = false;
  }
}

export const onlineCountClient = new OnlineCountClient();

// 页面卸载时主动关闭连接，加速下线（对接文档要点 6；服务端仍会超时兜底清理）
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    onlineCountClient.disconnect();
  });
}
