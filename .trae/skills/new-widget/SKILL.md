---
name: "new-widget"
description: "mac-home dashboard widget creation guideline. Documents the standard component format used under src/widgets/ (simple single-file, container + sub-components, and container + state hook + types + components/ variants) and the registration flow (WidgetType, WIDGET_CONFIG, widgetContent switch). Invoke when user wants to create, copy, or extend a dashboard widget."
---

# 组件新建规范（Dashboard Widget）

所有组件位于 `src/widgets/<Name>/`，按复杂度分三种形态：

- **简单（单文件）**：`ClockWidget.tsx`，`export default` 导出。
- **中等（容器 + 子组件）**：主卡片组件 + 子组件 + 可选 `index.ts` 统一导出。
- **复杂（容器 + Hook + types + components/）**：`index.tsx`（默认导出，编排布局）、`use<Name>Data.ts`（状态 Hook）、`types.tsx`（共享类型 + 纯函数）、`components/`（纯展示子组件）。

## 注册流程

1. `src/types.ts` 的 `WidgetType` 联合类型新增类型值。
2. `src/data/widgetConfig.ts` 的 `WIDGET_CONFIG` 数组新增配置（type / title / maxInstances / isAddable / data / grid）。
3. `src/components/dashboard/widgetContent.tsx` 的 `switch (widget.type)` 新增 `case` 分支。

## 规范细则

- 容器拥有布局，Hook 拥有状态（容器不直接写 `useState`/`useEffect`/`fetch`）。
- 状态 Hook 命名 `use<Feature>Data`，返回 `{ loading, error, refresh/refetch }`。
- 子组件纯展示，定义局部 `Props` 接口，不导入 store、不发起请求。
- 公共 Props 继承全局 `WidgetProps`（`editing?: boolean`），向上同步用可选 `on<Feature>Change` 回调。
- 共享类型与图标映射放 `types.tsx`，纯函数工具不放组件内。
- 样式用 Tailwind utility，依赖 `glass-panel`、`var(--card-radius)`、`var(--accent)`、`text-font-sm`；暗色模式用 `dark:` 变体。
- 始终提供加载骨架屏与空态 / 错误回退。
