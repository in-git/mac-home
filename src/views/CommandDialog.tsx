import type { AgentChatMessage } from '@/agent/chat';
import { sendAgentChat } from '@/agent/chat';
import { Bot, RefreshCw, Send, Sparkles, User, Wrench } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function now(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 按 Enter 弹出的「和桌宠对话」输入框。
 * 复用 src/agent/chat 的 sendAgentChat 走 Agent ReAct 循环：
 * 输入内容 → 大模型返回（可调用系统工具）→ 回复展示在面板中，
 * 同时通过 role-dialog-speak 事件让桌宠头上气泡同步显示最终回复。
 */
export const CommandDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Esc 关闭 + 打开时自动聚焦输入框
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 新消息/加载状态变化时自动滚动到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: AgentChatMessage = {
      id: 'cmd-user-' + Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: now(),
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const replyMsgs = await sendAgentChat({
        history: newHistory,
        userInput: trimmed,
      });
      setMessages((prev) => [...prev, ...replyMsgs]);

      // 把最终 AI 文本回复同步给桌宠气泡显示
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
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center pb-24 px-4 bg-black/20 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl border border-white/50 dark:border-white/15 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col"
        >
          {/* 顶部：宠物对话标题栏 */}
          <div className="flex items-center px-4 py-3 border-b border-black/5 dark:border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#007AFF]" />
                和桌宠聊天
              </div>
              <div className="text-[11px] text-slate-400">
                试试「开启黑暗模式」「记一条便签」…
              </div>
            </div>
            <span className="text-xs text-nowrap text-slate-400 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
              ESC 退出
            </span>
          </div>

          {/* 消息列表 */}
          <div
            ref={scrollRef}
            className="max-h-[40vh] overflow-y-auto p-3 space-y-3 text-xs min-h-0 select-text"
          >
            {messages.length === 0 && (
              <div className="text-center text-slate-400 dark:text-slate-500 py-8">
                按下 Enter 输入内容，桌宠会回复你哦~
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === 'tool') {
                return (
                  <div key={msg.id} className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Wrench size={12} />
                    </div>
                    <div className="max-w-[85%] px-2.5 py-2 rounded-[12px] rounded-tl-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 leading-relaxed break-words whitespace-pre-wrap">
                      <div className="font-semibold flex items-center gap-1">
                        <Wrench size={11} />
                        {msg.toolName}
                      </div>
                      <div
                        className={
                          msg.toolOk
                            ? 'text-emerald-600 dark:text-emerald-400 mt-0.5'
                            : 'text-red-600 dark:text-red-400 mt-0.5'
                        }
                      >
                        {msg.content}
                      </div>
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
                    {isUser ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-[14px] leading-relaxed break-words whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#007AFF] text-white rounded-tr-xs shadow-xs'
                        : msg.error
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-tl-xs border border-red-200 dark:border-red-800/40'
                          : 'bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <Bot size={12} />
                </div>
                <div className="px-3 py-2 bg-black/5 dark:bg-white/10 rounded-[14px] rounded-tl-xs flex items-center space-x-1.5">
                  <RefreshCw
                    size={12}
                    className="animate-spin text-[#007AFF]"
                  />
                  <span className="text-slate-500 dark:text-slate-400">
                    桌宠思考中…
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 底部输入框 */}
          <form
            onSubmit={handleSend}
            className="border-t border-black/5 dark:border-white/10 p-3 shrink-0"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="对桌宠说点什么…"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
