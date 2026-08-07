# AI 大模型对接文档

## 一、接口

| 方法 | 路径              | 鉴权         | 说明                                |
| ---- | ----------------- | ------------ | ----------------------------------- |
| POST | `/public/ai/chat` | 无（免登录） | 多轮对话(同步)，Ollama 兼容协议透传 |

## 二、请求

`POST /public/ai/chat`，请求头 `Content-Type: application/json`

| 字段         | 类型     | 必填 | 说明                                                              |
| ------------ | -------- | ---- | ----------------------------------------------------------------- |
| `model`      | string   | 否   | 模型名，不传走 `ai.ollama.default-model`（默认 `qwen2.5:3b`）     |
| `messages`   | object[] | 是   | 消息列表，多轮对话要把历史 user / assistant 一起回传              |
| `stream`     | bool     | 否   | 后端强制改为 `false`（同步接口），前端传啥都被覆盖                |
| `format`     | string   | 否   | `json` 强制 JSON 输出                                             |
| `options`    | object   | 否   | 模型参数（`temperature` / `top_p` / `top_k` / `num_predict` ...） |
| `keep_alive` | string   | 否   | 模型在显存中保留时长，默认 `5m`                                   |
| `tools`      | object[] | 否   | 工具调用定义                                                      |

`messages` 单条结构：

| 字段         | 类型     | 必填 | 说明                                     |
| ------------ | -------- | ---- | ---------------------------------------- |
| `role`       | string   | 是   | `system` / `user` / `assistant` / `tool` |
| `content`    | string   | 是   | 文本内容                                 |
| `images`     | string[] | 否   | base64 图片（多模态）                    |
| `tool_calls` | object[] | 否   | 工具调用                                 |

请求示例：

```json
{
  "model": "qwen2.5:3b",
  "messages": [{ "role": "user", "content": "你好" }]
}
```

## 三、响应

`CommonResult<String>`，**`data` 字段是 Ollama 网关返回的原始 JSON 字符串**，前端需要 `JSON.parse(res.data)`。

```json
{
  "code": 200,
  "message": "操作成功",
  "data": "{\"model\":\"qwen2.5:3b\",\"created_at\":\"2025-08-04T10:00:00.000Z\",\"message\":{\"role\":\"assistant\",\"content\":\"你好，我是大模型。\"},\"done\":true,\"done_reason\":\"stop\",\"total_duration\":800000000,\"prompt_eval_count\":20,\"eval_count\":12,\"eval_duration\":700000000}"
}
```

`data` 解析后的关键字段：

| 字段                 | 类型     | 说明                       |
| -------------------- | -------- | -------------------------- |
| `message.role`       | string   | 固定 `assistant`           |
| `message.content`    | string   | 回复正文                   |
| `message.tool_calls` | object[] | 工具调用（若有）           |
| `done`               | bool     | 是否结束                   |
| `done_reason`        | string   | `stop` / `length` / `load` |
| `total_duration`     | long     | 总耗时（纳秒）             |
| `prompt_eval_count`  | int      | prompt token 数            |
| `eval_count`         | int      | 生成 token 数              |

## 四、调用示例

```bash
curl -X POST http://localhost:82/public/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "qwen2.5:3b",
    "messages": [{"role":"user","content":"你好"}]
  }'
```

```js
import http from '@/utils/http';

const res = await http.post('/public/ai/chat', {
  model: 'qwen2.5:3b',
  messages: [{ role: 'user', content: '你好' }],
});
// res.data 是字符串, 需要 JSON.parse 一次
const ollamaResp = JSON.parse(res.data);
console.log(ollamaResp.message?.content);
```

## 五、错误码

| 场景                                | HTTP | `message` 示例                             |
| ----------------------------------- | ---- | ------------------------------------------ |
| Ollama 网关不可达                   | 500  | `AI 大模型调用失败: Connection refused`    |
| Ollama 网关 4xx/5xx                 | 500  | `AI 网关返回异常, status=<s>, body=<...>`  |
| 请求体不是合法 JSON                 | 500  | `请求体不是合法 JSON: Unexpected token...` |
| `ai.ollama.base-url` 未配置         | 500  | `AI 大模型 BASE_URL 未配置...`             |
| Ollama 网关业务错误（模型不存在等） | 200  | 原样放在 `data` 字符串里，`code=200`       |

## 六、硬约束

1. **不传 `model` 走 `ai.ollama.default-model`**，前端别 hardcode
2. **多轮对话要保留完整 `messages` 数组**，Ollama 本身无状态
3. **`/public/**` 全部免登录\*\*，新接口直接挂这下面，不要重复加白名单
4. **同步接口 `data` 是字符串**，前端要 `JSON.parse` 一次
5. **超时 300s**（`ai.ollama.timeout-read`），loading 文案要友好
