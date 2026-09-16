---
name: c-end-video-read-skill
description: "C端视频对接文档（免登录），涵盖视频分页列表、详情、点击量自增接口，未登录用户可直接访问，只含接口字段说明"
version: 1.0.0
tags:
  - C端
  - 视频
  - 读取
  - 点击量
  - 免登录
  - BizVideoPublicController
  - 对接文档
---
# C端视频对接文档（免登录）

> C 端（以及未登录访客）可**读取**视频信息、并在点击视频时**上报点击量**，不提供新增 / 编辑 / 删除能力。
> 后端提供 **公开接口**（路径前缀 `/public/video/**`），已加入 `GlobalConfigure.NO_LOGIN_PATH_ARR`（`/public/**`）放行，
> **不需要任何 token，未登录用户可直接访问**。
> 现有 B 端接口 `/biz/video/**` 带 `@SaCheckPermission`，**请勿复用**。

## 1. 接口清单

| 能力       | 方法 | 路径                       | 鉴权           | 权限要求      |
| ---------- | ---- | -------------------------- | -------------- | ------------- |
| 视频列表   | GET  | `/public/video/page`       | 免登录（公开） | 无（只读）    |
| 视频详情   | GET  | `/public/video/detail`     | 免登录（公开） | 无（只读）    |
| 点击量自增 | GET  | `/public/video/click`      | 免登录（公开） | 无（写计数）  |

> 说明：以上接口均为**免登录公开访问**，无需携带任何 token。其中 `click` 仅对浏览量计数做自增，不做其它写操作。

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

## 4. 点击量自增 `GET /public/video/click`

C 端在用户点击 / 打开视频时调用，后端将该视频的浏览量（`count`）自增 1。接口为免登录公开访问。

### 4.1 入参（Query）

| 参数 | 必填 | 类型   | 说明      |
| ---- | ---- | ------ | --------- |
| id   | 是   | String | 视频主键  |

示例：`/public/video/click?id=1900000000000000001`

### 4.2 返回

```json
{
  "code": 200,
  "data": null,
  "message": "success"
}
```

> 仅对 `count` 字段做自增，不影响其它字段；查询不存在的 id 时返回业务错误。

## 5. 字段说明（data 内）

| 字段         | 类型    | 说明                                                  |
| ------------ | ------- | ----------------------------------------------------- |
| id           | String  | 视频主键                                              |
| title        | String  | 视频名称                                              |
| url          | String  | 视频地址（**相对路径**，前端需拼接 base 后使用）      |
| cover        | String  | 视频封面地址（**相对路径**，前端需拼接 base 后使用）  |
| description  | String  | 描述                                                  |
| count        | Integer | 浏览量（点击 `/public/video/click` 时自增）           |
| status       | String  | 状态（如 `ENABLE` / `DISABLE`）                       |
| sortCode     | Integer | 排序码                                                |
| remark       | String  | 备注                                                  |
| extJson      | String  | 扩展信息（JSON 字符串）                              |
| createTime   | String  | 创建时间                                              |
| updateTime   | String  | 更新时间                                              |

> **重要**：`url` / `cover` 返回的是**相对路径**（如 `/dev/file/download?id=...`），不是完整地址，前端需拼接接口 base 后使用。

## 6. 关键约束

1. 路径必须 `/public/video/**`；**勿写** `/biz/video/**`（触发超管校验 → 401），亦非 `/client/c/video/**`
2. 以上接口均为**免登录公开访问**，无需携带 token
3. `click` 仅用于浏览量计数自增，不提供其它写能力；业务上应在用户真实点击时上报
4. `url` / `cover` 均为相对路径，前端务必拼接 base 后用于媒体标签
5. 返回的视频/封面地址 (`/dev/file/download?id=...`) 是否需登录取决于文件引擎配置；如被拦截请确认文件访问策略
