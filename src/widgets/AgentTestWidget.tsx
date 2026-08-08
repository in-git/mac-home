import {
  Bot,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  User,
  Wrench,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { request, API_ENDPOINTS } from '../utils/request';
import { playSound } from '../utils/sound';
import { executeAgentTool, listAgentTools, AGENT_TOOLS } from '../agent';

export interface AgentTestMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  error?: boolean;
  // tool 消息专用
  toolName?: string;
  toolArgs?: string;
  toolOk?: boolean;
}

// 把 agent 工具清单格式化为大模型可理解的「可调用函数」描述
const TOOLS = listAgentTools();
const SYSTEM_PROMPT = `你是运行在本系统里的 AI 助手，可以通过调用工具来操作系统设置。
可用工具：
${TOOLS.map(
  (t) =>
    `- ${t.name}：${t.description}\n  参数：${JSON.stringify(t.parameters)}`,
).join('\n')}

规则：
1. 当用户意图明确匹配某个工具时，请只回复一个 JSON 对象（不要任何多余文字、不要 markdown 代码块包裹）：
{"tool":"<工具名>","args":{<参数>}}
2. 参数必须严格符合上述工具的参数定义与类型；需要布尔值的参数（如 enabled）必须显式给出 true/false。
3. 若用户意图不匹配任何工具，请用自然语言正常回答。`;

/**
 * 从大模型回复中提取 JSON 形式的工具调用。
 * 兼容：纯 JSON、被 \`\`\`json 代码块包裹、以及夹带在正文中的 JSON。
 */
function extractToolCall(
  content: string,
): { tool: string; args: Record<string, unknown> } | null {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // 非贪婪匹配首个完整 JSON 对象（兼容模型在 JSON 前后夹带文字）
  const brace = text.match(/\{[\s\S]*?\}/);
  if (brace) text = brace[0];
  try {
    const obj = JSON.parse(text);
    if (!obj) return null;
    // 兼容 tool / name 两种字段命名
    const tool = obj.tool ?? obj.name;
    if (typeof tool !== 'string' || tool.length === 0) return null;
    const args =
      obj.args && typeof obj.args === 'object'
        ? (obj.args as Record<string, unknown>)
        : {};
    return { tool, args };
  } catch {
    /* 非 JSON，视为普通对话 */
  }
  return null;
}

interface AgentTestWidgetProps {
  isDarkMode?: boolean;
}

export const AgentTestWidget: React.FC<AgentTestWidgetProps> = ({
  isDarkMode = false,
}) => {
  const [messages, setMessages] = useState<AgentTestMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '你好！这是一个 Agent 测试面板。试着对我说「开启黑暗模式」，我会调用后台大模型并自动执行对应工具。',
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
    playSound.playClick();
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: '对话记录已清空。',
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
    playSound.playClick();

    const userMsg: AgentTestMessage = {
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

    // 组装发给大模型的消息：系统提示 + 历史（过滤开场/错误，排除 system 占位）
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...newHistory
        .filter((m) => !m.error && m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: trimmed },
    ];

    try {
      const raw = await request.post<string>(API_ENDPOINTS.aiChat, {
        model: model.trim() || undefined,
        messages: apiMessages,
      });

      // 后端 data 可能是 ollama 响应的 JSON 字符串，也可能是已解析的对象。
      let replyContent = '';
      const normalizeReply = (value: unknown): string => {
        if (typeof value === 'string') {
          // 可能是 ollama JSON 字符串，也可能是直接的内容文本
          try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object') {
              const obj = parsed as Record<string, unknown>;
              // ollama 风格：{ message: { content } }
              if (obj.message && typeof obj.message === 'object') {
                const content = (obj.message as Record<string, unknown>).content;
                if (typeof content === 'string') return content;
              }
              // 直接就是工具 JSON（如 {"tool":...}），原样返回以便下一步解析
              return value;
            }
          } catch {
            return value;
          }
          return value;
        }
        if (value && typeof value === 'object') {
          const obj = value as Record<string, unknown>;
          if (obj.message && typeof obj.message === 'object') {
            const content = (obj.message as Record<string, unknown>).content;
            if (typeof content === 'string') return content;
          }
          // 对象本身已是工具调用（如 {"tool":...}）
          try {
            return JSON.stringify(value);
          } catch {
            return '';
          }
        }
        return '';
      };
      replyContent = normalizeReply(raw);

      const call = extractToolCall(replyContent);
      // 兼容工具名前后多余空白 / 大小写差异
      const matchedTool = call
        ? AGENT_TOOLS.find(
            (t) =>
              t.name === call.tool ||
              t.name.trim().toLowerCase() === call.tool.trim().toLowerCase(),
          )
        : undefined;

      if (call && matchedTool) {
        // 命中 agent 工具 → 执行并回显
        const result = await executeAgentTool({ name: matchedTool.name, args: call.args });
        const toolMsg: AgentTestMessage = {
          id: 'tool-' + Date.now(),
          role: 'tool',
          content: result.message,
          toolName: call.tool,
          toolArgs: JSON.stringify(call.args),
          toolOk: result.ok,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, toolMsg]);
      } else {
        const fallbackContent =
          call && !matchedTool
            ? `模型返回了工具调用，但未匹配到已注册功能：tool="${call.tool}"。已注册：${AGENT_TOOLS.map(
                (t) => t.name,
              ).join(', ')}`
            : replyContent || '未获取到回复内容';
        const assistantMsg: AgentTestMessage = {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: fallbackContent,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errorMsg: AgentTestMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `调用失败: ${err?.message || '无法连接到 AI 服务'}`,
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
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10 shrink-0">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Sparkles size={13} className="text-[#007AFF]" />
          <span>Agent 测试</span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className="text-font-sm px-2 py-0.5 rounded-[8px] bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono"
            title={`可调用工具：${TOOLS.map((t) => t.name).join(', ')}`}
          >
            {TOOLS.length} 个工具
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

      {/* 消息列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto my-2 pr-1 space-y-3 min-h-0 max-h-[400px] text-xs select-text scrollbar-thin"
      >
        {messages.map((msg) => {
          if (msg.role === 'tool') {
            return (
              <div key={msg.id} className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Wrench size={13} />
                </div>
                <div className="max-w-[85%] flex flex-col items-start">
                  <div className="p-2.5 rounded-[14px] rounded-tl-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 leading-relaxed break-words whitespace-pre-wrap">
                    <div className="font-semibold flex items-center gap-1">
                      <Wrench size={11} />
                      {msg.toolName}
                    </div>
                    <div className="text-font-sm opacity-70 mt-0.5">
                      参数: {msg.toolArgs}
                    </div>
                    <div
                      className={
                        msg.toolOk
                          ? 'text-emerald-600 dark:text-emerald-400 mt-1'
                          : 'text-red-600 dark:text-red-400 mt-1'
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                  <span className="text-font-sm text-slate-400 mt-1 px-0.5">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
            >
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

      {/* 底部发送表单 */}
      <form onSubmit={handleSend} className="shrink-0 pt-1">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：开启黑暗模式"
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
