import { Globe } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../../components/Modal/Modal';
import { WebListPicker } from '../../views/AddWidgetModal/WebListPicker';
import { siteApi, SiteItem } from '../../api/site';
import { playSound } from '../../utils/sound';
import { RandomWebWidgetCard } from '../RandomWeb';

interface RandomWebWidgetProps {
  expanded?: boolean;
  onExpand?: () => void;
}

export const RandomWebWidget: React.FC<RandomWebWidgetProps> = ({
  expanded = false,
}) => {
  // 随机网页列表仅存于组件运行时的临时变量，不写入本地存储（刷新即重置为空）。
  const [randomweb, setRandomweb] = useState<SiteItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // 任何写入只更新组件本地状态（临时变量），不持久化。
  const commitRandomweb = useCallback(
    (next: SiteItem[] | ((prev: SiteItem[]) => SiteItem[])) => {
      setRandomweb((prev) =>
        typeof next === 'function' ? (next as (p: SiteItem[]) => SiteItem[])(prev) : next,
      );
    },
    [],
  );

  // 从「网页列表」中添加站点到随机网页
  const handleAddFromSite = (item: SiteItem) => {
    const url = item.link || '#';
    // 去重：已存在相同 URL 的站点则提示并跳过，避免重复添加
    if (randomweb.some((s) => s.link === url)) {
      return;
    }
    // 直接以 SiteItem 结构存储，保留原站点的封面/背景/计数等字段
    const randomItem: SiteItem = {
      ...item,
      id: item.id || `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    // 再次以函数式更新兜底，防止极速连点导致的竞态重复
    commitRandomweb((prev) =>
      prev.some((s) => s.link === url) ? prev : [...prev, randomItem],
    );
    void (async () => {
      try {
        await siteApi.recordClick(item.id);
      } catch {
        /* noop */
      }
    })();
  };

  // 在外部打开站点链接
  const handleOpenSite = (item: SiteItem) => {
    if (item.link) window.open(item.link, '_blank', 'noreferrer');
    playSound.playClick();
  };

  // 网页列表中选择器的「删除」：从随机网页中移除对应站点
  const handleRemoveFromPicker = (item: SiteItem) => {
    const key = item.id || item.link;
    commitRandomweb((prev) => prev.filter((s) => (s.id || s.link) !== key));
  };

  return (
    <>
      <RandomWebWidgetCard
        expanded={expanded}
      />

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="站点库"
        icon={<Globe size={16} className="text-[color:var(--accent)]" />}
        className="site-library-modal w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[60vw] min-h-[80vh] md:min-h-[70vh]"
      >
        <WebListPicker
          selected={randomweb}
          onAdd={handleAddFromSite}
          onRemove={handleRemoveFromPicker}
          onOpen={handleOpenSite}
        />
      </Modal>
    </>
  );
};
