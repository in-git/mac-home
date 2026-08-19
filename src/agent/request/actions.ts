import { siteApi } from '../../api/site';
import type { SitePageParams } from '../../api/site';
import type { AgentToolParam } from '../types';

export interface RequestActionResult {
  ok: boolean;
  message: string;
  data?: unknown;
}

export interface RequestAction {
  /** 工具名，与 skill.json action.name 一致，如 'site_get_page' */
  name: string;
  /** 行为标题 */
  title: string;
  /** 行为描述 */
  description: string;
  /** 参数 schema（复用 AgentToolParam） */
  parameters: Record<string, AgentToolParam>;
  /** 执行请求行为：接收参数对象，调用 API 并返回结果 */
  run: (args: Record<string, unknown>) => Promise<RequestActionResult>;
}

/**
 * 站点相关的请求行为注册表。
 * 与 src/api/site.ts 对齐，并在 skill.json 中声明。
 */
export const requestActions: RequestAction[] = [
  {
    name: 'site_get_page',
    title: '分页查询站点列表',
    description: '分页获取站点列表数据，支持搜索词、分类ID、身份ID、推荐筛选、模块和排序条件等。',
    parameters: {
      current: {
        type: 'number',
        description: '当前页码，从 1 开始，默认 1',
        required: false,
      },
      size: {
        type: 'number',
        description: '每页条数，默认 10 或 20',
        required: false,
      },
      searchKey: {
        type: 'string',
        description: '搜索关键字',
        required: false,
      },
      categoryId: {
        type: 'string',
        description: '分类 ID',
        required: false,
      },
      identityId: {
        type: 'string',
        description: '身份 ID',
        required: false,
      },
      keyword: {
        type: 'string',
        description: '关键词过滤',
        required: false,
      },
      recommend: {
        type: 'boolean',
        description: '是否仅查询推荐站点',
        required: false,
      },
      module: {
        type: 'string',
        description: '业务模块标识',
        required: false,
      },
      sortField: {
        type: 'string',
        description: '排序字段',
        required: false,
      },
      sortOrder: {
        type: 'string',
        description: '排序方向（如 ascend / descend）',
        required: false,
      },
    },
    run: async (args) => {
      try {
        const params: SitePageParams = {};
        if (args.current !== undefined) params.current = Number(args.current);
        if (args.size !== undefined) params.size = Number(args.size);
        if (args.searchKey !== undefined) params.searchKey = String(args.searchKey);
        if (args.categoryId !== undefined) params.categoryId = String(args.categoryId);
        if (args.identityId !== undefined) params.identityId = String(args.identityId);
        if (args.keyword !== undefined) params.keyword = String(args.keyword);
        if (args.recommend !== undefined) params.recommend = Boolean(args.recommend);
        if (args.module !== undefined) params.module = String(args.module);
        if (args.sortField !== undefined) params.sortField = String(args.sortField);
        if (args.sortOrder !== undefined) params.sortOrder = String(args.sortOrder);

        const res = await siteApi.getPage(params);
        return {
          ok: true,
          message: `成功获取站点分页数据，共 ${res.total ?? (res.records ? res.records.length : 0)} 条记录`,
          data: res,
        };
      } catch (error) {
        return {
          ok: false,
          message: `获取站点分页数据失败：${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'site_get_category_tree',
    title: '获取站点分类树',
    description: '获取站点分类树状结构数据，支持按模块筛选。',
    parameters: {
      module: {
        type: 'string',
        description: '可选的业务模块标识',
        required: false,
      },
    },
    run: async (args) => {
      try {
        const module = args.module ? String(args.module) : undefined;
        const res = await siteApi.getCategoryTree(module);
        return {
          ok: true,
          message: `成功获取分类树数据，共 ${res.length} 个顶级分类`,
          data: res,
        };
      } catch (error) {
        return {
          ok: false,
          message: `获取分类树失败：${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'site_get_identity_list',
    title: '获取站点身份列表',
    description: '获取站点支持的角色/身份标签列表。',
    parameters: {},
    run: async () => {
      try {
        const res = await siteApi.getIdentityList();
        return {
          ok: true,
          message: `成功获取身份列表，共 ${res.length} 个身份`,
          data: res,
        };
      } catch (error) {
        return {
          ok: false,
          message: `获取身份列表失败：${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'site_get_identity_category_tree',
    title: '根据身份获取分类树',
    description: '根据指定的身份ID（identityId）获取对应的站点分类树结构。',
    parameters: {
      identityId: {
        type: 'string',
        description: '身份 ID',
        required: true,
      },
    },
    run: async (args) => {
      try {
        const identityId = String(args.identityId ?? '').trim();
        if (!identityId) {
          return { ok: false, message: 'identityId 必填且不能为空' };
        }
        const res = await siteApi.getIdentityCategoryTree(identityId);
        return {
          ok: true,
          message: `成功获取身份(${identityId})对应的分类树，共 ${res.length} 个顶级分类`,
          data: res,
        };
      } catch (error) {
        return {
          ok: false,
          message: `获取身份分类树失败：${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
  {
    name: 'site_get_detail',
    title: '获取站点详情',
    description: '根据站点ID获取站点的完整详情信息（如名称、描述、链接、分类等）。',
    parameters: {
      id: {
        type: 'string',
        description: '站点 ID',
        required: true,
      },
    },
    run: async (args) => {
      try {
        const id = String(args.id ?? '').trim();
        if (!id) {
          return { ok: false, message: '站点 id 必填且不能为空' };
        }
        const res = await siteApi.getDetail(id);
        return {
          ok: true,
          message: `成功获取站点「${res.name || id}」详情`,
          data: res,
        };
      } catch (error) {
        return {
          ok: false,
          message: `获取站点详情失败：${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  },
];
