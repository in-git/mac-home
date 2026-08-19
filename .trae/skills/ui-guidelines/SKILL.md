---
name: "ui-guidelines"
description: "mac-home 项目仪表盘 UI 开发规范。包含设计 Token（圆角、哑光底色、主色、文本、字号、动画）、表单控件状态、初始默认值与 Tailwind 编码约束。当开发或修改本项目界面组件（widget、卡片、表单、按钮、输入框等）时启用，严格依照规范输出，不得擅自修改尺寸、色值、编码约束。"
version: 1.0.0
tags:
  - mac-home
  - UI 规范
  - 仪表盘
  - 表单组件
  - Tailwind 约束
---

# Skill：mac-home UI 开发规范

## 适用场景
开发或修改本项目（mac-home 仪表盘）的界面组件时启用：包括 widget、卡片、表单控件、查询组件、按钮、输入框、选择器等。严格依照本文规范输出，不得擅自修改尺寸、色值、编码约束。

## 核心约束：文本颜色
- **非特殊强调，文本一律不加颜色**。默认文本使用语义化 Tailwind 文本类（如 `text-slate-900`、`text-white`、`text-slate-500` 等），由明暗主题自动适配。
- **禁止**为普通正文、标签、占位符硬编码十六进制色值或加任意 `text-[color:...]`。
- **仅强调文本**（需要突出的关键数字、主标题、激活态文字等）允许使用项目主色：`text-[color:var(--accent)]`。
- 错误/警示文本是唯一例外，可使用 `text-red-500` 等语义色。

## 一、设计总览（Design Tokens）
| 维度 | 规范 |
| ---- | ---- |
| 圆角 | 统一 `12px`（分段控制器、输入框、选择器、按钮），Pill 容器内部元素 `10px` |
| 底色 | 哑光磨砂：`bg-black/5 dark:bg-white/10`，hover `bg-black/10 dark:bg-white/15` |
| 边框 | 不使用生硬实体描边；聚焦态采用柔光环 `ring-2 ring-[var(--accent)]/50` |
| 主色 | 项目主色 `var(--accent)`（Apple 蓝风格），hover 加深 `bg-[color:var(--accent-hover)]` |
| 文本动态规则 | 禁止硬编码十六进制色值；普通文本用语义化 Tailwind 文本类；仅强调文本用 `text-[color:var(--accent)]`（见上方「核心约束」） |
| 字号约束 | 使用语义阶梯 `text-xs` / `text-sm`；**禁止写死像素字号 `text-[xxpx]`**（个别图标/特定场景允许的例外已在对应组件内约定） |
| 动画约束 | 禁止全局 `transition-all`；按钮 `active:scale-95`；弹窗入场 `animate-in fade-in slide-in-from-top-1` |

## 二、控件状态 simulatedState
枚举：`'default' | 'hover' | 'focus' | 'disabled' | 'error'`
1. disabled：`opacity-50 cursor-not-allowed pointer-events-none`
2. error：输入容器 `bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50`，附带错误提示「格式不正确」
3. focus：柔光主色环 `ring-2 ring-[var(--accent)]/50`
4. hover：底色加深

## 三、表单初始默认值 FormDemoState
```ts
const defaultFormState = {
  singleInput: '库克 (Tim Cook)',
  multiText:
    '这是 mac-home 仪表盘 UI 规范表单组件。无粗边框、无强烈对比度，采用 12px 哑光圆角与柔和主色光。',
  selectValue: 'macos-sonoma',
  checkboxVal: true,
  toggleVal: true,
  radioVal: 'standard',
  numberVal: 42,
  sliderVal: 75,
  segmentedVal: 'overview',
  simulatedState: 'default',
};
```

## 四、Tailwind 编码约束
- 圆角统一使用 `var(--card-radius)` 变量（来自项目主题，等价于 12px 规范），如 `rounded-[var(--card-radius)]`。
- 主色一律用 `var(--accent)` / `var(--accent-hover)`，禁止写死 `#007AFF` 等色值。
- 哑光磨砂底色统一 `bg-black/5 dark:bg-white/10`，hover `bg-black/10 dark:bg-white/15`。
- 聚焦态用柔光环 `ring-2 ring-[color:var(--accent)]/50`，不用生硬 `border`。
- 字号只用 `text-xs` / `text-sm` 语义阶梯，禁止 `text-[14px]` 之类写死像素。
- 动画只用 `active:scale-95`、入场 `animate-in fade-in slide-in-from-top-1` 等局部过渡，禁止 `transition-all`。

## 五、使用守则
- 新增/修改组件时，先对照「设计总览」核对圆角、底色、主色、字号。
- 普通文本不加颜色；只有强调内容用 `text-[color:var(--accent)]`。
- 状态样式直接复用「控件状态」中的既定类，不要自创。
- 复用已有组件（如 `SegmentedControl`、玻璃面板 `glass-panel`）而非重复实现。
