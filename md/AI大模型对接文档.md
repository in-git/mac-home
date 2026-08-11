# Ollama 云端部署 · 对接文档

基于 [Ollama](https://github.com/ollama/ollama) 的本地大模型运行时，已通过 AgentOS 发布到公网，并附带一个苹果风格的控制台（对话演示 + 本文档）。

> **服务地址**：将下方示例中的 `BASE_URL` 替换为你的分享链接即可。  
> 所有 Ollama 原生 API 均挂载在 `BASE_URL/api/...` 下。

---

## 1. 架构一览

```
公网用户 ──HTTPS──▶ AgentOS 分享链接 (PORT)
                       │
                       ▼
                  FastAPI 网关 (本仓库 ollama-gateway)
                       │  反向代理 /api/*
                       ▼
             Ollama 运行时 (127.0.0.1:11434，仅本机)
                       │
                       ▼
                   本地模型权重 (/root/.ollama)
```

- 原始 Ollama 仅监听本机，外部只能经由网关访问，更安全。
- 网关同时托管控制台页面（访问分享链接根路径 `/` 即可看到）。

---

## 2. 快速开始

```bash
# 健康检查
curl https://a46120a2561f5ff2c.gz1.agentos-app.net/healthz

# 查看版本
curl https://a46120a2561f5ff2c.gz1.agentos-app.net/api/version

# 列出已加载模型
curl https://a46120a2561f5ff2c.gz1.agentos-app.net/api/tags
```

---

## 3. API 速查

| 方法     | 路径                | 说明                        |
| ------ | ----------------- | ------------------------- |
| GET    | `/api/version`    | 服务版本                      |
| POST   | `/api/generate`   | 单次文本生成                    |
| POST   | `/api/chat`       | 多轮对话（支持 `stream:true` 流式） |
| POST   | `/api/embeddings` | 文本向量化                     |
| POST   | `/api/show`       | 查看模型详情 / Modelfile        |
| DELETE | `/api/delete`     | 删除模型                      |

> 已移除的公开接口：`/api/tags`、`/api/pull`、`/api/ps`。模型管理请在部署机上用 `ollama` CLI 操作。

完整参数见 Ollama 官方文档：<https://github.com/ollama/ollama/blob/main/docs/api.md>

---

## 4. 调用示例

### 4.1 curl

```bash
# 对话（流式，逐 token 返回）
curl -N https://a46120a2561f5ff2c.gz1.agentos-app.net/api/chat -d '{
  "model": "qwen2.5:3b",
  "messages": [{"role":"user","content":"用一句话解释什么是大模型"}],
  "stream": true
}'

# 单次生成
curl https://a46120a2561f5ff2c.gz1.agentos-app.net/api/generate -d '{
  "model": "qwen2.5:3b",
  "prompt": "写一首关于夏天的短诗",
  "stream": false
}'

# 向量化
curl https://a46120a2561f5ff2c.gz1.agentos-app.net/api/embeddings -d '{
  "model": "qwen2.5:3b",
  "prompt": "你好，世界"
}'
```

### 4.2 Python（标准库即可，无额外依赖）

```python
import requests

BASE = "https://a46120a2561f5ff2c.gz1.agentos-app.net"

# 非流式对话
r = requests.post(f"{BASE}/api/chat", json={
    "model": "qwen2.5:3b",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": False,
}, timeout=120)
print(r.json()["message"]["content"])

# 流式对话
with requests.post(f"{BASE}/api/chat", json={
    "model": "qwen2.5:3b",
    "messages": [{"role": "user", "content": "讲个冷笑话"}],
    "stream": True,
}, stream=True, timeout=120) as r:
    for line in r.iter_lines():
        if line:
            print(line)
```

### 4.3 Python（官方 ollama SDK）

```bash
pip install ollama
```

```python
from ollama import Client

c = Client(host="https://a46120a2561f5ff2c.gz1.agentos-app.net")
print(c.chat(model="qwen2.5:3b",
             messages=[{"role": "user", "content": "你好"}]).message.content)
```

### 4.4 JavaScript / Node

```js
const res = await fetch("https://a46120a2561f5ff2c.gz1.agentos-app.net/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "qwen2.5:3b",
    messages: [{ role: "user", content: "你好" }],
    stream: false,
  }),
});
const data = await res.json();
console.log(data.message.content);
```

---

## 5. 本地自建（可选）

```bash
# 1. 安装 Ollama（Linux）
curl -fsSL https://ollama.com/install.sh | sh

# 2. 拉取模型
ollama pull qwen2.5:3b

# 3. 启动网关
cd ollama-gateway
pip install -r requirements.txt
PORT=8000 OLLAMA_HOST=127.0.0.1:11434 bash start.sh
# 然后访问 http://localhost:8000
```

---

## 6. 安全提示

- 网关默认**无任何鉴权**，任何拿到分享链接的人都可调用模型并拉取模型。  
  如需鉴权，请在网关 `main.py` 的代理路由前增加 API Key / 鉴权中间件。
- 不要在公网暴露原始 Ollama 端口（11434）；本方案已将其限制为本机。
- 模型权重与对话内容均存储在部署机本地，请注意数据合规。
