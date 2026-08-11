## 0. 对接总览

本服务为 B 端"用户上线"实时推送，采用**原生 WebSocket**（非 SockJS / STOMP）方案。

- **端点**：`/bws`，地址由前端 `VITE_API_BASE_URL` 推导。
- **鉴权**：连接时通过 query 参数 `token` 携带登录返回的 `accessToken`（仅登录用户携带，游客不传）。
- **心跳**：客户端每 25s 发送 `{"type":"ping"}`，服务端回 `{"type":"pong"}`。
- **重连**：断线后指数退避自动重连，间隔从 1s 翻倍至上限 30s。
- **前端实现**：`src/api/websocket.ts`（连接/心跳/重连单例）+ `src/hooks/useBwsConnection.ts`（业务订阅）。

> ⚠️ 与早期方案（SockJS + STOMP over `/ws`）不同，当前代码已改为原生 WebSocket over `/bws`，请勿混用。

## 1. 连接

### 1.1 端点与协议推导

前端根据 `VITE_API_BASE_URL` 推导 WebSocket 地址（`src/api/websocket.ts :: resolveUrl`）：

- 取 `VITE_API_BASE_URL`（如 `http://localhost:8080` 或 `https://api.example.com`）。
- 协议转换（避免混合内容被浏览器拦截）：
  - `https` → `wss`
  - `http`  → `ws`
- 拼接路径 `/bws` 与可选 query `?token=...`。

推导结果示例：

| VITE_API_BASE_URL | 解析后地址 |
| --- | --- |
| `http://localhost:8080` | `ws://localhost:8080/bws` |
| `http://localhost:8080` + 已登录 | `ws://localhost:8080/bws?token=<accessToken>` |
| `https://api.example.com` | `wss://api.example.com/bws?token=<accessToken>` |

若 `VITE_API_BASE_URL` 为空，则回退为 `ws(s)://<当前页面 host>/bws`。

### 1.2 鉴权（token 是可选身份凭证）

- 已登录用户：从 `getStoredToken()` 读取登录 `accessToken`，作为 `?token=...` 传入。
- 游客：不传 token，服务端按匿名身份接入（若无游客方案则拒绝/降级处理，以前端实际鉴权为准）。
- token 在「创建连接时」一次性携带，后续心跳与推送均不再附加。

### 1.3 连接时序

- 进入界面（挂载 `useBwsConnection`）即调用 `bwsClient.connect()` 建立连接。
- 仅当 `ws.readyState` 为 OPEN 时才处理心跳与消息；`onopen` 后启动 25s 心跳。
- 组件卸载（`useEffect` 清理）时调用 `bwsClient.disconnect()`，停止重连并关闭连接——因此连接生命周期与挂载它的组件一致。

### 1.4 心跳配置

- 客户端每 **25_000 ms** 发送一次：`{"type":"ping"}`。
- 服务端应回 `{"type":"pong"}`；前端收到 `pong` 后**不向上层抛出**（直接忽略）。
- 心跳在 `onopen` 后启动，`onclose` 时停止。

## 2. 统一消息结构

服务端推送均为如下 JSON（`src/api/websocket.ts :: WSMessage`）：

```json
{
  "type": "USER_ONLINE",
  "data": { "userId": "1", "userName": "管理员", "account": "admin", "onlineTime": 1754000000000 },
  "timestamp": 1754000000000
}
```

| 字段 | 含义 |
| --- | --- |
| `type` | 业务类型，用于分发（如 `USER_ONLINE`、`pong`） |
| `data` | 业务负载，结构随 `type` 变化 |
| `timestamp` | 服务端时间戳（毫秒，可选） |

前端解析规则：非对象、缺 `type`、或 `type === 'pong'` 的消息均不向上层抛出。

## 3. 事件分发

前端按 `type` 字段分发（`src/hooks/useBwsConnection.ts`）：

- `type === "USER_ONLINE"` → 用户上线提示。
- 其余 `type`（含 `pong`）→ 忽略。

当前仅实现 `USER_ONLINE`（上线）事件，暂无 `leave`/下线事件推送。

### 3.1 USER_ONLINE（用户上线）

`data` 结构（`WsUserOnlineData`）：

```json
{
  "userId": "1",
  "userName": "管理员",
  "account": "admin",
  "onlineTime": 1754000000000
}
```

| 字段 | 含义 |
| --- | --- |
| `userId` | 用户唯一标识 |
| `userName` | 用户名称/昵称 |
| `account` | 用户登录账号 |
| `onlineTime` | 上线时间戳（毫秒，可选；未提供时由客户端补全） |

前端处理：取 `userName || account || userId || '一位用户'` 作为名称，触发桌宠气泡提示，例如「`{名称} 上线了，打个招呼吧~`」。无需前端过滤"自己"，由服务端保证广播语义。

## 4. 断线与重连

- 连接断开（`onclose`）后，若非手动关闭（`manualClose === false`），触发自动重连。
- **重连策略（指数退避）**：初始间隔 `RECONNECT_BASE = 1_000 ms`，每次翻倍，上限 `RECONNECT_MAX = 30_000 ms`；连接成功 (`onopen`) 后重置回 1s。
- 重连时重新调用 `connect()`，重新推导地址并再次携带 `token`（若已登录），因此重连后身份仍为登录用户。
- `onerror` 仅负责关闭底层 socket，真正的重连逻辑统一在 `onclose` 处理，避免重复触发。
- 手动关闭：`disconnect()` 置 `manualClose = true`，停止心跳、清除重连定时器、关闭连接，不再自动重连（用于用户登出等场景）。

### 4.1 重连与订阅

- 当前为原生 WebSocket，无 STOMP 订阅概念；订阅即「注册消息回调」（`bwsClient.onMessage`）。
- 因回调通过 `Set` 维护且为单例，重连后无需重新注册回调；新连接建立后即可继续收到推送。
- 组件卸载时移除回调并 `disconnect()`，避免重复建连与内存泄漏。

## 5. 前端接入步骤（对接方参考）

1. 在入口组件挂载 `useBwsConnection()`（已实现，监听 `USER_ONLINE` 并驱动桌宠提示）。
2. 如需新增事件类型：
   - 在 `src/api/websocket.ts` 的 `WSMessage`/`WsUserOnlineData` 补充类型定义；
   - 在 `src/hooks/useBwsConnection.ts` 的 `onMessage` 回调中按 `type` 增加分发分支。
3. 主动上行（如有需求）：当前为纯下行推送，暂无上行指令通道；如需上行，经同一 `bwsClient` 调用 `ws.send(JSON.stringify(...))` 即可。

## 6. 与早期方案的区别（迁移提示）

| 项 | 早期方案 | 当前方案 |
| --- | --- | --- |
| 协议 | SockJS + STOMP over `/ws` | 原生 WebSocket over `/bws` |
| 库 | `sockjs-client` + `stompjs` | 浏览器原生 `WebSocket` |
| 鉴权 | query `?token=`（可选，游客免登录） | query `?token=`（登录 accessToken） |
| 心跳 | STOMP `heartbeat.incoming/outgoing = 10000` | 应用层 `ping`/`pong`，25s |
| 订阅 | `/user/online/broadcast` 等 STOMP 目的地 | 消息回调 `onMessage`，按 `type` 分发 |
| 重连 | 固定 5s 重订阅 | 指数退避 1s→30s |

> 若后端仍提供 `/ws`（STOMP）端点，与前端 `/bws` 原生方案互不兼容，请以后端实际提供的 `/bws` 原生协议为准。
