---
name: c-end-video-read-skill
description: "C端视频读取对接文档（只读、免登录），涵盖视频分页列表 GET /public/video/page 与视频详情 GET /public/video/detail，未登录用户可直接访问，含入参、返回结构与前端调用"
version: 1.0.0
tags:
  - C端
  - 视频
  - 读取
  - 免登录
  - BizVideoPublicController
  - 前端对接文档
---
# C端视频读取对接文档（只读、免登录）

> C 端（以及未登录访客）**只读取**视频信息，没有任何新增 / 编辑 / 删除能力。
> 后端提供 **公开只读接口**（路径前缀 `/public/video/**`），已加入 `GlobalConfigure.NO_LOGIN_PATH_ARR`（`/public/**`）放行，
> **不需要任何 token，未登录用户可直接访问**。
> 现有 B 端接口 `/biz/video/**` 带 `@SaCheckPermission`，**请勿复用**。

## 1. 接口清单

| 能力     | 方法 | 路径                       | 鉴权           | 权限要求      |
| -------- | ---- | -------------------------- | -------------- | ------------- |
| 视频列表 | GET  | `/public/video/page`       | 免登录（公开） | 无（只读）    |
| 视频详情 | GET  | `/public/video/detail`     | 免登录（公开） | 无（只读）    |

> 说明：视频需在首页 / 列表页公开展示，这两个接口为**免登录公开读**，前端裸 `fetch` 即可调用，无需携带任何 token。

## 2. 视频列表 `GET /public/video/page`

### 2.1 入参（Query）

| 参数      | 必填 | 类型    | 说明                                          |
| --------- | ---- | ------- | --------------------------------------------- |
| current   | 否   | Integer | 当前页码，默认 1                              |
| size      | 否   | Integer | 每页条数，默认 10                            |
| sortField | 否   | String  | 排序字段（驼峰），如 `createTime`、`count`    |
| sortOrder | 否   | String  | 排序方式（**小写**）：`ascend` 升序 / `descend` 降序      |
| searchKey | 否   | String  | 关键词，模糊匹配视频名称等                    |
| title     | 否   | String  | 按视频名字精确/模糊过滤                       |

示例：`/public/video/page?current=1&size=10&sortField=createTime&sortOrder=descend`

### 2.2 返回

```json
{
  "code": 200,
  "data": {
    "records": [
      {
        "id": "1900000000000000001",
        "title": "示例视频",
        "url": "/dev/file/download?id=1900000000000000001",
        "cover": "/dev/file/download?id=1900000000000000002",
        "description": "这是一段示例描述",
        "count": 128,
        "status": "ENABLE",
        "createTime": "2026-09-16 10:06:00"
      }
    ],
    "total": 36,
    "size": 10,
    "current": 1,
    "pages": 4
  },
  "message": "success"
}
```

## 3. 视频详情 `GET /public/video/detail`

### 3.1 入参（Query）

| 参数 | 必填 | 类型   | 说明      |
| ---- | ---- | ------ | --------- |
| id   | 是   | String | 视频主键  |

示例：`/public/video/detail?id=1900000000000000001`

### 3.2 返回

```json
{
  "code": 200,
  "data": {
    "id": "1900000000000000001",
    "title": "示例视频",
    "url": "/dev/file/download?id=1900000000000000001",
    "cover": "/dev/file/download?id=1900000000000000002",
    "description": "这是一段示例描述",
    "count": 128,
    "status": "ENABLE",
    "sortCode": 1,
    "remark": "",
    "extJson": "",
    "createTime": "2026-09-16 10:06:00",
    "updateTime": "2026-09-16 10:06:00"
  },
  "message": "success"
}
```

## 4. 字段说明（data 内）

| 字段         | 类型    | 说明                                                  |
| ------------ | ------- | ----------------------------------------------------- |
| id           | String  | 视频主键                                              |
| title        | String  | 视频名称                                              |
| url          | String  | 视频地址（**相对路径**，前端需拼接 base 后使用）      |
| cover        | String  | 视频封面地址（**相对路径**，前端需拼接 base 后使用）  |
| description  | String  | 描述                                                  |
| count        | Integer | 浏览量                                                |
| status       | String  | 状态（如 `ENABLE` / `DISABLE`）                       |
| sortCode     | Integer | 排序码                                                |
| remark       | String  | 备注                                                  |
| extJson      | String  | 扩展信息（JSON 字符串）                              |
| createTime   | String  | 创建时间                                              |
| updateTime   | String  | 更新时间                                              |

> **重要**：`url` / `cover` 返回的是**相对路径**（如 `/dev/file/download?id=...`），不是完整地址。
> 前端必须拼接接口 base 才能直接用于 `<video :src>` / `<img :src>`。

## 5. 前端调用

### 5.1 拼接完整地址

```js
import { getApiBaseUrl } from '@/utils/request'

// 相对路径 -> 完整地址；已是完整 http(s) 地址则原样返回
const withBase = (value) => (value && value.startsWith('/') ? getApiBaseUrl() + value : value || '')
```

### 5.2 列表 / 详情请求（免登录）

接口为公开只读，**无需 token**，可直接用普通请求调用；若项目统一走客户端请求封装也可使用 `clientBaseRequest`（会附带 `CLIENT_TOKEN`，但后端公开接口忽略即可）。

```js
import { baseRequest } from '@/utils/request'

// 分页列表（免登录）
export const getVideoPage = (params) =>
  baseRequest('/public/video/page', params, 'get')

// 详情（免登录）
export const getVideoDetail = (id) =>
  baseRequest('/public/video/detail', { id }, 'get')
```

```js
// 列表渲染：封面作视频 poster，url 拼接 base
const { data } = await getVideoPage({ current: 1, size: 10 })
const list = data.records.map((v) => ({
  ...v,
  url: withBase(v.url),
  cover: withBase(v.cover)
}))

// 详情渲染
const { data } = await getVideoDetail('1900000000000000001')
const video = { ...data, url: withBase(data.url), cover: withBase(data.cover) }
```

> 公开接口不校验登录态，前端无需读取 `CLIENT_TOKEN`，裸 `fetch` / `baseRequest` 即可。

## 6. 关键约束

1. C 端只读：**禁止**提供 `add` / `edit` / `delete` 给前端，这些仅 B 端（`/biz/video/**`）可用
2. 路径必须 `/public/video/**`，**勿写** `/biz/video/**`（触发超管校验 → 401），亦非 `/client/c/video/**`
3. 本接口为**免登录公开读**，无需携带 token；请勿在公开接口上添加写操作
4. `url` / `cover` 均为相对路径，前端务必 `withBase()` 拼接后再用于媒体标签
5. 返回的视频/封面地址 (`/dev/file/download?id=...`) 是否需登录取决于文件引擎配置；如被拦截请确认文件访问策略
6. 仅读取，不对数据做任何写操作
