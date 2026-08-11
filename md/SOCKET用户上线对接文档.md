
## 1. 连接

- 端点：`/bws`，使用原生 WebSocket（无需 STOMP / SockJS 降级）。

  - 协议自动转换：`http` → `ws`，`https` → `wss`，避免混合内容被浏览器拦截。
  - 示例：`VITE_API_BASE_URL=http://localhost:3000` → 连接地址 `ws://localhost:3000/bws`
- 身份通过 query 参数 `token` 传递：
  - 已登录用户：携带登录返回的 `accessToken`（自动从 `localStorage` 读取，已 URL 编码）。
  - 未登录（游客）：不带 token，仅能收到有限的广播消息。
- 同一浏览器多标签页会建立多个独立连接，互不影响。

## 2. 统一消息结构

所有推送均为如下 JSON，按 `type` 字段分发：

```json
{
  "type": "USER_ONLINE",
  "timestamp": 1754000000000,
  "data": {}
}
```

- `type`：消息类型（字符串），前端据此路由到对应处理逻辑
- `timestamp`：服务端时间戳（毫秒），可选
- `data`：业务负载，结构随 `type` 变化，可选

## 3. 心跳机制

- 客户端每 **25 秒** 发送一次心跳：`{"type": "ping"}`
- 服务端回复：`{"type": "pong"}`
- 客户端在收到 `pong` 后不会向上层业务分发（内部处理）

## 4. 重连机制

- 断线后自动重连（非手动关闭时触发）
- 指数退避策略：首次 1s，每次翻倍，最大 30s
- 重连成功后会重置退避间隔为 1s
- 手动调用 `disconnect()` 可永久关闭连接，不再重连

## 5. 连接状态

客户端对外暴露 4 种状态，可通过 `bwsClient.onStatus()` 订阅：

| 状态 | 含义 |
| --- | --- |
| `connecting` | 正在建立连接 |
| `open` | 连接已建立，可正常收发消息 |
| `reconnecting` | 连接断开，正在自动重连 |
| `closed` | 已手动关闭，不会再重连 |

## 6. 用户上线消息（USER_ONLINE）

当前已实现的消息类型：`USER_ONLINE`

### 6.1 data 结构

```json
{
  "userId": "1",
  "userName": "管理员",
  "account": "admin",
  "onlineTime": 1754000000000
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `userId` | string \| undefined | 用户 ID（游客时可能为 undefined） |
| `userName` | string \| undefined | 用户昵称/名称 |
| `account` | string \| undefined | 登录账号 |
| `onlineTime` | number \| undefined | 上线时间戳（毫秒） |

### 6.2 前端处理示例

```typescript
import { bwsClient, type WSMessage, type WsUserOnlineData } from '@/api/websocket';

// 订阅消息
const offMessage = bwsClient.onMessage((msg: WSMessage) => {
  if (msg.type !== 'USER_ONLINE') return;
  const data = (msg.data ?? {}) as WsUserOnlineData;
  const name = data.userName || data.account || data.userId || '一位用户';
  // 业务处理：如弹出提示、更新在线列表等
  console.log(`${name} 上线了`);
});

// 清理
offMessage();
```

## 7. 客户端 API

### 7.1 获取实例

```typescript
import { bwsClient } from '@/api/websocket';
```

全局单例，整个应用共享一个连接。

### 7.2 方法列表

| 方法 | 说明 | 返回值 |
| --- | --- | --- |
| `connect()` | 建立 WebSocket 连接（非手动关闭的断线会自动重连） | `void` |
| `disconnect()` | 手动关闭连接，停止重连（如用户登出时调用） | `void` |
| `onMessage(handler)` | 订阅所有业务消息，返回取消订阅函数 | `() => void` |
| `onStatus(handler)` | 订阅连接状态变化，返回取消订阅函数 | `() => void` |
| `status` (getter) | 获取当前连接状态（同步） | `WsStatus` |

### 7.3 使用建议

```typescript
// 典型生命周期（如 App 组件中）
useEffect(() => {
  // 进入页面即建立连接
  bwsClient.connect();

  // 订阅消息
  const offMessage = bwsClient.onMessage((msg) => {
    // 按 type 分发处理
    switch (msg.type) {
      case 'USER_ONLINE':
        handleUserOnline(msg.data);
        break;
    }
  });

  // 订阅状态
  const offStatus = bwsClient.onStatus((status) => {
    console.log('WS status:', status);
  });

  return () => {
    // 组件卸载时清理
    offMessage();
    offStatus();
    bwsClient.disconnect();
  };
}, []);
```

## 8. 扩展新消息类型步骤

1. 后端推送新的 `type`（如 `USER_OFFLINE`、`CHAT_MESSAGE` 等）
2. 前端在 `websocket.ts` 中新增对应 data 的 TypeScript 接口
3. 在业务组件的 `onMessage` 回调中按新 `type` 添加处理逻辑
4. 如需主动发送消息给服务端，可在 `ws.onopen` 后调用 `ws.send(JSON.stringify({ type: 'xxx', data: {...} }))`（当前 `bwsClient` 未暴露发送方法，需要时可扩展）

