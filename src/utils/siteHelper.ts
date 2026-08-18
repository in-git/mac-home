import { siteApi, SiteItem } from '../api/site';
import { isWebGrid } from '../data/widgetConfig';
import { findFirstAvailablePosition } from '../components/dashboard/itemSize';
import { useHomeStore } from '../store/useHomeStore';
import type { WidgetItem } from '../types';

/**
 * 网页列表：点击「添加」把站点做成桌面图标（web-grid 类型，携带 site 数据）
 */
export const handleAddSite = (item: SiteItem) => {
  const { widgets, setWidgets } = useHomeStore.getState();
  const url = item.link || '#';
  if (widgets.some((w) => isWebGrid(w.type) && w.data.site?.link === url)) {
    return;
  }
  const pos = findFirstAvailablePosition(widgets, 2, 5);
  const newWidget: WidgetItem = {
    id: `widget-${item.id || Date.now()}`,
    type: 'web-grid',
    title: item.name || '未命名',
    maxInstances: Infinity,
    isAddable: false,
    data: {
      site: item,
    },
    grid: {
      x: pos.x,
      y: pos.y,
      w: 2,
      h: 5,
    },
  };
  setWidgets([...widgets, newWidget]);
  void (async () => {
    try {
      await siteApi.recordClick(item.id);
    } catch {
      /* noop */
    }
  })();
};

/**
 * 网页列表：点击「删除」移除对应的桌面图标（web-grid）
 */
export const handleRemoveSite = (item: SiteItem) => {
  const { widgets, deleteWidget } = useHomeStore.getState();
  const target = widgets.find(
    (w) =>
      isWebGrid(w.type) &&
      ((item.id && w.data.site?.id === item.id) ||
        (item.link && w.data.site?.link === item.link) ||
        (item.name && w.data.site?.name === item.name)),
  );
  if (!target) return;
  deleteWidget(target.id);
};
