import { AgentChatMessage, sendAgentChat } from '@/agent/chat';
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
import { listAgentTools } from '../agent';

// 把 agent 工具清单格式化为大模型可理解的「可调用函数」描述
const TOOLS = listAgentTools();

interface AgentTestWidgetProps {
  isDarkMode?: boolean;
  /** 是否处于全屏（最大化）状态，用于铺满布局 */
  expanded?: boolean;
}

export const AgentTestWidget: React.FC<AgentTestWidgetProps> = ({
  isDarkMode = false,
  expanded = false,
}) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
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

    const userMsg: AgentChatMessage = {
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

    try {
      const replyMsgs = await sendAgentChat({
        history: newHistory,
        userInput: trimmed,
        model,
      });
      setMessages((prev) => [...prev, ...replyMsgs]);

      // 提取最新的 assistant 文本回复发送给桌宠气泡显示
      const lastAssistantMsg = [...replyMsgs]
        .reverse()
        .find((m) => m.role === 'assistant' && m.content && !m.error);
      if (lastAssistantMsg) {
        window.dispatchEvent(
          new CustomEvent('role-dialog-speak', {
            detail: { text: lastAssistantMsg.content },
          }),
        );
      }
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
        className={`flex-1 overflow-y-auto my-2 pr-1 space-y-3 min-h-0 text-xs select-text scrollbar-thin ${
          expanded ? '' : 'max-h-[400px]'
        }`}
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
