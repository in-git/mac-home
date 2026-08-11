/**
 * B 端 WebSocket 对接服务
 *
 * 对接文档：md/B端WebSocket对接文档.md
 * 端点：/bws（基于 VITE_API_BASE_URL）
 * 鉴权：连接时携带 ?token=<登录返回的 accessToken>
 * 心跳：客户端每 25s 发送 {"type":"ping"}，服务端回 {"type":"pong"}
 * 重连：断线后指数退避自动重连，上限约 30s
 *
 * 由于本地后端为 http，统一将 baseURL 的 http(s) 协议转换为 ws(s)，
 * 避免「混合内容」(mixed content) 被浏览器拦截。
 */

import { getStoredToken } from './auth';

/** 服务端推送消息的通用结构 */
export interface WSMessage {
  /** 业务类型，详见对接文档 */
  type: string;
  /** 业务负载，具体字段随 type 变化 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  /** 时间戳（毫秒） */
  timestamp?: number;
}

/** 用户上下线类事件携带的 data 结构 */
export interface WsUserOnlineData {
  /** 用户唯一标识 */
  userId?: string;
  /** 用户名称/昵称 */
  userName?: string;
  /** 用户登录账号 */
  account?: string;
  /** 上线时间戳（毫秒），未提供时由客户端补全 */
  onlineTime?: number;
}

type MessageHandler = (msg: WSMessage) => void;
type StatusHandler = (status: WsStatus) => void;

export type WsStatus = 'connecting' | 'open' | 'closed' | 'reconnecting';

const HEARTBEAT_INTERVAL = 25_000;
const RECONNECT_BASE = 1_000;
const RECONNECT_MAX = 30_000;

class BwsClient {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = RECONNECT_BASE;
  private manualClose = false;
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();

  get status(): WsStatus {
    if (!this.ws) return this.manualClose ? 'closed' : 'connecting';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return this.manualClose ? 'closed' : 'reconnecting';
      default:
        return 'connecting';
    }
  }

  /** 根据 VITE_API_BASE_URL 计算 /bws WebSocket 地址 */
  private resolveUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const token = getStoredToken();
    const wsProtocol = base.startsWith('https') ? 'wss' : 'ws';
    const baseNoProto = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const prefix = baseNoProto ? `${wsProtocol}://${baseNoProto}` : `${wsProtocol}://${location.host}`;
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${prefix}/bws${query}`;
  }

  /** 建立连接（带重连语义：非手动关闭断线会自动重连） */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.manualClose = false;
    this.url = this.resolveUrl();
    this.emitStatus('connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.url);
      console.log('连接成功');
      
    } catch (e) {
      console.warn('[BWS] 创建连接失败，准备重连', e);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = RECONNECT_BASE;
      this.emitStatus('open');
      this.startHeartbeat();
    };

    ws.onmessage = (ev) => {
      let msg: WSMessage | null = null;
      try {
        msg = typeof ev.data === 'string' ? JSON.parse(ev.data) : null;
      } catch {
        msg = null;
      }
      if (!msg || typeof msg !== 'object' || !msg.type) return;

      // 心跳回应，无需向上抛出
      if (msg.type === 'pong') return;

      this.messageHandlers.forEach((h) => h(msg as WSMessage));
    };

    ws.onclose = () => {
      this.stopHeartbeat();
      this.emitStatus(this.manualClose ? 'closed' : 'reconnecting');
      if (!this.manualClose) this.scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose 会随后触发，统一在 onclose 处理重连
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  }

  /** 手动关闭并停止重连（如用户登出） */
  disconnect(): void {
    this.manualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* noop */
      }
      this.ws = null;
    }
    this.emitStatus('closed');
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /** 订阅消息，返回取消订阅函数 */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /** 订阅连接状态变化，返回取消订阅函数 */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private emitStatus(status: WsStatus): void {
    this.statusHandlers.forEach((h) => h(status));
  }
}

/** 全局单例 */
export const bwsClient = new BwsClient();
