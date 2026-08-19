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

开发 / 修改本项目界面组件（widget、卡片、表单、按钮、输入框、选择器等）时启用，严格依照本规范输出，不得擅自修改尺寸、色值、编码约束。

## 核心约束：文本颜色
- 非特殊强调，文本一律不加颜色，使用语义化 Tailwind 文本类（`text-slate-900`、`text-white`、`text-slate-500`）由明暗主题适配。
- 禁止为普通文本硬编码十六进制色值或加任意 `text-[color:...]`。
- 仅强调文本（关键数字、主标题、激活态）允许 `text-[color:var(--accent)]`。
- 错误 / 警示文本唯一例外：`text-red-500` 等语义色。

## 设计总览
- 圆角：统一 `12px`（Pill 内部 `10px`）。
- 底色：哑光磨砂 `bg-black/5 dark:bg-white/10`，hover `bg-black/10 dark:bg-white/15`。
- 边框：不用生硬实体描边；聚焦用柔光环 `ring-2 ring-[var(--accent)]/50`。
- 主色：`var(--accent)`（Apple 蓝），hover `var(--accent-hover)`。
- 字号：仅用 `text-xs` / `text-sm`，禁止 `text-[xxpx]`。
- 动画：禁止 `transition-all`；按钮 `active:scale-95`；弹窗 `animate-in fade-in slide-in-from-top-1`。

## 控件状态
枚举：`default` | `hover` | `focus` | `disabled` | `error`
- disabled：`opacity-50 cursor-not-allowed pointer-events-none`
- error：容器 `bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50` + 提示「格式不正确」
- focus：柔光主色环 `ring-2 ring-[var(--accent)]/50`
- hover：底色加深

## Tailwind 编码约束
- 圆角用 `var(--card-radius)`（`rounded-[var(--card-radius)]`）。
- 主色用 `var(--accent)` / `var(--accent-hover)`，禁止写死 `#007AFF`。
- 哑光底色 `bg-black/5 dark:bg-white/10`，hover `bg-black/10 dark:bg-white/15`。
- 聚焦 `ring-2 ring-[color:var(--accent)]/50`，不用生硬 `border`。
- 字号只用 `text-xs` / `text-sm`，禁止写死像素。
- 动画只用局部过渡（`active:scale-95`、入场 `animate-in ...`），禁止 `transition-all`。

## 使用守则
- 先对照设计总览核对圆角、底色、主色、字号。
- 普通文本不加色，仅强调用 `text-[color:var(--accent)]`。
- 状态样式复用既定类，不自创。
- 复用已有组件（`SegmentedControl`、`glass-panel`），不重复实现。
