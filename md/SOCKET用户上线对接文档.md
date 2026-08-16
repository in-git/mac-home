---
name: socket-member-count-skill
description: "人数卡片实时数据免登录对接文档：当前在线/今日/当月三个人数，端点 /ws 免登录，订阅 /user/membercount/queue 即可，极简说明"
version: 1.0.0
tags:
  - 免登录
  - WebSocket
  - 人数卡片
  - 实时统计
  - 前端对接文档
---


## 1. 概述

页面进入时展示一个"人数卡片"，含三个字段，全部来自 WebSocket 推送：

| 字段 | 说明 |
| --- | --- |
| currentCount | 当前在线人数（实时变化） |
| todayCount | 今日累计人数 |
| monthCount | 当月累计人数 |

- **免登录**：端点 `/ws` 无任何权限要求，游客可直接连接。
- 连接时带登录 `token`（query 参数，可选）可识别身份，不带也正常。

## 2. 连接

- 端点：`/ws`，必须用 **SockJS + STOMP**（不要裸 WebSocket）。
  - `sockjs-client@1.6.1`
  - `stompjs@2.3.3`（UMD，全局 `Stomp.over()`）
- 流程：`new SockJS(url)` → `Stomp.over(socket)` → `connect()` → **connect 回调后再订阅**。
- URL 必须为 `http:`/`https:`（`ws:`/`wss:` 需先转换）。
- 建议心跳 `heartbeat.incoming/outgoing = 10000`。

## 3. 订阅

连接成功回调中订阅：

```js
stompClient.subscribe('/user/membercount/queue', function(frame) {
  var msg = JSON.parse(frame.body);
  // msg.data 即三个字段
  card.render(msg.data);
});
```

## 4. 消息结构

```json
{
  "module": "membercount",
  "type": "snapshot",
  "timestamp": 1754000000000,
  "data": { "currentCount": 5, "todayCount": 12, "monthCount": 89 }
}
```

- `type = "snapshot"`：订阅后立即推送一次（进入页面即有数据）。
- `type = "update"`：人数变化时广播推送。
- 两种类型 `data` 结构相同，前端收到后直接覆盖卡片三个字段即可。

## 5. 断线与重连

- 断开后服务端视为下线；建议 5 秒自动重连，**重连成功后必须重新订阅** `/user/membercount/queue`（会再次收到 snapshot）。
- 重连时保留原 `token`（游客无需）。

## 6. 数据来源说明（后端）

- 当前在线人数：实时在线连接数。
- 今日/当月人数：每次连接累计 +1，跨天/跨月自动清零，持久化在系统配置 `MEMBER_COUNT`（前端无需关心）。
