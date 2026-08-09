import { Check, ExternalLink, Key, Loader2, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AI_PROVIDERS } from '../../../types';
import { testConnection } from '../../../utils/aiClient';
import type { AIPanelProps } from '../types';

/**
 * AI 对接面板：参照 macOS 系统设置的卡片分组布局。
 * 支持选择主流厂商、填写 API Key、自定义 BaseURL 与模型名，并可测试连接。
 * 纯展示组件，配置读写由 index.tsx 通过 props 传入。
 */
export const AIPanel: React.FC<AIPanelProps> = ({ config, onChange }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);

  const selected = AI_PROVIDERS.find((p) => p.id === config.provider);
  const isCustom = config.provider === 'custom';

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

  // 当配置变化时清除旧测试结果
  useEffect(() => {
    setTestResult(null);
  }, [config.provider, config.baseURL, config.apiKey, config.model]);

  return (
    <div className=" px-5 py-6 space-y-8">
      {/* 大标题 */}
      <h2 className="text-font-lg font-bold tracking-tight">AI</h2>

      {/* 提示 */}
      <div className="flex items-start space-x-2.5 rounded-xl bg-[#007AFF]/10 dark:bg-[#007AFF]/15 p-3 text-xs text-[#007AFF] dark:text-[#5AC8FA]">
        <Sparkles size={15} className="mt-0.5 shrink-0" />
        <span>
          选择厂商并填写 API Key 后，可让本机的 AI 助手直接调用对应模型。自定义模式支持任意兼容
          OpenAI 协议的接口（如本地 Ollama、vLLM）。配置保存在本机，不会上传。
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
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors active:scale-95 ${
                  active
                    ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF] dark:text-white'
                    : 'border-black/10 dark:border-white/15 hover:bg-black/[0.03] dark:hover:bg-white/5'
                }`}
              >
                <span>{p.label}</span>
                {active && <Check size={14} className="text-[#007AFF]" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* API Key */}
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
              className="w-full pl-9 pr-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder:text-slate-400"
            />
          </div>
          {selected?.docs && !isCustom && (
            <a
              href={selected.docs}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-xs text-slate-500 hover:text-[#007AFF] transition-colors whitespace-nowrap"
              title="获取 API Key"
            >
              <ExternalLink size={13} />
              <span>获取</span>
            </a>
          )}
        </div>
      </section>

      {/* 自定义 BaseURL（仅自定义厂商时显示） */}
      {isCustom && (
        <section>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
            接口地址 (Base URL)
          </h3>
          <input
            type="text"
            value={config.baseURL}
            onChange={(e) => onChange({ baseURL: e.target.value })}
            placeholder="https://your-endpoint/v1"
            className="w-full px-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder:text-slate-400"
          />
          <p className="mt-2 text-xs text-slate-400">
            例如本地 Ollama：http://localhost:11434/v1
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
          className="w-full px-3 py-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#007AFF]/50 placeholder:text-slate-400"
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
            disabled={testing || !config.apiKey || !config.model}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#0071EB] active:scale-[0.98] transition-colors disabled:opacity-40 disabled:pointer-events-none"
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
      </section>
    </div>
  );
};
