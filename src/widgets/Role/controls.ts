import hotkeys from 'hotkeys-js';

export class RoleControls {
  private activeKeys = new Set<string>();
  private originalFilter: typeof hotkeys.filter;

  constructor() {
    this.originalFilter = hotkeys.filter;
    hotkeys.filter = () => true;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.activeKeys.add(e.code);
    this.activeKeys.add(e.key.toLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.activeKeys.delete(e.code);
    this.activeKeys.delete(e.key.toLowerCase());
  };

  private handleBlur = () => {
    this.activeKeys.clear();
  };

  /** 当前焦点是否在输入框/可编辑区域，避免 Space 在输入时被误判为跳跃 */
  private isTypingTargetFocused(): boolean {
    const el = document.activeElement as HTMLElement | null;
    return (
      !!el &&
      (el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable)
    );
  }

  public getKeyState() {
    const isLeft = this.activeKeys.has('ArrowLeft');
    const isRight = this.activeKeys.has('ArrowRight');
    const typing = this.isTypingTargetFocused();
    // 输入框聚焦时，Space 仅用于输入，不触发跳跃；方向键不受影响
    const isJump =
      !typing &&
      (this.activeKeys.has('ArrowUp') ||
        this.activeKeys.has('Space') ||
        this.activeKeys.has(' '));

    return { isLeft, isRight, isJump };
  }

  public destroy() {
    hotkeys.filter = this.originalFilter;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.activeKeys.clear();
  }
}
