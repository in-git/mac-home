declare module 'muuri' {
  export interface MuuriOptions {
    items?: any;
    showDuration?: number;
    showEasing?: string;
    hideDuration?: number;
    hideEasing?: string;
    visibleStyles?: object;
    hiddenStyles?: object;
    layout?: object | Function;
    layoutOnResize?: boolean | number;
    layoutOnInit?: boolean;
    layoutDuration?: number;
    layoutEasing?: string;
    sortData?: object;
    dragEnabled?: boolean;
    dragContainer?: HTMLElement | null;
    dragStartPredicate?: {
      distance?: number;
      delay?: number;
      handle?: string | boolean | HTMLElement | null;
    } | Function;
    dragAxis?: 'x' | 'y' | 'xy';
    dragHandle?: string | null;
    dragCssProps?: object;
    dragPlaceholder?: {
      enabled?: boolean;
      createElement?: ((item: any) => HTMLElement) | null;
      onCreate?: ((item: any, element: HTMLElement) => void) | null;
      onRemove?: ((item: any, element: HTMLElement) => void) | null;
    };
    dragSort?: boolean | Function | object;
    dragSortHeuristics?: {
      sortInterval?: number;
      minDragDistance?: number;
      minBounceBackDistance?: number;
    };
    dragSortPredicate?: {
      threshold?: number;
      action?: 'move' | 'swap';
      migrateAction?: 'move' | 'swap';
    } | Function;
    dragRelease?: {
      duration?: number;
      easing?: string;
      useMargin?: boolean;
    };
    dragHammerSettings?: object;
  }

  export interface Item {
    getElement(): HTMLElement;
  }

  export default class Muuri {
    constructor(element: string | HTMLElement, options?: MuuriOptions);
    static ItemDrag: {
      defaultStartPredicate(item: Item, e: MouseEvent): any;
    };
    on(event: string, handler: Function): this;
    off(event: string, handler?: Function): this;
    getElement(): HTMLElement;
    getItems(target?: any): any[];
    add(elements: HTMLElement | HTMLElement[], options?: { index?: number; layout?: boolean | string }): any[];
    remove(items: any[], options?: { removeElements?: boolean; layout?: boolean | string }): any[];
    destroy(removeElements?: boolean): this;
    refreshItems(items?: any[]): this;
    refreshSortData(): this;
    layout(instant?: boolean, callback?: Function): this;
    filter(predicate: string | Function, options?: { layout?: boolean | string }): this;
    sort(comparer: string | Function | any[], options?: { descending?: boolean; layout?: boolean | string }): this;
    move(item: any, toItem: any, options?: { action?: 'move' | 'swap' }): this;
  }
}
