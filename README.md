# mac-home

个人主页 / 应用导航站。仿 macOS 桌面风格的 Web 应用，聚合网页导航、视频播放、收藏管理与桌面小组件，同一套代码通过响应式断点同时适配桌面端与移动端。

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | React 19 + TypeScript 5.8 |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`） |
| 状态 | Zustand 4（持久化） |
| 布局 | react-grid-layout（桌面小组件网格） |
| 动画 | motion、GSAP |
| 组件库 | HeroUI、Radix UI、lucide-react |
| 视频 | ArtPlayer |
| 请求 | axios（含 sockjs-client + stompjs 用于 WebSocket） |

## 快速开始

**环境要求：** Node.js 18+

```bash
# 1. 安装依赖
npm install

# 2. 配置后端地址（可选）
#    在 .env.development / .env.production 中设置 VITE_API_BASE_URL
#    未配置时默认指向 https://wwl.mx2d.cn

# 3. 启动开发服务器
npm run dev
```

开发服务器默认运行在 `http://localhost:14579`。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器（`--host`，同局域网可访问） |
| `npm run build` | 生产构建，产物输出到 `dist/` |
| `npm run preview` | 本地预览构建产物 |
| `npm run lint` | 类型检查（`tsc --noEmit`） |
| `npm run clean` | 清理 `dist/` 与 `server.js`（依赖 `rm -rf`，Windows 下请在 Git Bash 等环境执行） |

## 目录结构

```
src/
├── agent/              # 请求动作注册表（site / video 等领域操作）+ pet 桌宠智能体
├── api/                # 接口封装（site、video、visitor、wallpaper 等）
├── assets/             # 静态资源
├── components/         # 通用组件（Button、IconButton、SearchBar、Toast、VideoPlayer…）
├── hooks/              # 全局 hooks（如应用初始化）
├── store/              # Zustand 状态（持久化收藏、分类、小组件等）
├── types/              # 全局类型定义
├── utils/              # 工具（request、appBridge、device、siteHelper…）
├── views/
│   ├── AddWidgetView/  # 主界面：侧栏 / 底部 tabbar + 各功能模块
│   └── login/          # 登录
├── App.tsx
├── index.css
└── main.tsx
```

## 功能模块

主界面 `AddWidgetView` 通过顶部导航（桌面端左侧栏 / 移动端底部 tabbar）在几个模块间切换：

- **网页**（`WebListPicker`）— 站点导航。抖音式头条区（1 张大卡 + 4 张宫格卡）+ 常规卡片网格，支持分类筛选、搜索、分页触底加载、收藏，卡片展示信号强度等信息。
- **视频**（`Video`）— 竖屏轮播播放器，原生滚动 + CSS scroll-snap 整屏吸附，支持自动连播、播放进度记忆、分页加载。
- **我的**（`Mine`）— 本地收藏的站点，横向滚动浏览，内容溢出时提供「更多」入口打开全屏全量视图；移动端另有「专属 App」与「备案信息」卡片。

## 开发说明

### 路径别名

`@/` 指向 `src/`，在 `vite.config.ts` 与 `tsconfig.json` 中均已配置。

### 后端请求

开发环境通过 Vite proxy 转发，前端统一请求同源 `/api`：

- `/api` → 后端（会重写掉 `/api` 前缀）
- `/ws` → 后端 WebSocket

后端地址取自环境变量 `VITE_API_BASE_URL`。该变量**刻意不加 `VITE_` 之外的暴露处理**——它只用于 dev server proxy，不会注入前端 bundle，避免暴露后端地址。

### 构建注意

`sockjs-client` / `stompjs` 等旧 UMD 包依赖 Node 的 `global`，已在 `vite.config.ts` 中通过 `define: { global: 'globalThis' }` 注入 polyfill，并加入 `optimizeDeps.include`。

### 主题

主题色通过 CSS 变量统一管理（`--accent`、`--card-radius`、`--glass-bg` 等），组件内以 `text-[color:var(--accent)]` 这类形式引用；暗色变体为 class-based 且当前未激活，实际以浅色呈现。
