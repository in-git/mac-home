---
name: segmented-control-mini-mode
overview: 为 SegmentedControl 组件新增 size='mini' 档位，按钮 padding 设为 0，实现迷你模式。
todos:
  - id: add-mini-size
    content: 扩展 SegmentedControl 的 size 类型并新增 mini 样式映射
    status: completed
  - id: verify-lint
    content: 运行 lint 验证类型与现有调用无报错
    status: completed
    dependencies:
      - add-mini-size
---

## User Requirements

为已封装的 `SegmentedControl` 分段选择器组件新增一种"迷你模式"，使其按钮内边距（padding）为 0。

## Product Overview

在现有尺寸档位（`sm`/`md`）基础上，新增 `size="mini"` 档位。该模式下分段按钮的横向与纵向内边距均设为 0，用于空间受限、需要紧凑排版的场景，同时保持 macOS 滑块高亮动画与选中逻辑不变。

## Core Features

- 扩展 `SegmentedControl` 的 `size` 属性类型，新增 `'mini'` 选项
- 新增 mini 档位的样式映射：字号保持 `text-xs`，`px-0 py-0`
- 现有调用方（`size="sm"` 等）不受影响，无需改动

## Tech Stack

- 框架：React + TypeScript（与现有项目一致）
- 样式：Tailwind CSS（沿用现有 `SIZE_CLASS` 映射模式）
- 组件：复用已存在的 `src/components/SegmentedControl.tsx`

## Implementation Approach

采用"在现有 size 枚举中新增档位"的策略：仅扩展类型定义与样式映射表，不引入独立 prop。按钮渲染逻辑通过 `SIZE_CLASS[size]` 统一取样式，新增 `mini` 键后自动生效，零侵入、零重复。

关键决策：

- 复用 `size` 参数而非新增 `mini` prop，符合最小改动与一致性原则，调用方心智模型统一。
- mini 仅将 padding 设 0（`px-0 py-0`），保留 `text-xs` 保证文字可读性与高亮块内文字居中。
- 容器 `p-0.5` 与高亮块 `calc(100/n% - 0.25rem)` 偏移逻辑保持不变，mini 模式下容器仍有 0.5 间距形成外框，高亮滑动动画无需调整。

性能与可靠性：纯样式枚举扩展，无运行时开销、无引入新依赖，不触发额外渲染。

## Implementation Notes

- 仅修改 `SegmentedControl.tsx` 的类型与 `SIZE_CLASS` 映射，不改动按钮 JSX 与高亮块计算逻辑。
- 类型 `Record<'sm' | 'md', string>` 需同步改为 `Record<'sm' | 'md' | 'mini', string>`，否则 TS 报类型错误。
- 修改后运行 lint 确认无报错；现有 `SearchWidget.tsx`（size="sm"）、`AppearancePanel.tsx` 调用不受影响。
- 不建议在 mini 模式下去除容器 `p-0.5`，否则高亮块溢出边界。

## Architecture Design

单一组件内部扩展，不涉及架构调整。数据流：`size` prop → `SIZE_CLASS[size]` 映射 → 按钮 className，新增 `'mini'` 分支即可。

## Directory Structure

```
src/
└── components/
    └── SegmentedControl.tsx  # [MODIFY] 扩展 size 类型为 'sm' | 'md' | 'mini'；在 SIZE_CLASS 新增 mini: 'text-xs px-0 py-0'；按钮渲染逻辑复用 SIZE_CLASS[size] 无需改动
```