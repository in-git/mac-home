/**
 * AI 对接配置项
 *
 * 这里集中维护「系统设置 → AI」所需的全部类型与默认值：
 * - AIProvider / AI_PROVIDERS：内置主流厂商预设（含自定义与本地大模型）
 * - AIConfig / DEFAULT_AI_CONFIG：用户在设置中保存的大模型配置（持久化到本机）
 *
 * 通过 src/types.ts 重新导出，业务侧仍可从 '@/types' 引入，无需改动引用点。
 */

/** 内置主流 AI 厂商（OpenAI 兼容接口） */
export interface AIProvider {
    /** 唯一标识 */
    id: string;
    /** 展示名 */
    label: string;
    /** API Base URL（不含末尾 /chat/completions）。本地大模型为后端相对路径 */
    baseURL: string;
    /** 该厂商推荐的默认模型名 */
    defaultModel: string;
    /** 官网/文档地址，便于用户获取 KEY */
    docs?: string;
}
// 前端走同源相对路径，由 dev server 的 proxy 转发到后端，不暴露真实后端地址
const host = ''
/** 内置主流厂商预设 */
export const AI_PROVIDERS: AIProvider[] = [
    {
        id: 'local',
        label: '本地大模型',
        // 走本机后端通道（同源 /api/public/ai/chat），由后端对接本地 Ollama 等
        baseURL: host + '/api/public/ai/chat',
        defaultModel: 'qwen2.5:3b',
    },
    {
        id: 'openai',
        label: 'OpenAI',
        baseURL: 'https://api.openai.com/v1/chat/completions',
        defaultModel: 'gpt-4o-mini',
        docs: 'https://platform.openai.com/api-keys',
    },
    {
        id: 'deepseek',
        label: 'DeepSeek',
        baseURL: 'https://api.deepseek.com/v1/chat/completions',
        defaultModel: 'deepseek-chat',
        docs: 'https://platform.deepseek.com/api_keys',
    },
    {
        id: 'qwen',
        label: '通义千问',
        baseURL:
            'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        defaultModel: 'qwen-plus',
        docs: 'https://dashscope.console.aliyun.com/apiKey',
    },
    {
        id: 'moonshot',
        label: 'Kimi (Moonshot)',
        baseURL: 'https://api.moonshot.cn/v1/chat/completions',
        defaultModel: 'moonshot-v1-8k',
        docs: 'https://platform.moonshot.cn/console/api-keys',
    },
    {
        id: 'zhipu',
        label: '智谱 GLM',
        baseURL: 'https://open.bigmodel.cn/api/paitext/v1/chat/completions',
        defaultModel: 'glm-4-flash',
        docs: 'https://open.bigmodel.cn/usercenter/apikeys',
    },
    {
        id: 'anthropic',
        label: 'Claude (Azure/Official)',
        baseURL: 'https://api.anthropic.com/v1/chat/completions',
        defaultModel: 'claude-3-5-sonnet',
        docs: 'https://console.anthropic.com/settings/keys',
    },
    {
        id: 'gemini',
        label: 'Gemini',
        baseURL:
            'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        defaultModel: 'gemini-1.5-flash',
        docs: 'https://aistudio.google.com/app/apikey',
    },
    {
        id: 'custom',
        label: '自定义',
        baseURL: '',
        defaultModel: '',
    },

];

/** 用户在设置中保存的 AI 对接配置 */
export interface AIConfig {
    /** 选中的厂商 id（含 'custom' / 'local'） */
    provider: string;
    /** 自定义厂商的 Base URL（当 provider==='custom' 或覆盖时使用） */
    baseURL: string;
    /** API Key */
    apiKey: string;
    /** 模型名（可手写，支持任意模型） */
    model: string;
}

/** AI 配置默认值：默认对接本地大模型（走本机后端通道 /api/public/ai/chat） */
export const DEFAULT_AI_CONFIG: AIConfig = {
    provider: 'local',
    baseURL: host + '/api/public/ai/chat',
    apiKey: '',
    model: 'qwen2.5:3b',
};
