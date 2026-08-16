---
name: b-end-visitor-stats-skill
description: "B端访客统计前端对接文档，对应 BizVisitorStatsController，涵盖访客信息上报接口与每日PV/UV、周统计、月统计聚合查询接口的参数与返回说明"
version: 1.1.0
tags:
  - B端
  - 访客统计
  - BizVisitorStatsController
  - PV
  - UV
  - 前端对接文档
---
# B端访客统计前端对接文档

> 适用范围：B端访客统计看板数据展示与访客信息上报
> 后端实现：`vip.xiaonuo.biz.modular.visitor.controller.BizVisitorStatsController`
> 更新时间：2026-08-16

---

## 一、通用约定

### 1.1 基础信息

| 项 | 说明 |
| --- | --- |
| 接口前缀 | `/public/visitor` |
| 鉴权 | **无需鉴权**。`/public/**` 已在 `GlobalConfigure.NO_LOGIN_PATH_ARR` 放行，请求不需要携带 `token` |
| 请求编码 | UTF-8 |
| 响应格式 | `application/json` |

本地联调示例基址：`http://localhost:82`（以实际 `server.port` / 网关前缀为准）。

### 1.2 统一响应结构

所有接口均返回 `CommonResult` 包装：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {},
  "traceId": "a1b2c3d4"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| code | number | `200` 成功；`500` 业务/服务异常 |
| msg | string | 提示语，失败时为错误原因，可直接 toast |
| data | any | 业务数据，失败时为 `null` |
| traceId | string | 链路追踪ID，排查问题时提供给后端 |

---

## 二、接口说明

共两个接口：
- **上报访客信息** `POST /public/visitor/report` —— 前端主动调用，把用户信息传给后端
- **获取统计聚合数据** `GET /public/visitor/dashboard` —— 获取看板数据

> 说明：除前端主动上报外，后端也有全局拦截器自动采集访问记录。前端上报接口用于补充前端独有的信息（如页面标题、屏幕分辨率、前端生成的访客标识等），二者数据都会进入统计。

---

### 2.1 上报访客信息

前端在页面加载或路由切换时调用，把用户信息上报给后端用于访客统计。建议在应用启动时调用一次，并在每次路由切换时调用一次。

#### 请求

```
POST /public/visitor/report
Content-Type: application/json
```

##### 请求体参数（JSON）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| visitorId | string | 否 | 访客自定义标识，前端生成的 UUID/设备指纹，用于跨会话 UV 识别。强烈建议前端生成一个持久化的 UUID（如存 localStorage）传入，可提高 UV 统计准确性 |
| page | string | 否 | 当前页面路径，如 `/index`、`/about` |
| title | string | 否 | 页面标题 |
| referrer | string | 否 | 来源页URL，即 `document.referrer` |
| screen | string | 否 | 屏幕分辨率，如 `1920x1080` |
| language | string | 否 | 语言，如 `zh-CN`，即 `navigator.language` |
| extJson | string | 否 | 自定义扩展信息，JSON 字符串 |

##### 请求示例

```json
{
  "visitorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "page": "/index",
  "title": "首页",
  "referrer": "https://www.google.com",
  "screen": "1920x1080",
  "language": "zh-CN"
}
```

#### 响应

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null,
  "traceId": "a1b2c3d4"
}
```

上报成功 `data` 为 `null`，无需处理返回数据。接口内部已捕获所有异常，不会抛错影响前端。

---

### 2.2 获取访客统计聚合数据

获取访客统计看板所需的全部数据：今日/昨日/本周/本月 PV/UV/IP 概览，以及日/周/月趋势序列。

#### 请求

```
GET /public/visitor/dashboard
```

##### 请求参数（Query）

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| days | number | 否 | 30 | 日趋势返回最近多少天的数据 |
| weeks | number | 否 | 12 | 周趋势返回最近多少周的数据 |
| months | number | 否 | 12 | 月趋势返回最近多少月的数据 |

##### 请求示例

```
GET /public/visitor/dashboard?days=30&weeks=12&months=12
```

不传任何参数时使用默认值：

```
GET /public/visitor/dashboard
```

#### 响应

##### 响应体结构

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "overview": {
      "todayPv": 1280,
      "todayUv": 320,
      "todayIp": 280,
      "yesterdayPv": 1100,
      "yesterdayUv": 290,
      "yesterdayIp": 250,
      "weekPv": 7800,
      "weekUv": 1850,
      "weekIp": 1620,
      "monthPv": 32500,
      "monthUv": 7600,
      "monthIp": 6800,
      "onlineCount": 15
    },
    "dailyTrend": [
      { "date": "2026-07-18", "pv": 980, "uv": 240, "ipCount": 210 },
      { "date": "2026-07-19", "pv": 1050, "uv": 260, "ipCount": 230 }
    ],
    "weeklyTrend": [
      { "date": "2026-06-22", "pv": 6500, "uv": 1600, "ipCount": 1400 },
      { "date": "2026-06-29", "pv": 7200, "uv": 1750, "ipCount": 1530 }
    ],
    "monthlyTrend": [
      { "date": "2026-07-01", "pv": 28000, "uv": 6500, "ipCount": 5800 },
      { "date": "2026-08-01", "pv": 32500, "uv": 7600, "ipCount": 6800 }
    ]
  },
  "traceId": "a1b2c3d4"
}
```

##### `data.overview` 概览字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| todayPv | number | 今日页面浏览量（实时，从明细表统计） |
| todayUv | number | 今日独立访客数（实时） |
| todayIp | number | 今日独立IP数（实时） |
| yesterdayPv | number | 昨日页面浏览量（来自聚合表） |
| yesterdayUv | number | 昨日独立访客数 |
| yesterdayIp | number | 昨日独立IP数 |
| weekPv | number | 本周（周一至今）页面浏览量 |
| weekUv | number | 本周独立访客数 |
| weekIp | number | 本周独立IP数 |
| monthPv | number | 本月（月初至今）页面浏览量 |
| monthUv | number | 本月独立访客数 |
| monthIp | number | 本月独立IP数 |
| onlineCount | number | 当前在线人数（最近 30 分钟有活跃的访客数） |

##### `data.dailyTrend` / `data.weeklyTrend` / `data.monthlyTrend` 趋势字段说明

三个趋势数组结构相同，每个元素代表一个时间维度：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| date | string | 日期，格式 `yyyy-MM-dd`。日趋势为当天日期；周趋势为该周一日期；月趋势为该月1号 |
| pv | number | 该周期内页面浏览量，无数据时为 `0` |
| uv | number | 该周期内独立访客数，无数据时为 `0` |
| ipCount | number | 该周期内独立IP数，无数据时为 `0` |

> 趋势序列保证连续：即使某天/某周/某月无访问数据，也会返回该时间点且 `pv/uv/ipCount` 均为 `0` 的元素，前端可直接用于绘制折线图/柱状图，无需自行补 0。

---

## 三、指标定义

| 指标 | 定义 |
| --- | --- |
| PV | Page View，页面浏览量，用户每访问一个页面计数 +1 |
| UV | Unique Visitor，独立访客数，按访客标识去重。优先用前端上报的 `visitorId`；未上报时登录用户按用户ID去重，未登录用户按 Cookie 标识去重 |
| IP | 独立IP数，按客户端IP去重 |
| 在线人数 | 最近 30 分钟内有访问行为的独立访客数 |

---

## 四、前端对接建议

### 4.1 访客标识生成（强烈建议）

前端在应用启动时生成一个 UUID 存入 `localStorage`，后续每次上报都带上这个 `visitorId`：

```js
// 生成并持久化访客标识
let visitorId = localStorage.getItem('VISITOR_ID')
if (!visitorId) {
  visitorId = crypto.randomUUID()
  localStorage.setItem('VISITOR_ID', visitorId)
}
```

这样可以跨会话、跨浏览器重启稳定识别同一访客，显著提升 UV 统计准确性。

### 4.2 上报时机

```js
// 1. 应用启动时上报
reportVisit({ visitorId, page: location.pathname, title: document.title })

// 2. 路由切换时上报（以 vue-router 为例）
router.afterEach((to) => {
  reportVisit({ visitorId, page: to.path, title: to.meta?.title })
})
```

上报接口无需等待返回结果，可 fire-and-forget。

### 4.3 看板页面

进入看板时调用一次 `GET /public/visitor/dashboard`，用返回的 `overview` 渲染顶部数据卡片，用三个 trend 数组渲染下方折线图。如需实时刷新，可每隔 1~5 分钟重新请求。

### 4.4 上报函数示例

```js
async function reportVisit(data) {
  try {
    await fetch('/public/visitor/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: localStorage.getItem('VISITOR_ID'),
        page: data.page,
        title: data.title,
        referrer: document.referrer,
        screen: `${screen.width}x${screen.height}`,
        language: navigator.language
      })
    })
  } catch (e) {
    // 上报失败静默忽略, 不影响业务
  }
}
```
