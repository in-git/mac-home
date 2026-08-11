import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { getStoredToken } from './auth';

type Client = Stomp.Client;
type IMessage = Stomp.Message;

// 后端 WebSocket 端点（SockJS 强制走 HTTP/HTTPS，由 SockJS 内部自动完成 ws/wss 转换）
const WS_ENDPOINT = '/ws';
// 订阅目的地
const DEST_ONLINE = '/user/online/broadcast';
const DEST_WELCOME = '/user/welcome/queue';
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

// 用户上线事件 data 结构（module = 'USER'，type = 'ONLINE'）
export interface WsUserOnlineData {
  userId?: string | number;
  userName?: string;
  account?: string;
  onlineTime?: number;
  [key: string]: unknown;
}

class BwsClient {
  private client: Client | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private manualClose = false;
  private handlers = new Set<WsMessageHandler>();

  // 解析基础地址：基于 VITE_API_BASE_URL 拼接 /ws，SockJS 自动处理 http/https 协议
  private resolveUrl(): string {
    const base = import.meta.env.VITE_API_BASE_URL ?? '';
    const baseNoProto = base.replace(/\/$/, '');
    return `${baseNoProto}${WS_ENDPOINT}`;
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
        // 连接成功后订阅用户上线与欢迎消息
        client.subscribe(DEST_ONLINE, (frame: IMessage) => this.dispatch(frame));
        client.subscribe(DEST_WELCOME, (frame: IMessage) => this.dispatch(frame));
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
