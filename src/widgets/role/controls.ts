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

  public getKeyState() {
    const isLeft = this.activeKeys.has('ArrowLeft');
    const isRight = this.activeKeys.has('ArrowRight');
    const isJump =
      this.activeKeys.has('ArrowUp') ||
      this.activeKeys.has('Space') ||
      this.activeKeys.has(' ');

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
