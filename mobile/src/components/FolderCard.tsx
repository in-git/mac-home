import React, { useState, useRef, useLayoutEffect } from 'react';
import { DesktopItem, SubApp } from '../types';

interface FolderCardProps {
  item: DesktopItem;
  grayMode?: boolean;
  isEditMode?: boolean;
  onOpenFolder?: (item: DesktopItem) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  item,
  grayMode = true,
  isEditMode = false,
  onOpenFolder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const subApps = item.subApps || [];
  const totalCount = subApps.length;

  // Initial capacity estimate before first JS layout measurement
  const [capacity, setCapacity] = useState<number>(() => {
    if (item.type === 'capsule') return 4;
    if (item.type === 'folder-vertical') return 3;
    if (item.type === 'folder-mini') return 9;
    return 9;
  });

  const [gridColumns, setGridColumns] = useState<number>(3);

  // JS 动态获取文件夹大小及内部 icon 大小，计算可容纳数量
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureAndCalculate = () => {
      if (!container) return;

      // 1. JS 获取文件夹的大小
      const containerRect = container.getBoundingClientRect();
      const folderWidth = containerRect.width || container.clientWidth;
      const folderHeight = containerRect.height || container.clientHeight;

      if (folderWidth <= 0 || folderHeight <= 0) return;

      // 2. JS 获取内部的 icon 大小
      const iconEl = container.querySelector('.folder-subapp-icon') as HTMLElement;
      let iconW = 36;
      let iconH = 36;

      if (iconEl) {
        const iconRect = iconEl.getBoundingClientRect();
        if (iconRect.width > 0 && iconRect.height > 0) {
          iconW = iconRect.width;
          iconH = iconRect.height;
        }
      } else {
        if (item.type === 'folder-mini') {
          iconW = 12;
          iconH = 12;
        } else if (item.type === 'folder-vertical') {
          iconW = 40;
          iconH = 40;
        }
      }

      // 获取容器内边距与间距
      const style = window.getComputedStyle(container);
      const padLeft = parseFloat(style.paddingLeft) || 8;
      const padRight = parseFloat(style.paddingRight) || 8;
      const padTop = parseFloat(style.paddingTop) || 8;
      const padBottom = parseFloat(style.paddingBottom) || 8;

      const gapX = parseFloat(style.columnGap) || 6;
      const gapY = parseFloat(style.rowGap) || 6;

      const availWidth = Math.max(0, folderWidth - (padLeft + padRight));
      const availHeight = Math.max(0, folderHeight - (padTop + padBottom));

      let maxFit = 9;

      if (item.type === 'capsule') {
        // 单行横向胶囊
        const cols = Math.max(1, Math.floor((availWidth + gapX) / (iconW + gapX)));
        maxFit = cols;
      } else if (item.type === 'folder-vertical') {
        // 单列竖向排列
        const rows = Math.max(1, Math.floor((availHeight + gapY) / (iconH + gapY)));
        maxFit = rows;
      } else if (item.type === 'folder-mini') {
        // 1x1 迷你文件夹 3x3 点阵
        const cols = Math.max(1, Math.floor((availWidth + 4) / (iconW + 4)));
        const rows = Math.max(1, Math.floor((availHeight + 4) / (iconH + 4)));
        maxFit = Math.min(9, cols * rows);
      } else {
        // 大文件夹（folder-large）网格布局
        const cols = Math.max(1, Math.floor((availWidth + gapX) / (iconW + gapX)));
        const rows = Math.max(1, Math.floor((availHeight + gapY) / (iconH + gapY)));
        setGridColumns(cols);
        maxFit = cols * rows;
      }

      if (maxFit > 0) {
        setCapacity(maxFit);
      }
    };

    measureAndCalculate();

    const resizeObserver = new ResizeObserver(() => {
      measureAndCalculate();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [item.type, subApps.length]);

  // 判断是否超出空间容量
  const isOverflow = totalCount > capacity;
  // 如果空间不够，隐藏超出的应用，仅渲染能容纳的个数
  const visibleApps = isOverflow ? subApps.slice(0, capacity) : subApps;

  // Determine custom background styling for special folders (e.g. OriginOS soft blue Tools card)
  const getContainerBg = () => {
    if (grayMode) {
      return 'bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/60 shadow-[0_4px_16px_rgba(0,0,0,0.3)]';
    }

    if (item.id === 'item-tools-large') {
      return 'bg-gradient-to-br from-sky-400/80 via-blue-500/70 to-indigo-600/80 backdrop-blur-2xl border border-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)]';
    }

    return 'bg-white/20 backdrop-blur-2xl border border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.25)]';
  };

  // Render a mini app icon inside folder preview
  const renderMiniApp = (sub: SubApp, sizeClass = 'w-9 h-9') => {
    if (grayMode) {
      return (
        <div
          key={sub.id}
          className={`folder-subapp-icon ${sizeClass} rounded-[10px] bg-neutral-700/80 border border-neutral-600/50 flex items-center justify-center  font-medium text-neutral-300 shadow-xs select-none shrink-0`}
          title={sub.name}
        >
          {sub.symbol || sub.name.slice(0, 1)}
        </div>
      );
    }

    // Color mode
    return (
      <div
        key={sub.id}
        style={{ backgroundColor: sub.color || '#4b5563' }}
        className={`folder-subapp-icon ${sizeClass} rounded-[10px] flex items-center justify-center  font-bold text-white shadow-xs select-none border border-white/10 shrink-0`}
        title={sub.name}
      >
        {sub.symbol || sub.name.slice(0, 1)}
      </div>
    );
  };

  // 1. MINI FOLDER (1x1 standard icon size, like "社交", "工具")
  if (item.type === 'folder-mini') {
    return (
      <div className="w-full h-full flex flex-col items-center select-none relative group min-h-0">
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div
            ref={containerRef}
            onClick={() => !isEditMode && onOpenFolder?.(item)}
            className={`aspect-square h-full max-w-full rounded-[14px] p-1.5 flex items-center justify-center relative cursor-pointer active:scale-95 transition-all duration-200 ${
              grayMode
                ? 'bg-neutral-800/85 backdrop-blur-md border border-neutral-700/60 shadow-[0_4px_12px_rgba(0,0,0,0.35)]'
                : 'bg-white/20 backdrop-blur-xl border border-white/25 shadow-md'
            } ${isEditMode ? 'ring-2 ring-blue-400/60 animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}`}
          >
            {/* 超出时在文件夹上方显示的全部文件总个数角标 */}
            {isOverflow && !isEditMode && (
              <span
                className="absolute -top-1.5 -right-1.5 z-20 min-w-[18px] h-[18px] px-1 rounded-full  text-white text-md font-bold flex items-center justify-center border border-white/80 shadow-md pointer-events-none"
                title={`共 ${totalCount} 个应用`}
              >
                {totalCount}
              </span>
            )}

            {/* 3x3 tiny preview dots (hidden overflow) */}
            <div className="grid grid-cols-3 gap-1 w-full h-full items-center justify-items-center">
              {visibleApps.map((sub) => (
                <span
                  key={sub.id}
                  style={!grayMode && sub.color ? { backgroundColor: sub.color } : {}}
                  className={`folder-subapp-icon w-3 h-3 rounded-[4px] flex items-center justify-center text-[7px] font-bold text-white leading-none shrink-0 ${
                    grayMode ? 'bg-neutral-600' : ''
                  }`}
                >
                  {sub.symbol?.slice(0, 1) || ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        <span className=" font-medium text-white/95 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] text-center truncate w-full mt-1 leading-tight shrink-0">
          {item.name || item.title}
        </span>
      </div>
    );
  }

  // 2. CAPSULE (Horizontal bar with apps, like "购物", "办事", "工具")
  if (item.type === 'capsule') {
    return (
      <div className="w-full h-full flex flex-col items-center select-none relative group min-h-0">
        <div
          ref={containerRef}
          onClick={() => !isEditMode && onOpenFolder?.(item)}
          className={`flex-1 min-h-0 w-full rounded-[16px] px-3 flex items-center justify-around cursor-pointer active:scale-98 transition-all duration-200 relative overflow-visible ${getContainerBg()} ${
            isEditMode ? 'ring-2 ring-blue-400/60 animate-[wiggle_0.3s_ease-in-out_infinite]' : ''
          }`}
        >
          {/* 超出时在文件夹上方显示的全部文件总个数角标 */}
          {isOverflow && !isEditMode && (
            <span
              className="absolute -top-1.5 -right-1.5 z-20 min-w-[20px] h-5 px-1.5 rounded-full  text-white text-[10.5px] font-bold flex items-center justify-center border-2 border-neutral-900/80 shadow-md pointer-events-none"
              title={`共 ${totalCount} 个应用`}
            >
              {totalCount}
            </span>
          )}

          {visibleApps.map((sub) => (
            <div key={sub.id} className="flex flex-col items-center shrink-0">
              {renderMiniApp(sub, 'w-9 h-9')}
            </div>
          ))}
        </div>

        <span className=" font-medium text-white/95 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] text-center mt-1 leading-tight shrink-0">
          {item.name || item.title}
        </span>
      </div>
    );
  }

  // 3. VERTICAL FOLDER (e.g. "小米" 1x2 card)
  if (item.type === 'folder-vertical') {
    return (
      <div className="w-full h-full flex flex-col items-center select-none relative group min-h-0">
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div
            ref={containerRef}
            onClick={() => !isEditMode && onOpenFolder?.(item)}
            className={`aspect-square h-full max-w-full rounded-[16px] py-2.5 px-1.5 flex flex-col items-center justify-between cursor-pointer active:scale-98 transition-all duration-200 relative overflow-visible ${getContainerBg()} ${
              isEditMode ? 'ring-2 ring-blue-400/60 animate-[wiggle_0.3s_ease-in-out_infinite]' : ''
            }`}
          >
            {/* 超出时在文件夹上方显示的全部文件总个数角标 */}
            {isOverflow && !isEditMode && (
              <span
                className="absolute -top-1.5 -right-1.5 z-20 min-w-[18px] h-[18px] px-1 rounded-full  text-white text-md font-bold flex items-center justify-center border border-white/80 shadow-md pointer-events-none"
                title={`共 ${totalCount} 个应用`}
              >
                {totalCount}
              </span>
            )}

            {visibleApps.map((sub) => (
              <div key={sub.id} className="flex flex-col items-center shrink-0">
                {renderMiniApp(sub, 'w-10 h-10')}
              </div>
            ))}
          </div>
        </div>

        <span className=" font-medium text-white/95 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] text-center mt-1 leading-tight shrink-0">
          {item.name || item.title}
        </span>
      </div>
    );
  }

  // 4. LARGE FOLDER (grid, e.g. "影音娱乐", "工具", "生活", "文件夹")
  return (
    <div className="w-full h-full flex flex-col items-center select-none relative group min-h-0">
      {/* Large folder container */}
      <div
        ref={containerRef}
        onClick={() => !isEditMode && onOpenFolder?.(item)}
        className={`flex-1 min-h-0 w-full rounded-[18px] p-2.5 cursor-pointer active:scale-98 transition-all duration-200 flex flex-col justify-between relative overflow-visible ${getContainerBg()} ${
          isEditMode ? 'ring-2 ring-blue-400/60 animate-[wiggle_0.3s_ease-in-out_infinite]' : ''
        }`}
      >
        {/* 超出时在文件夹上方显示的全部文件总个数角标 */}
        {isOverflow && !isEditMode && (
          <span
            className="absolute -top-1.5 -right-1.5 z-20 min-w-[20px] h-5 px-1.5 rounded-full  text-white text-[10.5px] font-bold flex items-center justify-center border-2 border-neutral-900/80 shadow-md pointer-events-none"
            title={`共 ${totalCount} 个应用`}
          >
            {totalCount}
          </span>
        )}

        <div
          className="grid gap-1.5 h-full items-center justify-items-center w-full"
          style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
        >
          {visibleApps.map((sub) => (
            <div key={sub.id} className="flex flex-col items-center justify-center shrink-0">
              {renderMiniApp(sub, 'w-9 h-9')}
            </div>
          ))}
        </div>
      </div>

      <span className=" font-medium text-white/95 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] text-center mt-1 leading-tight shrink-0">
        {item.name || item.title}
      </span>
    </div>
  );
};
