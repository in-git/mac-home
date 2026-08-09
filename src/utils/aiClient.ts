/**
 * 前端直连 AI 模型的工具函数。
 *
 * 与后端 /public/ai/chat 通道不同，这里直接以 OpenAI 兼容协议
 * 请求各厂商的 Chat Completions 接口，用于在「系统设置 → AI」中
 * 配置并测试模型，也供后续需要直连模型的功能复用。
 *
 * 注意：纯前端直连会把 API Key 暴露在浏览器，仅适用于个人本机使用。
 */
import type { AIConfig } from '../types';

/** 解析出最终要请求的 baseURL（自定义优先于厂商预设） */
export function resolveBaseURL(config: AIConfig): string {
  const url = (config.baseURL || '').trim().replace(/\/+$/, '');
  return url || 'https://api.openai.com/v1';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamHandlers {
  onToken?: (delta: string) => void;
  onDone?: (full: string) => void;
  onError?: (err: Error) => void;
}

/** 一次性（非流式）请求，返回完整回复文本 */
export async function askOnce(
  config: AIConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const baseURL = resolveBaseURL(config);
  const model = (config.model || '').trim() || 'gpt-4o-mini';
  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey || ''}`,
    },
    signal,
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message || JSON.stringify(errBody);
    } catch {
      detail = await res.text();
    }
    throw new Error(`HTTP ${res.status}：${detail || res.statusText}`);
  }

  const data = await res.json();
  // 兼容 OpenAI / 各厂商返回结构
  const content: string =
    data?.choices?.[0]?.message?.content ??
    data?.output ?? // 部分厂商（如智谱）字段不同
    '';
  return content.trim();
}

/**
 * 测试连接：发一条最小请求，验证 baseURL / key / model 是否可用。
 * 返回 { ok, message }。
 */
export async function testConnection(
  config: AIConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const reply = await askOnce(
      config,
      [{ role: 'user', content: 'ping' }],
      // 测试请求 15s 超时
      new AbortController().signal,
    );
    if (!reply) {
      return { ok: false, message: '已连通，但模型未返回内容（请检查模型名）' };
    }
    return { ok: true, message: '连接成功 ✓' };
  } catch (e) {
    return {
      ok: false,
      message: `连接失败：${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
