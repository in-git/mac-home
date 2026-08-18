# 在线人数（免登录）WebSocket 对接文档

## 一、功能说明

实时推送"当前在线人数"：

- 客户端连接 `/ws/ws-online` 即视为上线，在线人数 +1
- 客户端需**定时发送心跳**（任意文本，如 `ping`）以维持在线状态
- 服务端 **90 秒未收到心跳**判定访客离线（如关闭浏览器窗口/标签页、切后台、网络断开），主动关闭连接并移除，在线人数 -1
- 服务端定时（每 30 秒）扫描心跳超时的连接并清理，**彻底避免关闭窗口后残留的在线人数**
- 新连接建立时、人数变化时、心跳超时剔除时，向所有在线连接广播最新人数

> 在线人数 = 当前 WebSocket 真实连接数（基于心跳），**不再**依赖 `BIZ_VISITOR_ONLINE` 表，因此关闭窗口后即可正确下线。

后端实现：`OnlineCountWebSocket` + `VisitorOnlineManager`（`@ServerEndpoint` 原生 WebSocket，与项目 `DevMessageWebSocket` 同构），免登录。
`dashboard` 接口返回的 `overview.onlineCount` 也直接读取该实时在线连接数。

## 二、端点与协议

| 项目 | 值 | 说明 |
| --- | --- | --- |
| 端点 | `/ws/ws-online` | 原生 WebSocket，非 STOMP。以 `/ws` 开头命中免登录放行规则 `/ws/**`，无需改拦截器 |
| 协议 | `ws://`（https 页面用 `wss://`） | 浏览器原生 `new WebSocket(url)` 即可，无需 SockJS |
| 鉴权 | **无需登录** | `/ws/**` 已在 `GlobalConfigure.NO_LOGIN_PATH_ARR` 放行 |
| 上行 | **需定时发送心跳** | 建议每 30 秒发送一次（任意文本，如 `ping`），否则 90 秒超时下线 |

### 心跳参数

| 参数 | 值 | 说明 |
| --- | --- | --- |
| 心跳超时阈值（服务端） | 90 秒 | 超过该时间未收到任意上行消息即判定离线 |
| 心跳扫描周期（服务端） | 30 秒 | 每 30 秒扫描一次超时连接并关闭 |
| 推荐客户端心跳间隔 | 30 秒 | 留出余量，避免网络抖动误判 |

## 三、消息结构

服务端推送为 JSON 字符串：

```json
{
  "data": {
    "total": 12
  }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.total` | number | 当前在线人数 |

## 四、前端对接要点

1. 使用浏览器原生 WebSocket：`new WebSocket('ws://host:port/ws/ws-online')`
2. `onopen` 表示连接成功，已计入在线人数，**立即启动心跳定时器（每 30 秒 `send('ping')`）**
3. `onmessage` 收到 JSON，解析 `data.total` 渲染即可
4. `onclose` 表示已下线，人数已 -1；可延迟重连
5. **必须定时发送上行心跳**，否则连接会被服务端超时剔除
6. `onbeforeunload` 时可主动 `socket.close()` 加速下线（非必须，服务端会超时清理）

