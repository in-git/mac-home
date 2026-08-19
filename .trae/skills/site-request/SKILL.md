---
name: "site-request"
description: "Encapsulates site request actions and React hooks for fetching site pages, category trees, identity lists, and site details. Invoke when user wants to query site data, implement site pickers, or integrate site request skills."
---

# Site Request Skill

站点相关统一数据获取逻辑位于 `src/agent/request/`：

- `actions.ts`：核心动作注册表 `requestActions`，封装 `siteApi` 方法为可执行 Skill Action。
- `skill.json`：AI Agent 工具 / Skill Schema 元数据（`site-request-actions`）。
- `useSiteList.ts`：React Hook `useSiteList`，提供状态管理、分页、搜索过滤、挂载自动拉取。
- `index.ts`：统一导出 `runRequestAction`、`requestTools`、`useSiteList`。

## Action 清单（前缀 `site_`）

| Action | 说明 | 关键参数 |
| --- | --- | --- |
| `site_get_page` | 分页查询站点（搜索 / 分类 / 身份过滤） | `current`, `size`, `searchKey`, `categoryId`, `identityId`, `recommend`, `module`, `sortField`, `sortOrder` |
| `site_get_category_tree` | 查询站点分类树 | `module` |
| `site_get_identity_list` | 查询所有站点身份 / 角色标签 | 无 |
| `site_get_identity_category_tree` | 按身份 ID 过滤的分类树 | `identityId`（必填） |
| `site_get_detail` | 查询单个站点详情 | `id`（必填） |
