# Apple UI 表单组件 Skill（默认参数规范）

> 来源：原 `AppleFormShowcase` 组件。该组件已从项目中移除，其设计参数沉淀为本 UI Skill，
> 用于快速复刻符合 Apple HIG（macOS Sonoma / iOS）规范的表单组件。

## 设计总览（Design Tokens）

| 维度 | 规范                                                                                        |
| ---- | ------------------------------------------------------------------------------------------- |
| 圆角 | 统一 `12px`（分段控制器、输入框、选择器、按钮），Pill 容器内部 `10px`                       |
| 底色 | 哑光磨砂：`bg-black/5 dark:bg-white/10`，hover `bg-black/10 dark:bg-white/15`               |
| 边框 | 无生硬黑框；focus 用 `ring-2 ring-[#007AFF]/50` 柔光，禁用生硬描边                          |
| 主色 | Apple 蓝 `#007AFF`，hover 加深 `bg-blue-600`                                                |
| 文字 | `text-slate-800 dark:text-slate-100`，辅助说明 `text-slate-400/500`                         |
| 文本动态化 | 禁止在壁纸中心等面板里写死十六进制文字色（如 `text-[#1d1d1f]`）。一律使用随明暗主题自动切换的语义类；强调色文本用 `text-[color:var(--accent)]` |
| 字号 | 正文 `text-xs`（12px），说明 `text-[12px]`，标签 `font-medium`。**禁止写死像素字号（如 `text-[13px]`/`text-[11px]`），一律改用 Tailwind 语义字号阶梯（`text-xs`/`text-sm` 等）** |
| 动效 | 禁用`transition-all`，按钮 `active:scale-95`，弹窗 `animate-in fade-in slide-in-from-top-1` |

## 状态模拟（simulatedState）

可用值：`'default' | 'hover' | 'focus' | 'disabled' | 'error'`

- `disabled`：所有控件 `opacity-50 cursor-not-allowed pointer-events-none`
- `error`：输入框/选择器套红 `bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50`，并显示「格式不正确」提示
- `focus`：输入框淡蓝柔光 `ring-2 ring-[#007AFF]/50` + 白底
- `hover`：底色加深

## 默认参数（FormDemoState 初始值）

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
```

## 组件清单与默认参数

### 1. 分段控制器 Segmented Control

- 选项：`overview`(概览视图) / `design`(设计规范) / `settings`(组件参数)
- 默认选中：`overview`
- 样式：外层 `bg-black/5 dark:bg-white/10 p-1 rounded-[12px]`；选中项 `bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs rounded-[10px]`

### 2. 单行输入框 Single-line Input

- 默认值：`库克 (Tim Cook)`
- 占位符：`请输入用户名...`
- 前置图标：`User`，左内边距 `pl-9`
- focus：`ring-2 ring-[#007AFF]/50`

### 3. 下拉选择器 Dropdown Select

- 选项：
  - `macos-sonoma` → macOS Sonoma 桌面系统（默认）
  - `ios-18` → iOS 18 苹果人机工程规范
  - `vision-os` → visionOS 空间计算UI
  - `watch-os` → watchOS 极简响应界面
- 弹窗：`glass-panel rounded-xl shadow-2xl`，选中项右侧显示蓝色 `Check`

### 4. 多行文本域 Textarea

- 默认：`这是 Apple HIG macOS Sonoma & iOS 规范表单组件...`
- 行高 `rows={3}`，`resize-y`，focus 柔光

### 5. 开关 Toggle

- 默认：`true`（开启，蓝色 `bg-[#007AFF]`，关闭 `bg-slate-300 dark:bg-slate-600`）
- 轨道 `w-11 h-6 rounded-full`，滑块 `w-5 h-5 rounded-full translate-x-5`

### 6. 复选框 Checkbox

- 默认：`true`
- 选中：`bg-[#007AFF] text-white rounded-md` + 白色对勾 `Check`（`stroke-[3]`）
- 未选：`border-2 border-slate-300 dark:border-slate-600`

### 7. 单选组 Radio Group

- 选项：`standard`(标准模式) / `pro`(专业级) / `ultra`(Ultra 极限)
- 默认：`standard`
- 外环 `w-4 h-4 rounded-full border`，选中内点 `w-2 h-2 rounded-full bg-[#007AFF]`

### 8. 数字输入框 Stepper

- 默认：`42`（步进 +1 / -1）
- 两侧圆角按钮 `w-7 h-7 rounded-lg`，中间 `w-14` 居中数字输入

### 9. 滑块 Slider

- 默认：`75`（`min=0 max=100`），右侧显示 `{val}%` 蓝色
- `accent-[#007AFF]`

### 10. 按钮规范

- 主按钮：`px-6 py-3 rounded-[12px] bg-[#007AFF] text-white`，含 `Sparkles` 图标，文字「主提交按钮」，比例严格 2:1
- 次要按钮：`glass-pill`，文字「次要取消按钮」

## 壁纸中心（Wallpaper Modal）文本配色规范

壁纸中心的文本必须随明暗主题**动态切换**，禁止写死十六进制文字色。统一使用以下语义类映射（已沉淀进 `WallpaperModal`、`StaticWallpaper` 等组件）：

| 文本角色 | 旧硬编码（禁用） | 动态语义类（规范） |
| -------- | ---------------- | ------------------ |
| 主文本（标题、Tab 选中态、滤镜标签） | `text-[#1d1d1f] dark:text-[#f5f5f7]` | `text-slate-800 dark:text-slate-100` |
| 次要文本（Tab 未选中、数值） | `text-[#6e6e73] dark:text-[#aeaeb2]` | `text-slate-500 dark:text-slate-400` |
| 说明文本（底部提示、暂无预览） | `text-[#86868b] dark:text-[#86868b]` | `text-slate-400` |
| 强调色文本（重置按钮、链接） | — | `text-[color:var(--accent)]`（跟随主题强调色动态变化） |

字号同样禁止写死像素值，改用 Tailwind 语义字号阶梯：

| 场景 | 旧硬编码（禁用） | 动态语义类 |
| ---- | ---------------- | ---------- |
| Tab 标签、滤镜行标签 | `text-[13px]` | `text-sm` |
| 卡片内提示（暂无预览等） | `text-[11px]` | `text-xs` |

> 规则：所有面板文字优先用 `slate` 配色阶梯 + `dark:` 变体；涉及品牌/强调语义（如「重置滤镜」按钮）统一用 CSS 变量 `var(--accent)`，禁止写死 `#007AFF` 等。字号一律用 `text-xs`/`text-sm` 等语义阶梯，禁止 `text-[Npx]`。

## 复刻提示

- 先铺「状态模拟」切换器（default/hover/focus/disabled/error），用 `simulatedState` 驱动全局样式分支。
- 左列放 Segmented / Input / Select / Textarea；右列放 Toggle+Checkbox / Radio / Stepper / Slider / Buttons。
- 所有控件统一通过 `updateState(key, val)` 更新并触发点击音效。
