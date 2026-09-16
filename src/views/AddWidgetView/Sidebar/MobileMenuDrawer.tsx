import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';

const TRANSITION_MS = 250;

interface MobileMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  title?: string;
}

/**
 * 移动端菜单抽屉：点击顶栏三横杠打开，全屏且从左向右滑入，
 * 右上角为关闭按钮；选中分类 / 按返回键 / 点关闭图标均会关闭。
 */
export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  open,
  onClose,
  activeCategory,
  onSelectCategory,
  title = '添加应用',
}) => {
  // 关闭时先播放滑出动画再卸载
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  /**
   * 历史记录补位的「哨兵」记录。
   *
   * 移动端系统返回键（Android 物理/手势返回）在单页应用里无法直接监听，
   * 常规做法是打开抽屉时 pushState 一条记录，返回键触发 popstate 时
   * 关闭抽屉而非离开页面。但这条记录必须在**任何**关闭路径下被消费掉，
   * 否则会残留：用户下次按返回键会「按了没反应」甚至退到 blank。
   *
   * 因此这里把「压入的哨兵记录」与「当前的哨兵记录」分开记录：
   * - pushedEntry：本次打开时是否真的压入了记录
   * - markerState：压入的记录对应的 state 对象（用引用判定归属，
   *   避免依赖 history.state 的内容，也不会被其它 pushState 误伤）
   */
  const pushedRef = useRef(false);
  const markerRef = useRef<{ drawer: true } | null>(null);
  /**
   * 是否由「系统返回键 / 手势」关闭。
   * 返回键在移动端同时承担「退出页面」的语义：哨兵记录已被这次返回消费掉，
   * 若还想让用户真正离开页面，需要再回退一次。
   */
  const [pendingExit, setPendingExit] = useState(false);

  /**
   * 消费哨兵记录（统一收口）。
   *
   * 关键：只有当栈顶仍是**我们自己压入的那条记录**时才回退，且只消费一次。
   * 若用 history.state?.drawer 判断，会在 popstate 回调外部误判，
   * 导致把整个页面带回上一条历史（表现为「切分类后页面变空白」）。
   *
   * @param keepPage 为 true 时（点关闭图标 / 选中分类）只清理自己的记录、
   *   绝不跨文档回退；为 false 时（返回键）允许退到上一条记录真正离开页面。
   */
  const consumeMarker = (keepPage: boolean) => {
    if (!pushedRef.current || markerRef.current === null) return;
    pushedRef.current = false;
    const marker = markerRef.current;
    markerRef.current = null;
    // 栈顶已不是我方记录（例如被其它 pushState 覆盖），什么都不要做
    if (window.history.state !== marker) return;
    // 保守判断：history.length <= 1 说明没有上一条记录可退，避免退到 blank
    if (keepPage && window.history.length <= 1) return;
    window.history.back();
  };

  /** 用户主动关闭（关闭图标 / ESC / 选中分类）：只清理自己的哨兵记录，不离开页面 */
  const handleClose = () => {
    consumeMarker(true);
    onClose();
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  // 抽屉打开时：ESC 关闭，并接管系统返回键（Android 返回手势/键）用于关闭抽屉
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // 压入哨兵记录；用引用记住这条记录，供后续精确判定归属
    const marker = { drawer: true as const };
    window.history.pushState(marker, '');
    markerRef.current = marker;
    pushedRef.current = true;

    const onPopState = () => {
      // 只有「我方哨兵已被这次返回消费」才视为返回键关闭抽屉。
      // 若栈顶仍是我方哨兵（其它代码触发的前进/后退），忽略。
      if (window.history.state === markerRef.current) return;
      // 返回键语义：抽屉关闭后继续离开页面（哨兵已被消费，再退一次）
      pushedRef.current = false;
      markerRef.current = null;
      setPendingExit(true);
      onClose();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      // 组件卸载兜底：若哨兵仍在栈顶（走 onClose 之外的路径关闭），清理掉
      consumeMarker(true);
    };
  }, [open, onClose]);

  // 返回键关闭抽屉后，再回退一次让用户真正离开页面
  useEffect(() => {
    if (!pendingExit) return;
    const t = window.setTimeout(() => {
      if (window.history.length > 1) window.history.back();
      setPendingExit(false);
    }, TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [pendingExit]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] sm:hidden">
      <div
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(-100%)',
          transition: `transform ${TRANSITION_MS}ms ease-out`,
        }}
        className="flex h-full w-full flex-col bg-[#F2F2F7] dark:bg-[#2C2C2E]"
      >
        {/* 顶部标题栏：右侧关闭图标 */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/5 px-3 dark:border-white/10">
          <h1 className="text-font-title dark:text-white">{title}</h1>
          <button
            type="button"
            onClick={handleClose}
            aria-label="关闭菜单"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5 active:scale-95 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNav
          activeCategory={activeCategory}
          onSelect={(id) => {
            onSelectCategory(id);
            handleClose();
          }}
        />

        <div className="mt-auto">
          <SidebarFooter />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MobileMenuDrawer;
