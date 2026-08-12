import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { WebListPicker } from '../components/WebListPicker';
import { siteApi, SiteItem } from '../api/site';
import { playSound } from '../utils/sound';
import { ShortcutsWidgetCard } from '../widgets/ShortcutsWidget';

interface ShortcutsWidgetProps {
  expanded?: boolean;
  onExpand?: () => void;
  /** 来自 widget 实例的持久化数据空间；未提供时回退到预设站点 */
  shortcuts?: SiteItem[];
  /** 写回数据空间的回调（通常经 store 持久化到 localStorage） */
  onUpdateShortcuts?: (list: SiteItem[]) => void;
}

/** 预设快捷站点（使用 SiteItem 结构，无图时以首字母 + 纯色背景兜底） */
const INITIAL_SITES: SiteItem[] = [

];

export const ShortcutsWidget: React.FC<ShortcutsWidgetProps> = ({
  expanded = false,
  onExpand,
  shortcuts: shortcutsProp,
  onUpdateShortcuts,
}) => {
  const [shortcuts, setShortcuts] = useState<SiteItem[]>(
    shortcutsProp ?? INITIAL_SITES,
  );
  const [showAdd, setShowAdd] = useState(false);

  // 数据空间由外部（widget 实例）持有：props 变化时（如新增实例、持久化恢复）同步本地状态
  useEffect(() => {
    if (shortcutsProp) setShortcuts(shortcutsProp);
  }, [shortcutsProp]);

  // 任何写入都同时更新本地状态与 widget 实例的数据空间（store → localStorage）
  const commitShortcuts = useCallback(
    (next: SiteItem[] | ((prev: SiteItem[]) => SiteItem[])) => {
      setShortcuts((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: SiteItem[]) => SiteItem[])(prev) : next;
        onUpdateShortcuts?.(resolved);
        return resolved;
      });
    },
    [onUpdateShortcuts],
  );

  // 从「网页列表」中添加站点到快捷导航
  const handleAddFromSite = (item: SiteItem) => {
    const url = item.link || '#';
    // 去重：已存在相同 URL 的快捷项则提示并跳过，避免重复添加
    if (shortcuts.some((s) => s.link === url)) {
      toast.warning(`「${item.name || '未命名'}」已在快捷导航中`);
      return;
    }
    // 直接以 SiteItem 结构存储，保留原站点的封面/背景/计数等字段
    const shortcut: SiteItem = {
      ...item,
      id: item.id || `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    // 再次以函数式更新兜底，防止极速连点导致的竞态重复
    commitShortcuts((prev) =>
      prev.some((s) => s.link === url) ? prev : [...prev, shortcut],
    );
    void (async () => {
      try {
        await siteApi.recordClick(item.id);
      } catch {
        /* noop */
      }
    })();
    // 不关闭弹窗，用全局 Toast 显示添加成功提示
    toast.success(`已添加「${item.name || '未命名'}」到快捷导航`);
  };

  // 在外部打开站点链接
  const handleOpenSite = (item: SiteItem) => {
    if (item.link) window.open(item.link, '_blank', 'noreferrer');
    playSound.playClick();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    commitShortcuts((prev) => prev.filter((s) => s.id !== id));
  };

  // 点击卡片在外部打开，并本地递增访问次数（与「添加」逻辑互不冲突）
  const handleOpen = (s: SiteItem) => {
    playSound.playClick();
    commitShortcuts((prev) =>
      prev.map((item) =>
        item.id === s.id ? { ...item, count: (item.count ?? 0) + 1 } : item,
      ),
    );
  };

  return (
    <>
      <ShortcutsWidgetCard
        expanded={expanded}
        onExpand={onExpand}
        shortcuts={shortcuts}
        onAddClick={() => setShowAdd(true)}
        onDelete={handleDelete}
        onOpen={handleOpen}
      />

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="站点库"
        icon={<Globe size={16} className="text-[color:var(--accent)]" />}
        className="site-library-modal w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[60vw] min-h-[80vh] md:min-h-[70vh]"
      >
        <WebListPicker
          selected={shortcuts}
          onAdd={handleAddFromSite}
          onOpen={handleOpenSite}
          addTip="添加到快捷导航"
        />
      </Modal>
    </>
  );
};
