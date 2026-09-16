import { SiteIdentity, SiteItem } from '@/api/site';

export interface WebListPickerProps {
  /** 点击卡片打开站点时的回调；缺省时在新窗口打开 */
  onOpen?: (item: SiteItem) => void;
  /** 已收藏的站点列表；传入后用于标记卡片的收藏态 */
  favorites?: SiteItem[];
  /** 切换某个站点的收藏状态；不传则不展示收藏按钮 */
  onToggleFavorite?: (item: SiteItem) => void;
  /**
   * 分类栏显隐变化（随列表滚动方向折叠 / 展开），
   * 供父级联动其它元素（如移动端顶部导航）。
   */
  onVisibilityChange?: (visible: boolean) => void;
  /** 移动端：点击三横杠，由父级打开全屏菜单抽屉 */
  onOpenMenu?: () => void;
}

export type { SiteIdentity, SiteItem };
