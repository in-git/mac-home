import { siteApi, SiteItem } from '../api/site';
import { isWebApp } from '../data/widgetConfig';
import { findFirstAvailablePosition } from '../components/dashboard/itemSize';
import { useHomeStore } from '../store/useHomeStore';
import type { WidgetItem } from '../types';

/**
 * 网页列表：点击「添加」把站点做成桌面图标（web-app 类型，携带 site 数据）
 */
export const handleAddSite = (item: SiteItem) => {
  const { widgets, setWidgets } = useHomeStore.getState();
  const url = item.link || '#';
  if (widgets.some((w) => isWebApp(w.component) && w.data.site?.link === url)) {
    return;
  }
  // 网页应用不显示在系统组件中
  item.showInSystem = false;
  const pos = findFirstAvailablePosition(widgets, 8, 8);
  const newWidget: WidgetItem = {
    id: `widget-${item.id || Date.now()}`,
    component: 'web-app',
    title: item.name || '未命名',
    maxInstances: Infinity,
    data: {
      site: item,
    },
    grid: {
      x: pos.x,
      y: pos.y,
      w: 8,
      h: 8,
    },
    cardStyle: {
      padding: 'p-0',
      background: 'transparent',
      glass:false
    }
  };
  console.log(newWidget);
  
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
 * 网页列表：点击「删除」移除对应的桌面图标（web-app）
 */
export const handleRemoveSite = (item: SiteItem) => {
  const { widgets, deleteWidget } = useHomeStore.getState();
  const target = widgets.find(
    (w) =>
      isWebApp(w.component) &&
      ((item.id && w.data.site?.id === item.id) ||
        (item.link && w.data.site?.link === item.link) ||
        (item.name && w.data.site?.name === item.name)),
  );
  if (!target) return;
  deleteWidget(target.id);
};
