## 0. 对接总览

本服务为 B 端「用户上线」实时推送，采用 **SockJS + STOMP** 方案，端点 `/ws`。

> ⚠️ **SockJS 只能走 HTTP/HTTPS**：SockJS 客户端会强制把 `ws(s)://` 转回 `http(s)://` 再发起连接（HTML 中直接写 `http://localhost:82/ws`）。因此**不可用原生 WebSocket**，必须用 SockJS 包装，否则连接失败。

- **端点**：`/ws`（相对当前域，由 SockJS 处理协议转换）
- **依赖**：`sockjs-client@1.6.1` + `stompjs@2.3.3`（与 `md/socket-test.html` 的 CDN 版本一一对应）
- **鉴权**：连接时通过 query 参数 `?token=<accessToken>` 携带（已登录用户）
- **心跳**：STOMP `incoming = outgoing = 10000`（10s）
- **重连**：断线后每 `5000`ms 自动重连
- **订阅目的地**：`/user/online/broadcast`（上线广播）、`/user/welcome/queue`（欢迎消息）

## 1. 连接

### 1.1 SockJS（强制 HTTP）

```js
const socket = new SockJS("/ws?token=xxx"); // 或绝对地址 http://localhost:82/ws
const client = Stomp.over(socket);
client.heartbeat = { incoming: 10000, outgoing: 10000 };
client.connect({}, onSuccess, onError);
```

- SockJS 自动协商传输（xhr-streaming / xhr-polling / iframe 等），天然只走 HTTP。
- 若想验证连通性，直接打开 `md/socket-test.html`（已填好 `http://localhost:82/ws`）即可，无需登录也能看到连接状态。

### 1.2 鉴权（token 可选）

- 已登录用户：读取 `accessToken`，作为 `?token=...` 附加在 SockJS 地址上。
- 游客：不传 token，服务端按匿名身份接入（以前端 `getStoredToken()` 是否返回非空为准）。
- token 在「建立 SockJS 连接时」一次性携带，重连时重新拼接（自动沿用当前 token）。

### 1.3 心跳与重连

| 项 | 值 | 说明 |
| --- | --- | --- |
| `client.heartbeat.incoming` | `10000` | 期望收服务端心跳 |
| `client.heartbeat.outgoing` | `10000` | 向服务端发心跳 |
| 重连间隔 | `5000` | `onError`/`onclose` 后启动，`setTimeout` 重连 |

## 2. 订阅与消息结构

### 2.1 订阅目的地

```js
client.subscribe("/user/online/broadcast", (frame) => handle(frame)); // 用户上线
client.subscribe("/user/welcome/queue", (frame) => handle(frame));    // 欢迎消息
```

### 2.2 统一消息结构

服务端推送均为如下 JSON（`socket-test.html` 中的 `frame.body`）：

```json
{
  "module": "USER",
  "type": "ONLINE",
  "data": {
    "userId": "1",
    "userName": "管理员",
    "account": "admin",
    "onlineTime": 1754000000000
  }
}
```

| 字段 | 含义 |
| --- | --- |
| `module` | 业务模块，如 `USER` |
| `type` | 事件类型，如 `ONLINE` |
| `data` | 业务负载，结构随 `module`/`type` 变化 |

前端解析规则：非合法 JSON、或 `type` 缺失 → 忽略；`module === 'USER' && type === 'ONLINE'` → 触发上线提示。

### 2.3 USER_ONLINE（用户上线）

`data` 结构（`WsUserOnlineData`）：

| 字段 | 含义 |
| --- | --- |
| `userId` | 用户唯一标识 |
| `userName` | 用户名称/昵称 |
| `account` | 用户登录账号 |
| `onlineTime` | 上线时间戳（毫秒，可选） |

前端处理：取 `userName || account || userId || '一位用户'` 作为展示名，触发桌宠气泡事件 `pet-show-bubble`（文本「`{名称} 上线了，打个招呼吧~`」）。无需前端过滤「自己」，由服务端保证广播语义。

## 3. 前端接入（参照 socket-test.html）

- **核心模块**：`src/api/websocket.ts`（SockJS + STOMP 连接、心跳、重连、订阅单例 `bwsClient`）
- **业务订阅**：`src/hooks/useBwsConnection.ts`（挂载时 `connect()`，监听 `USER/ONLINE`，卸载时 `disconnect()`）

### 3.1 接入步骤

1. 在入口组件挂载 `useBwsConnection()`（已实现，监听上线事件并驱动桌宠气泡）。
2. 如需新增事件类型：在 `useBwsConnection.ts` 的 `onMessage` 回调中按 `module`/`type` 增加分发分支，必要时在 `src/api/websocket.ts` 补充类型。
3. 测试连通性：用浏览器打开 `md/socket-test.html`，填入后端地址（如 `http://localhost:82/ws`），查看底部「状态」是否为 online。

## 4. 本地验证（socket-test.html）

`md/socket-test.html` 是单文件验证页，与前端使用**完全相同**的对接方式：

- 端点 `WS_ENDPOINT = "http://localhost:82/ws"`（可改）
- `sockjs-client@1.6.1` + `stompjs@2.3.3`（CDN UMD）
- 心跳 `10000`，自动重连 `5000`
- 订阅 `/user/online/broadcast`、`/user/welcome/queue`
- 收到消息后渲染卡片并发送浏览器通知

> 前端代码（`src/api/websocket.ts`）即把该 HTML 的逻辑移植为 ES Module 版本，行为一致，请以后端提供的 `/ws`（SockJS）端点为准。
