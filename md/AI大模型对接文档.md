# AI 大模型对接文档

底座：云端 Ollama 网关 `https://a46120a2561f5ff2c.gz1.agentos-app.net`，`ai.ollama.base-url` 指向它。

## 一、接口

| 方法 | 路径              | 鉴权         | 说明                          |
| ---- | ----------------- | ------------ | ----------------------------- |
| POST | `/public/ai/chat` | 无（免登录） | 多轮对话（同步），Ollama 协议 |

## 二、请求

`POST /public/ai/chat`，`Content-Type: application/json`

| 字段       | 类型     | 必填 | 说明                                                    |
| ---------- | -------- | ---- | ------------------------------------------------------- |
| `model`    | string   | 否   | 不传走 `ai.ollama.default-model`（默认 `qwen2.5:3b`）    |
| `messages` | object[] | 是   | 多轮对话需回传完整历史 user/assistant                   |
| `stream`   | bool     | 否   | 后端强制 `false`，前端传啥都被覆盖                       |
| `format`   | string   | 否   | `json` 强制 JSON 输出                                   |
| `options`  | object   | 否   | 模型参数（`temperature`/`top_p`/`top_k`/`num_predict`） |
| `tools`    | object[] | 否   | 工具调用定义                                            |

`messages` 单条：

| 字段       | 类型     | 必填 | 说明                                     |
| ---------- | -------- | ---- | ---------------------------------------- |
| `role`     | string   | 是   | `system`/`user`/`assistant`/`tool`       |
| `content`  | string   | 是   | 文本内容                                 |
| `images`   | string[] | 否   | base64 图片（多模态）                    |

```json
{
  "model": "qwen2.5:3b",
  "messages": [{ "role": "user", "content": "你好" }]
}
```

## 三、响应

`data` 是 Ollama 返回的原始 JSON 字符串，前端需 `JSON.parse(res.data)`。

```json
{
  "code": 200,
  "message": "操作成功",
  "data": "{\"message\":{\"role\":\"assistant\",\"content\":\"你好\"},\"done\":true}"
}
```

解析后关键字段：

| 字段              | 类型     | 说明                       |
| ----------------- | -------- | -------------------------- |
| `message.content` | string   | 回复正文                   |
| `message.tool_calls` | object[] | 工具调用（若有）       |
| `done`            | bool     | 是否结束                   |
| `eval_count`      | int      | 生成 token 数              |

## 四、前端示例

```js
import http from '@/utils/http';

const res = await http.post('/public/ai/chat', {
  model: 'qwen2.5:3b',
  messages: [{ role: 'user', content: '你好' }],
});
const ollamaResp = JSON.parse(res.data);
console.log(ollamaResp.message?.content);
```

## 五、错误码

| 场景                       | HTTP | `message` 示例                          |
| -------------------------- | ---- | --------------------------------------- |
| 网关不可达 / 4xx / 5xx     | 500  | `AI 大模型调用失败: ...`                |
| 请求体非合法 JSON          | 500  | `请求体不是合法 JSON: ...`              |
| `ai.ollama.base-url` 未配  | 500  | `AI 大模型 BASE_URL 未配置...`          |
| 网关业务错误（模型不存在） | 200  | 原样放 `data` 字符串，`code=200`        |

## 六、硬约束

1. 不传 `model` 走 `ai.ollama.default-model`，前端别 hardcode。
2. 多轮对话保留完整 `messages` 数组（Ollama 无状态）。
3. `/public/**` 全部免登录，新接口挂此下，勿重复加白名单。
4. 同步接口 `data` 是字符串，前端 `JSON.parse` 一次。
5. 超时 300s，loading 文案要友好。
