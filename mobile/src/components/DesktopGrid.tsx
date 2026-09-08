import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactGridLayout, { Layout, LayoutItem } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import { DesktopItem } from '../types';
import { AtomicWidget } from './AtomicWidget';
import { AppIcon } from './AppIcon';
import { FolderCard } from './FolderCard';

interface ContextMenuState {
  item: DesktopItem;
  x: number;
  y: number;
}

interface DesktopGridProps {
  items: DesktopItem[];
  grayMode: boolean;
  isEditMode: boolean;
  setIsEditMode: (editing: boolean) => void;
  onLayoutChange: (newItems: DesktopItem[]) => void;
  onEditItem: (item: DesktopItem) => void;
  onDeleteItem: (id: string) => void;
  onOpenFolder?: (item: DesktopItem) => void;
}

export const DesktopGrid: React.FC<DesktopGridProps> = ({
  items,
  grayMode,
  isEditMode,
  setIsEditMode,
  onLayoutChange,
  onEditItem,
  onDeleteItem,
  onOpenFolder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(360);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  // In edit mode, resize handles are hidden until the user taps a card to select it
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Clear selection whenever edit mode is exited
  useEffect(() => {
    if (!isEditMode) setSelectedId(null);
  }, [isEditMode]);

  // ResizeObserver for dynamic mobile container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Find item from event target by walking up to .react-grid-item and reading data-id
  const findItemFromTarget = (target: EventTarget | null): DesktopItem | null => {
    const el = (target as HTMLElement)?.closest?.('.react-grid-item');
    if (!el) return null;
    const id = el.getAttribute('data-id');
    return id ? items.find((it) => it.id === id) || null : null;
  };

  // Long press handler: empty area -> edit mode; on item -> context menu
  // Disabled entirely while already in edit mode (dragging/resizing owns the gesture)
  const startLongPress = useCallback(
    (clientX: number, clientY: number, target: EventTarget | null) => {
      if (isEditMode) return;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        const pressedItem = findItemFromTarget(target);
        if (pressedItem) {
          setContextMenu({ item: pressedItem, x: clientX, y: clientY });
        } else {
          setIsEditMode(true);
        }
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 450);
    },
    [items, setIsEditMode, isEditMode],
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  }, []);

  // Close context menu
  const closeContextMenu = () => setContextMenu(null);

  // Edit-mode tap selection. On touch devices DraggableCore preventDefaults
  // touchstart on grid items, which suppresses the click event entirely, so
  // touch taps are detected in onTouchEnd and mouse clicks in onClick — both
  // route through this same helper.
  const handleEditModeTap = (target: EventTarget | null) => {
    const itemEl = (target as HTMLElement)?.closest?.('.react-grid-item') as HTMLElement | null;
    const tappedId = itemEl?.getAttribute('data-id');
    if (tappedId) {
      // Tap a card: select it so its resize handles appear
      setSelectedId(tappedId);
    } else {
      // Tap empty space: deselect and exit edit mode
      setSelectedId(null);
      setIsEditMode(false);
    }
  };

  // Context menu actions
  const handleOpen = (item: DesktopItem) => {
    closeContextMenu();
    if (item.type === 'app' || item.type === 'widget-clock') {
      onEditItem(item);
    } else {
      onOpenFolder?.(item);
    }
  };

  const handleUninstall = (item: DesktopItem) => {
    closeContextMenu();
    onDeleteItem(item.id);
  };

  // Sync react-grid-layout changes
  const handleGridLayoutChange = (currentLayout: Layout) => {
    let hasChanged = false;
    const updatedItems = items.map((item) => {
      const match = currentLayout.find((l) => l.i === item.id);
      if (match) {
        if (
          match.x !== item.layout.x ||
          match.y !== item.layout.y ||
          match.w !== item.layout.w ||
          match.h !== item.layout.h
        ) {
          hasChanged = true;
          return {
            ...item,
            layout: {
              ...item.layout,
              x: match.x,
              y: match.y,
              w: match.w,
              h: match.h,
            },
          };
        }
      }
      return item;
    });

    if (hasChanged) {
      onLayoutChange(updatedItems);
    }
  };

  // Convert items into layout array for GridLayout
  const layout: LayoutItem[] = items.map((item) => ({
    i: item.id,
    x: item.layout.x,
    y: item.layout.y,
    w: item.layout.w,
    h: item.layout.h,
    minW: item.layout.minW || 1,
    minH: item.layout.minH || 1,
    static: !isEditMode && false,
  }));

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 px-1 relative select-none pb-2 touch-manipulation cursor-default min-h-[420px]"
      onClick={(e) => {
        // Close context menu on any click
        if (contextMenu) {
          closeContextMenu();
          return;
        }
        if (isEditMode) {
          handleEditModeTap(e.target);
        }
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStartPosRef.current = { x: t.clientX, y: t.clientY };
        startLongPress(t.clientX, t.clientY, e.target);
      }}
      onTouchMove={(e) => {
        if (touchStartPosRef.current) {
          const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
          const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
          if (dx > 8 || dy > 8) cancelLongPress();
        }
      }}
      onTouchEnd={(e) => {
        // touchStartPosRef is cleared once the finger moves > 8px, so a
        // surviving ref on touchend means a tap. Click is suppressed on
        // draggable items (preventDefault in touchstart), handle it here.
        if (isEditMode && touchStartPosRef.current) {
          handleEditModeTap(e.target);
        }
        cancelLongPress();
      }}
      onMouseDown={(e) => startLongPress(e.clientX, e.clientY, e.target)}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
    >
      <ReactGridLayout
        className={`layout ${isEditMode ? 'edit-mode' : ''}`}
        layout={layout}
        cols={80}
        rowHeight={11}
        width={containerWidth}
        margin={[1, 1]}
        containerPadding={[4, 6]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        compactType="vertical"
        preventCollision={false}
        resizeHandles={['nw', 'ne', 'sw', 'se']}
        onDragStop={(currentLayout, _oldItem, newItem) => {
          handleGridLayoutChange(currentLayout);
          // Keep the dragged card selected so its handles stay available
          if (isEditMode && newItem?.i) setSelectedId(newItem.i);
        }}
        onResizeStop={(currentLayout) => {
          handleGridLayoutChange(currentLayout);
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-id={item.id}
            data-grid={item.layout}
            className={`transition-shadow ${
              isEditMode ? 'cursor-grab active:cursor-grabbing touch-none' : ''
            } ${isEditMode && selectedId === item.id ? 'selected-item' : ''}`}
          >
            {item.type === 'widget-clock' ? (
              <AtomicWidget item={item} isEditMode={isEditMode} grayMode={grayMode} />
            ) : item.type === 'app' ? (
              <AppIcon item={item} grayMode={grayMode} isEditMode={isEditMode} />
            ) : (
              <FolderCard
                item={item}
                grayMode={grayMode}
                isEditMode={isEditMode}
                onOpenFolder={onOpenFolder}
              />
            )}
          </div>
        ))}
      </ReactGridLayout>

      {/* Context Menu: 打开 / 卸载 */}
      {contextMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
            onTouchStart={closeContextMenu}
          />
          <div
            className="fixed z-50 min-w-[120px] rounded-xl bg-neutral-900/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden py-1"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 140),
              top: Math.min(contextMenu.y, window.innerHeight - 120),
            }}
          >
            <button
              onClick={() => handleOpen(contextMenu.item)}
              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              打开
            </button>
            <button
              onClick={() => handleUninstall(contextMenu.item)}
              className="w-full px-4 py-2.5 text-left text-sm text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 transition-colors border-t border-white/5"
            >
              卸载
            </button>
          </div>
        </>
      )}
    </div>
  );
};
