import type { WidgetProps } from '../types';

interface MiniAppWidgetProps extends WidgetProps {
  /** 要渲染进 iframe 的 HTML 源码 */
  html?: string;
}

/**
 * 迷你应用组件：将传入的 HTML 源码（html 参数）渲染到一个全尺寸 iframe 中。
 * 不渲染标题栏（header 由 WidgetTypeConfig.showHeader 控制为 false），
 * 支持任意 size 并自动填满卡片容器；内部内容超过 400px 时滚动。
 */
export const MiniAppWidget: React.FC<MiniAppWidgetProps> = ({ html }) => {
  return (
    <div className="max-h-[400px] w-full overflow-auto">
      <iframe
        title="迷你应用"
        srcDoc={html ?? ''}
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
        className="min-h-full w-full border-0"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};
