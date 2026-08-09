# 前端C端登录对接精简文档（开发对接专用）

## 一、三种登录方式

### 1. 账号密码登录 `POST /auth/c/doLogin`

| 参数           | 必填 | 说明                                         |
| -------------- | ---- | -------------------------------------------- |
| account        | 是   | 账号                                         |
| password       | 是   | 密码（**前端SM2加密后hex字符串，禁止明文**） |
| validCode      | 条件 | 图形验证码，`captchaOpen=true` 时必填        |
| validCodeReqNo | 条件 | 验证码请求号，`captchaOpen=true` 时必填      |
| tenCode        | 条件 | 多租户启用时必填                             |

### 2. 手机号验证码登录 `POST /auth/c/doLoginByPhone`

| 参数           | 必填 | 说明                       |
| -------------- | ---- | -------------------------- |
| phone          | 是   | 11位手机号                 |
| validCode      | 是   | 6位短信验证码              |
| validCodeReqNo | 是   | 获取验证码接口返回的请求号 |

### 3. 邮箱验证码登录 `POST /auth/c/doLoginByEmail`

| 参数           | 必填 | 说明         |
| -------------- | ---- | ------------ |
| email          | 是   | 邮箱地址     |
| validCode      | 是   | 邮箱验证码   |
| validCodeReqNo | 是   | 验证码请求号 |

## 二、验证码接口

| 接口       | 方法                            | 入参  | 返回                       |
| ---------- | ------------------------------- | ----- | -------------------------- |
| 图形验证码 | `GET /auth/c/getPicCaptcha`     | 无    | base64图片、validCodeReqNo |
| 短信验证码 | `GET /auth/c/getPhoneValidCode` | phone | 触发60s倒计时              |
| 邮箱验证码 | `GET /auth/c/getEmailValidCode` | email | 触发60s倒计时              |

## 三、SM2加密公钥

公钥（所有环境共用，固定值）：

```
04298364ec840088475eae92a591e01284d1abefcda348b47eb324bb521bb03b0b2a5bc393f6b71dabb8f15c99a0050818b56b23f31743b93df9cf8948f15ddb54
```

算法：SM2 非对称加密，输出 **hex 字符串** 作为 password 参数。

## 四、登录成功后续动作

1. 存 `CLIENT_TOKEN` 到 localStorage
2. `GET /auth/c/getLoginUser` 获取用户信息，存 `CLIENT_USER_INFO`
3. 路由跳转（**用 `replace`，禁止 `push`**，防止浏览器回退到登录页）

## 五、前端 Token 与后端对接约定

### 1. Token 从哪里来

登录接口（`/auth/c/doLogin`、`/auth/c/doLoginByPhone`、`/auth/c/doLoginByEmail`）**成功响应体**里直接返回 token 字符串。

后端响应示例（字段名固定为 `token`）：

```json
{
  "code": 200,
  "data": "<token字符串>",
  "msg": "success"
}
```

### 2. Token 存在哪里（前端）

浏览器 `window.localStorage` 的 `CLIENT_TOKEN` 键下，值为**后端返回的 token 原字符串，不做任何加工**。

| Key                | 值                              | 写入时机       |
| ------------------ | ------------------------------- | -------------- |
| `CLIENT_TOKEN`     | 登录接口返回的 token 原串       | 登录成功       |
| `CLIENT_USER_INFO` | `GET /auth/c/getLoginUser` 返回 | 登录成功后调用 |

> **不是** sessionStorage、**不是** cookie、**不是** Pinia。**不要**自己加 `Bearer ` 前缀。

### 3. 怎么发给后端（请求头协议）

每一次请求，**前端必须**在 HTTP 请求头里加 `token` 字段，值为原 token 串：

| 协议项       | 值                                                            |
| ------------ | ------------------------------------------------------------- |
| Header 名    | `token`（**不是** `Authorization`）                           |
| Header 值    | `<token原串>`（**不带** `Bearer ` 前缀）                      |
| 是否必带     | 除登录 / 验证码等免登接口外，**所有 `/auth/c/**` 请求必带\*\* |
| 带在哪些请求 | 当前端 localStorage 里有 `CLIENT_TOKEN` 时必带                |

### 4. 后端怎么验（行为约定，不暴露实现）

| 场景       | 后端行为                         | 前端应对                                                            |
| ---------- | -------------------------------- | ------------------------------------------------------------------- |
| token 有效 | 正常执行业务，识别出当前 C端用户 | 继续                                                                |
| token 缺失 | 路由白名单外的接口返回 `401`     | 跳转登录页                                                          |
| token 过期 | 返回 `401`                       | 清 `CLIENT_TOKEN` + `CLIENT_USER_INFO`，跳转登录页                  |
| token 非法 | 返回 `401`                       | 同上                                                                |
| 主动登出   | `GET /auth/c/doLogout`           | 清 `CLIENT_TOKEN` + `CLIENT_USER_INFO`，**保留** `REMEMBER_ACCOUNT` |

### 5. B端 / C端 Token 互不通用

| 端  | localStorage key | 接口前缀     | 后端识别                  |
| --- | ---------------- | ------------ | ------------------------- |
| C端 | `CLIENT_TOKEN`   | `/auth/c/**` | 后端 C 端 Sa-Token 客户端 |
| B端 | `TOKEN`          | `/auth/b/**` | 后端 B 端 Sa-Token 客户端 |

> **绝对不要** 把 B端 `TOKEN` 拿去调 C端 `/auth/c/**` 接口，反之亦然——后端两套客户端类型完全隔离。

## 六、登出接口

`GET /auth/c/doLogout`

清除：`CLIENT_TOKEN`、`CLIENT_USER_INFO`；**保留** `REMEMBER_ACCOUNT`。

## 七、表单校验正则

| 字段   | 正则                                                                            |
| ------ | ------------------------------------------------------------------------------- |
| 手机号 | `/^(13[0-9]\|14[579]\|15[0-3,5-9]\|16[6]\|17[0135678]\|18[0-9]\|19[89])\d{8}$/` |
| 邮箱   | `/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/`                          |

## 八、关键约束（硬性，必须遵守）

1. 所有登录密码**必须前端SM2加密**，严禁明文
2. `validCodeReqNo` 必须与验证码配套传递，前后一致
3. 验证码开关 `captchaOpen` 由系统配置接口获取，**禁止硬编码**
4. 短信 / 邮箱获取验证码按钮自带 60s 倒计时防重复点击
5. C端接口统一前缀 `/auth/c/`
6. B端 / C端 token、用户信息 key 必须严格分离，不可混用
