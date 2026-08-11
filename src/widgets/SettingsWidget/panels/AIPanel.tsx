import { Check, ExternalLink, Key, Loader2, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  MAX_PET_CHAT_MESSAGES,
  useHomeStore,
} from '../../../store/useHomeStore';
import { AI_PROVIDERS } from '../../../types';
import { chatWithPet, testConnection } from '../../../utils/aiClient';
import type { AIPanelProps } from '../types';

/**
 * AI 对接面板：参照 macOS 系统设置的卡片分组布局。
 * 支持选择主流厂商、填写 API Key、自定义 BaseURL 与模型名，并可测试连接。
 * 纯展示组件，配置读写由 index.tsx 通过 props 传入。
 */
export const AIPanel: React.FC<AIPanelProps> = ({ config, onChange }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  // 对话式连接测试
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const [chatReply, setChatReply] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const petChatHistory = useHomeStore((s) => s.petChatHistory);
  const setPetChatHistory = useHomeStore((s) => s.setPetChatHistory);

  const selected = AI_PROVIDERS.find((p) => p.id === config.provider);
  const isCustom = config.provider === 'custom';
  const isLocal = config.provider === 'local';

  // 切换厂商时，自动带出默认 BaseURL 与模型（除非用户已自定义）
  const handleProviderChange = (id: string) => {
    const provider = AI_PROVIDERS.find((p) => p.id === id);
    setTestResult(null);
    if (!provider) return;
    onChange({
      provider: id,
      baseURL: provider.baseURL,
      model: provider.defaultModel,
    });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(config);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  // 对话式连接测试：用桌宠系统提示词真正发一条对话，返回模型回复
  const handleChatTest = async () => {
    const text = chatInput.trim();
    if (!text || chatting) return;
    setChatting(true);
    setChatReply(null);
    setChatError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      // 携带已持久化的桌宠对话历史，让连接测试也能延续上下文；
      // chatWithPet 内部会安全清洗（只保留 user/assistant 文本），不会触发 400。
      const historyForModel: import('../../../utils/aiClient').ChatMessage[] =
        petChatHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      const reply = await chatWithPet(
        config,
        text,
        historyForModel,
        controller.signal,
      );
      if (!reply) {
        setChatError('已连通，但模型未返回内容（请检查模型名）');
      } else {
        setChatReply(reply);
        // 测试成功：把本轮 user + 模型回复写入跨轮历史，便于真正对话时延续
        const userMsg = {
          id: 'ai-test-user-' + Date.now(),
          role: 'user' as const,
          content: text,
          timestamp: new Date().toLocaleTimeString(),
        };
        const assistantMsg = {
          id: 'ai-test-assistant-' + Date.now(),
          role: 'assistant' as const,
          content: reply,
          timestamp: new Date().toLocaleTimeString(),
        };
        setPetChatHistory(
          [...petChatHistory, userMsg, assistantMsg].slice(
            -MAX_PET_CHAT_MESSAGES,
          ),
        );
      }
    } catch (e) {
      setChatError(e instanceof Error ? e.message : String(e));
    } finally {
      clearTimeout(timer);
      setChatting(false);
    }
  };

  // 当配置变化时清除旧测试结果
  useEffect(() => {
    setTestResult(null);
  }, [config.provider, config.baseURL, config.apiKey, config.model]);

  return (
    <div className=" px-5 py-6 space-y-8">
      {/* 大标题 */}
      <h2 className="text-font-lg font-bold tracking-tight">AI</h2>

      {/* 提示 */}
      <div className="flex items-start space-x-2.5 rounded-[var(--card-radius)] bg-[color:var(--accent)]/10 dark:bg-[color:var(--accent)]/15 p-3 text-xs text-[color:var(--accent)] dark:text-[#5AC8FA]">
        <Sparkles size={15} className="mt-0.5 shrink-0" />
        <span>
          选择厂商并填写 API Key 后，可让本机的 AI
          助手直接调用对应模型。自定义模式支持任意兼容 OpenAI 协议的接口（如本地
          Ollama、vLLM）。还可选择「本地大模型」，走本机后端通道对接本地
          Ollama。配置保存在本机，不会上传。
        </span>
      </div>

      {/* 选择模型厂商 */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
          模型厂商
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {AI_PROVIDERS.map((p) => {
            const active = config.provider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-[var(--card-radius)] border text-sm font-medium transition-colors active:scale-95 ${
                  active
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)] dark:text-white'
                    : 'border-black/10 dark:border-white/15 hover:bg-black/[0.03] dark:hover:bg-white/5'
                }`}
              >
                <span>{p.label}</span>
                {active && <Check size={14} className="text-[color:var(--accent)]" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* API Key（本地大模型走后端通道，无需 Key） */}
      {!isLocal && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
            API Key
          </h3>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Key
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => onChange({ apiKey: e.target.value })}
                placeholder="sk-...  （留空则使用后端默认通道）"
                className="w-full pl-9 pr-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-[var(--card-radius)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50 placeholder:text-slate-400"
              />
            </div>
            {selected?.docs && !isCustom && (
              <a
                href={selected.docs}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 px-3 py-2.5 rounded-[var(--card-radius)] bg-black/[0.04] dark:bg-white/[0.06] text-xs text-slate-500 hover:text-[color:var(--accent)] transition-colors whitespace-nowrap"
                title="获取 API Key"
              >
                <ExternalLink size={13} />
                <span>获取</span>
              </a>
            )}
          </div>
        </section>
      )}

      {/* 接口地址：仅自定义厂商可编辑；本地大模型不暴露接口地址 */}
      {isCustom && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
            接口地址 (Base URL)
          </h3>
          <input
            type="text"
            value={config.baseURL}
            onChange={(e) => onChange({ baseURL: e.target.value })}
            placeholder="https://your-endpoint/v1/chat/completions"
            className="w-full px-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-[var(--card-radius)] text-sm font-mono outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50 placeholder:text-slate-400"
          />
          <p className="mt-2 text-xs text-slate-400">
            例如本地 Ollama：http://localhost:11434/v1/chat/completions
          </p>
        </section>
      )}

      {/* 模型名称（可自定义任意模型） */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
          模型名称
        </h3>
        <input
          type="text"
          value={config.model}
          onChange={(e) => onChange({ model: e.target.value })}
          placeholder="例如 gpt-4o-mini / deepseek-chat / qwen-plus"
          className="w-full px-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-[var(--card-radius)] text-sm font-mono outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50 placeholder:text-slate-400"
        />
        <p className="mt-2 text-xs text-slate-400">
          支持该厂商下的任意模型，可手写填入。
        </p>
      </section>

      {/* 测试连接 */}
      <section>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
          连接测试
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTest}
            disabled={testing || !config.model}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-[var(--card-radius)] bg-[color:var(--accent)] text-white text-sm font-medium hover:bg-[color:var(--accent-hover)] active:scale-[0.98] transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {testing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            <span>{testing ? '测试中…' : '测试连接'}</span>
          </button>
          {testResult && (
            <span
              className={`text-sm ${
                testResult.ok ? 'text-[#28C840]' : 'text-[#FF3B30]'
              }`}
            >
              {testResult.message}
            </span>
          )}
        </div>

        {/* 对话式连接测试：输入框 + 发送按钮，验证模型真实对话能力 */}
        <div className="mt-5 space-y-2.5">
          <p className="text-xs text-slate-400">
            对话测试（内置桌宠系统提示词，发送一条真实对话验证模型回复）
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleChatTest();
              }}
              placeholder="对桌宠说点什么…"
              disabled={chatting}
              className="flex-1 px-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-[var(--card-radius)] text-sm outline-none focus:ring-2 focus:ring-[color:var(--accent)]/50 placeholder:text-slate-400 disabled:opacity-50"
            />
            <button
              onClick={handleChatTest}
              disabled={chatting || !chatInput.trim() || !config.model}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-[var(--card-radius)] bg-[color:var(--accent)] text-white text-sm font-medium hover:bg-[color:var(--accent-hover)] active:scale-[0.98] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              {chatting && <Loader2 size={15} className="animate-spin" />}
              <span>{chatting ? '发送中…' : '发送'}</span>
            </button>
          </div>
          {chatReply && (
            <div className="rounded-[var(--card-radius)] bg-black/[0.03] dark:bg-white/[0.06] p-3 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {chatReply}
            </div>
          )}
          {chatError && <p className="text-sm text-[#FF3B30]">{chatError}</p>}
        </div>
      </section>
    </div>
  );
};
