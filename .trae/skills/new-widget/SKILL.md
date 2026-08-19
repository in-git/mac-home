---
name: "new-widget"
description: "mac-home dashboard widget creation guideline. Documents the standard component format used under src/widgets/ (simple single-file, container + sub-components, and container + state hook + types + components/ variants) and the registration flow (WidgetType, WIDGET_CONFIG, widgetContent switch). Invoke when user wants to create, copy, or extend a dashboard widget."
---

# 组件新建规范（Dashboard Widget）

本 skill 是 mac-home 仪表盘小组件（widget）的**新建 / 扩展规范**。新建任何小组件都遵循本文档的目录结构与注册流程。

## 目录总览

所有组件位于 `src/widgets/`，按组件名一个目录。按复杂度分三种形态：

### 形态一：单文件组件（简单）
```text
src/widgets/Clock/ClockWidget.tsx
```
- 示例：`Clock/ClockWidget.tsx`、`Search/SearchWidget.tsx`
- 一个文件内含完整逻辑与渲染，`export default` 导出。

### 形态二：容器 + 子组件（中等）
```text
src/widgets/Shortcuts/
  ├── ShortcutsWidget.tsx   # 主卡片组件
  ├── ShortcutTile.tsx      # 子组件
  └── index.ts              # 统一导出，保留对外路径
```
- 示例：`Shortcuts/`、`WebListWidget/`（`index.tsx` 容器 + `WebListItem.tsx` 子组件）。
- 业务逻辑可留在容器内，子组件只做展示。

### 形态三：容器 + Hook + types + components/（复杂）
```text
src/widgets/Weather/
  ├── index.tsx          # 容器组件：默认导出，编排布局
  ├── useWeatherData.ts  # 状态 Hook：数据获取 / store 访问 / 派生状态 / 动作回调
  ├── types.tsx          # 共享类型 + 纯函数工具（无 Hook）
  └── components/        # 纯展示子组件（props-only）
```
- 示例：`Weather/`。

## 新建组件步骤（Checklist）

1. **创建目录**：`src/widgets/<Name>/`，按复杂度选择上述形态。
2. **注册组件类型**：在 [src/types.ts](file:///e:/git/mac-home/src/types.ts) 的 `WidgetType` 联合类型中添加新值。
3. **注册配置**：在 [src/data/widgetConfig.ts](file:///e:/git/mac-home/src/data/widgetConfig.ts) 的 `WIDGET_CONFIG` 数组添加配置项（type / title / maxInstances / isAddable / data / grid）。
4. **注册渲染**：在 [src/components/dashboard/widgetContent.tsx](file:///e:/git/mac-home/src/components/dashboard/widgetContent.tsx) 的 `switch (widget.type)` 中添加 `case` 分支。
5. **样式与状态**：按下方「规范细则」编写。

## 规范细则

1. **容器拥有布局，Hook 拥有状态**：容器组件（`index.tsx`）只解构 Hook 返回值并渲染子组件，不直接写 `useState`/`useEffect`/`fetch`。
2. **状态 Hook 命名**：`use<Feature>Data`（如 `useWeatherData`）。返回单一对象，包含 `loading`、`error` 与显式的 `refresh`/`refetch` 回调。
3. **子组件纯展示**：每个子组件定义局部 `Props` 接口，不导入 store、不发起请求。
4. **公共 Props**：继承全局 [src/types.ts](file:///e:/git/mac-home/src/types.ts) 的 `WidgetProps`（`editing?: boolean`）；需要向上同步数据时提供可选 `on<Feature>Change` 回调。
5. **共享类型与图标映射**：复杂组件放 `types.tsx`，纯函数工具（如 `getIcon()`）不放组件内。
6. **样式**：使用 Tailwind utility；依赖 `glass-panel`、`var(--card-radius)`、`var(--accent)`、`text-font-sm` 令牌统一主题；暗色模式用 `dark:` 变体。
7. **加载与空状态**：始终提供骨架屏（loading）与优雅空态 / 错误回退。

## 注册清单（代码示例）

### 1. 添加 WidgetType
```typescript
// src/types.ts
export type WidgetType =
  | 'sticky-notes'
  | 'weather'
  // ... 现有类型
  | 'your-new-type'; // ← 新增
```

### 2. 添加 WIDGET_CONFIG
```typescript
// src/data/widgetConfig.ts → WIDGET_CONFIG 数组
{
  id: 'cfg-your-widget',
  type: 'your-new-type',
  title: '组件显示名',
  maxInstances: 1,
  isAddable: true,
  data: {},
  grid: { x: 0, y: 0, w: 12, h: 15 },
}
```

### 3. 添加渲染分支
```tsx
// src/components/dashboard/widgetContent.tsx
case 'your-new-type':
  return <YourWidget />;
```

## 现有组件参考

| 复杂度 | 目录 | 结构 |
| --- | --- | --- |
| 简单 | `Clock/`、`Search/` | 单文件 `<Name>Widget.tsx` |
| 中等 | `Shortcuts/`、`WebListWidget/` | `index.ts(x)` + 子组件 + 可选 `index.ts` 导出 |
| 复杂 | `Weather/` | `index.tsx` + `use<Name>Data.ts` + `types.tsx` + `components/` |
