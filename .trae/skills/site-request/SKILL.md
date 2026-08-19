---
name: "site-request"
description: "Encapsulates site request actions and React hooks for fetching site pages, category trees, identity lists, and site details. Invoke when user wants to query site data, implement site pickers, or integrate site request skills."
---

# Site Request Skill

This skill provides unified data fetching actions, AI Agent tool registrations, and React Hooks for all site-related operations (backed by `siteApi`).

## Structure Overview

The site request skill logic is located under `src/agent/request/`:

- `actions.ts`: Core action definition registry (`requestActions`). Maps `siteApi` methods into executable Skill Actions.
- `skill.json`: Metadata declaration for AI Agent tools & Skill Schema (`site-request-actions`).
- `useSiteList.ts`: React Hook `useSiteList` providing state management, pagination, search filter, and automatic page-load fetching.
- `index.ts`: Unified export entry providing `runRequestAction`, `requestTools`, and `useSiteList`.

---

## Action Inventory

All actions are prefixed with `site_`:

| Action Name | Description | Key Parameters |
| ----------- | ----------- | -------------- |
| `site_get_page` | Paginated query for sites with search, category, and identity filter | `current`, `size`, `searchKey`, `categoryId`, `identityId`, `recommend`, `module`, `sortField`, `sortOrder` |
| `site_get_category_tree` | Query site categories as a hierarchical tree | `module` |
| `site_get_identity_list` | Query all supported site identity / role tags | None |
| `site_get_identity_category_tree` | Query category tree filtered by identity ID | `identityId` (required) |
| `site_get_detail` | Get full detail for a single site | `id` (required) |

---

## Usage Guide

### 1. Direct Skill Execution via Code
```typescript
import { runRequestAction } from '@/agent/request';

// Fetch site list page
const res = await runRequestAction('site_get_page', { current: 1, size: 10, searchKey: 'tool' });
if (res.ok) {
  console.log('Site page data:', res.data);
}

// Fetch site category tree
const catRes = await runRequestAction('site_get_category_tree', { module: 'nav' });
```

### 2. Auto-fetching in React Components (`useSiteList`)
```typescript
import { useSiteList, runRequestAction } from '@/agent/request';

export const MySitePicker = () => {
  const { items, loading, page, totalPages, fetchSites } = useSiteList({
    defaultPage: 1,
    defaultSize: 12,
    autoFetch: true, // Automatically fetches data when component mounts
  });

  return (
    <div>
      {loading ? <p>Loading...</p> : items.map(site => <div key={site.id}>{site.name}</div>)}
    </div>
  );
};
```

---

## Skill Configuration (`skill.json`)

The skill JSON file is located at `src/agent/request/skill.json`. It defines the metadata and parameter schemas required for Agent integration.
