import { Bot, RefreshCw, Send, Sparkles, Trash2, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from '../utils/request';


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  error?: boolean;
}

// 后端地址由 src/utils/request.ts 统一拼接（baseURL + API_ENDPOINTS.aiChat）

interface AiChatWidgetProps {
  isDarkMode?: boolean;
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({
  isDarkMode = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 AI 大模型助手，有什么我可以帮你的吗？',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model] = useState('qwen2.5:3b');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleClear = () => {
    
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: '对话记录已清空。随时向我提问吧！',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    // 构建符合 /public/ai/chat 的 payload
    // 过滤本地开场/错误提示，保留 role 和 content 发送给后端
    const apiMessages = newHistory
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      // 使用 fetch 请求（遵循后端响应规范：统一解包 data、非 200 抛错、401 跳转登录）
      const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
      const token = localStorage.getItem('token');
      const res = await fetch(`${baseURL}${API_ENDPOINTS.aiChat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model: model.trim() || undefined,
          messages: apiMessages,
        }),
      });

      const body = await res.json();
      // 非标准结构（直接返回数据）原样透传
      if (body == null || typeof body.code !== 'number') {
        throw new Error('AI 服务响应格式异常');
      }
      // 未授权 → 跳转登录
      if ([401, 1011007, 1011008].includes(body.code)) {
        window.location.href = '/login';
      }
      if (body.code !== 200) {
        throw new Error(body.msg || 'AI 服务请求失败');
      }

      // 根据文档：data 即 CommonResult<String> 的 data 字段（ollama 响应的 JSON 字符串）
      const raw = body.data as string;
      let replyContent = '';
      if (typeof raw === 'string') {
        try {
          const ollamaResp = JSON.parse(raw);
          replyContent = ollamaResp.message?.content || '未获取到回复内容';
        } catch {
          replyContent = raw || '未获取到回复内容';
        }
      } else if (raw && typeof raw === 'object') {
        replyContent = (raw as any).message?.content || '未获取到回复内容';
      } else {
        replyContent = '未获取到回复内容';
      }

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `调用失败: ${err.message || '无法连接到 AI 服务'}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 p-1 ${
        isDarkMode ? 'bg-black' : ''
      }`}
    >
      {/* 顶部工具栏：标识与模型名/清空 */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10 shrink-0">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Sparkles size={13} className="text-[#007AFF]" />
          <span>AI 助手</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* 模型名切换或指示 */}
          <span className="text-font-sm px-2 py-0.5 rounded-[8px] bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
            {model}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-slate-400 hover:text-red-500 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="清空对话历史"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* 消息列表区域（按 Apple HIG 通透模糊设计） */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto my-2 pr-1 space-y-3 min-h-0 max-h-[400px] text-xs select-text scrollbar-thin"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
            >
              {/* 头像 */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-[#007AFF] text-white'
                    : msg.error
                      ? 'bg-red-500 text-white'
                      : 'bg-emerald-500 text-white'
                }`}
              >
                {isUser ? <User size={13} /> : <Bot size={13} />}
              </div>

              {/* 气泡 */}
              <div
                className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-2.5 rounded-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#007AFF] text-white rounded-tr-xs shadow-xs'
                      : msg.error
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-tl-xs border border-red-200 dark:border-red-800/40'
                        : 'bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-font-sm text-slate-400 mt-1 px-0.5">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Bot size={13} />
            </div>
            <div className="px-3 py-2 bg-black/5 dark:bg-white/10 rounded-[14px] rounded-tl-xs flex items-center space-x-1.5">
              <RefreshCw size={12} className="animate-spin text-[#007AFF]" />
              <span className="text-slate-500 dark:text-slate-400">
                正在思考回复中...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 底部发送表单（遵循 12px 圆角 + 哑光底色 + Focus 蓝光圈） */}
      <form onSubmit={handleSend} className="shrink-0 pt-1">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息，按 Enter 发送..."
            disabled={loading}
            className="w-full pl-3 pr-20 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 rounded-[12px] transition-colors outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 px-3 py-1.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-[10px] text-xs font-medium transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center space-x-1 shadow-xs"
          >
            <span>发送</span>
            <Send size={11} />
          </button>
        </div>
      </form>
    </div>
  );
};
