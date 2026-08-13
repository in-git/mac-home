---
name: apple-ui-form-skill
description: Apple HIG表单组件规范Skill，基于废弃AppleFormShowcase沉淀，包含设计Token、明暗主题样式、全部表单控件参数、状态规则、Tailwind编码约束、壁纸中心文本配色规范
version: 1.0.0
tags:
  - Apple HIG
  - macOS Sonoma
  - iOS UI
  - 表单组件规范
  - Tailwind样式约束
  - 苹果风格UI
---
# Skill：Apple UI 表单组件规范
## 适用场景
开发人员需要复刻苹果风格表单控件、查询组件样式Token、默认参数、交互状态、Tailwind编码规范、壁纸弹窗文本配色规则时启用。严格依照文档规范输出，不得擅自修改尺寸、色值、编码约束。

## 前置说明
规范来源：原组件`AppleFormShowcase`，组件已移除，设计参数固化为本规范；遵循Apple HIG macOS Sonoma / iOS 设计标准。

## 一、设计总览（Design Tokens）
| 维度 | 规范 |
| ---- | ---- |
| 圆角 | 统一 `12px`（分段控制器、输入框、选择器、按钮），Pill容器内部元素 `10px` |
| 底色 | 哑光磨砂：`bg-black/5 dark:bg-white/10`，hover `bg-black/10 dark:bg-white/15` |
| 边框 | 不使用生硬实体描边；聚焦态采用柔光环 `ring-2 ring-[#007AFF]/50` |
| 主色 | Apple蓝 `#007AFF`，hover加深 `bg-blue-600` |
| 正文文字 | `text-slate-800 dark:text-slate-100` |
| 辅助文字 | `text-slate-400/500` |
| 文本动态规则 | 禁止硬编码十六进制色值；文本使用语义化Tailwind类；强调文本统一 `text-[color:var(--accent)]` |
| 字号约束 | 使用语义阶梯 `text-xs`/`text-sm`；**禁止写死像素字号 text-[xxpx]** |
| 动画约束 | 禁止全局`transition-all`；按钮 `active:scale-95`；弹窗入场 `animate-in fade-in slide-in-from-top-1` |

## 二、控件状态 simulatedState
枚举：`'default' | 'hover' | 'focus' | 'disabled' | 'error'`
1. disabled：`opacity-50 cursor-not-allowed pointer-events-none`
2. error：输入容器 `bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50`，附带错误提示「格式不正确」
3. focus：柔光蓝色环 `ring-2 ring-[#007AFF]/50`
4. hover：底色加深

## 三、表单初始默认值 FormDemoState
```ts
const defaultFormState = {
  singleInput: '库克 (Tim Cook)',
  multiText:
    '这是 Apple HIG macOS Sonoma & iOS 规范表单组件。无粗边框、无强烈对比度，采用 12px 哑光圆角与柔和蓝光。',
  selectValue: 'macos-sonoma',
  checkboxVal: true,
  toggleVal: true,
  radioVal: 'standard',
  numberVal: 42,
  sliderVal: 75,
  segmentedVal: 'overview',
  simulatedState: 'default',
};