/**
 * 前端直连 AI 模型的工具函数。
 *
 * 与后端 /public/ai/chat 通道不同，这里直接以 OpenAI 兼容协议
 * 请求各厂商的 Chat Completions 接口，用于在「系统设置 → AI」中
 * 配置并测试模型，也供后续需要直连模型的功能复用。
 *
 * 注意：纯前端直连会把 API Key 暴露在浏览器，仅适用于个人本机使用。
 */
import type { AIConfig } from '../agent/config/aiConfig';
import { DEFAULT_AI_CONFIG } from '../agent/config/aiConfig';
import { executeAgentTool } from '../agent/index';
import { ChatUtils } from './chatUtils';
import { request, API_ENDPOINTS } from './request';

// 复用 chatUtils 的系统提示词构建（含真实工具列表与 ReAct 规则）
const chatUtils = new ChatUtils();

/**
 * 解析出最终要请求的地址。
 * 注意：baseURL 即完整请求地址，不再自动追加 /chat/completions 后缀，
 * 由用户在「系统设置 → AI」中填写完整路径（如 .../v1/chat/completions
 * 或本机后端通道 /public/ai/chat）。
 */
export function resolveBaseURL(config: AIConfig): string {
    const url = (config.baseURL || '').trim().replace(/\/+$/, '');
    return url || 'https://api.openai.com/v1/chat/completions';
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
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
    const model = (config.model || '').trim() || DEFAULT_AI_CONFIG.model;
    // 直接请求用户配置的完整地址（不再自动追加 /chat/completions 后缀）
    const res = await fetch(baseURL, {
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
 * 模型原始返回的标准结构（与 chatUtils.makeSystemPrompt 约定的格式一致）：
 * { tasks: [{type:'text'|'tool', content}], continue: boolean }
 */
interface PetModelResponse {
    tasks: Array<{
        type: 'text' | 'tool';
        content: string | { name: string; args: Record<string, unknown> };
    }>;
    continue: boolean;
}

/**
 * 把模型原始回复文本清洗为可执行的 PetModelResponse。
 * - 合法 JSON：直接取出 tasks / continue；
 * - 非 JSON：整段作为单条 text 任务兜底，continue=false。
 */
function parseModelResponse(raw: string): PetModelResponse {
    const text = (raw || '').trim();
    if (!text) {
        return { tasks: [], continue: false };
    }
    try {
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.tasks)) {
            return {
                tasks: parsed.tasks,
                continue: parsed.continue === true,
            };
        }
        // 结构不完整也兜底成纯文本
        return { tasks: [{ type: 'text', content: text }], continue: false };
    } catch {
        return { tasks: [{ type: 'text', content: text }], continue: false };
    }
}

/**
 * 桌宠对话（ReAct 闭环）：
 *  1. 内置系统提示词 → 向模型发起对话；
 *  2. 清洗模型返回为 { tasks, continue } 可执行结构；
 *  3. 拆分任务：type='text' 让桌宠弹出气泡；type='tool' 立即执行；
 *  4. continue=true 时把工具结果回填上下文，再用模型发起下一轮对话
 *     （对应 agentChatTool「继续追问 / 整合信息」的语义），直到 continue=false
 *     或达到最大轮数上限，防止无限循环。
 *
 * @param config    AI 配置（baseURL / apiKey / model）
 * @param userInput 用户当前输入
 * @param history   可选的历史对话（不含 system），用于多轮上下文
 * @param signal    可中断信号的 AbortSignal
 * @returns 供 UI 面板展示的 assistant 回复文本
 */
export async function chatWithPet(
    config: AIConfig,
    userInput: string,
    history: ChatMessage[] = [],
    signal?: AbortSignal,
    maxRounds = 6,
): Promise<string> {
    // 防御性清洗：本项目采用自定义 JSON 协议（非 OpenAI 标准 tool_calls）。
    // 历史中若混入 role:'tool' 消息，多数 OpenAI 兼容端点会因其前缺少带
    // tool_calls 的 assistant 而返回 400。故只保留 user/assistant 文本角色，
    // 并剔除 system（避免重复系统提示词）。
    const safeHistory: ChatMessage[] = history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

    const messages: ChatMessage[] = [
        { role: 'system', content: chatUtils.makeSystemPrompt() },
        ...safeHistory,
        { role: 'user', content: userInput },
    ];

    let lastText = '';

    for (let round = 0; round < maxRounds; round++) {
        // 1. 向模型发起对话
        // 本地大模型（默认 provider=local）走后端 /public/ai/chat 通道，
        // 与其他 OpenAI 兼容厂商的前端直连区分开：本地通道返回 ollama 风格
        // 结构（data 内为 ollama 响应的 JSON 字符串），需经 normalizeReply 解析。
        let raw: string;
        if (config.provider === 'local') {
            const payload = {
                model: config.model?.trim() || undefined,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
            };
            const data = await request.post<string>(
                API_ENDPOINTS.aiChat,
                payload,
                { signal },
            );
            raw = chatUtils.normalizeReply(data);
        } else {
            raw = await askOnce(config, messages, signal);
        }
        // 2. 清洗数据，转成可执行结构
        const { tasks, continue: shouldContinue } = parseModelResponse(raw);

        // 3. 拆分任务：text 弹气泡，tool 执行
        for (const t of tasks) {
            if (t.type === 'text') {
                const text = typeof t.content === 'string' ? t.content : '';
                if (text) {
                    lastText = text;
                    window.dispatchEvent(
                        new CustomEvent('role-dialog-speak', { detail: { text } }),
                    );
                }
            } else if (t.type === 'tool') {
                const { name, args } = typeof t.content === 'object'
                    ? t.content
                    : { name: '', args: {} };
                if (name) {
                    const res = await executeAgentTool({ name, args: args ?? {} });
                
                    messages.push({
                        role: 'user',
                        content: `已调用工具「${name}」，返回结果如下：\n${res.message}`,
                    });
                }
            }
        }

        // 4. 模型决定不再继续 → 结束本轮对话
        if (!shouldContinue) {
            break;
        }
    }

    return lastText || '（没有收到可展示的回复。）';
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
