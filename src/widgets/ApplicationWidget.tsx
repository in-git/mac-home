import type { WidgetProps } from '../types';

interface ApplicationWidgetProps extends WidgetProps {
  /** 要渲染进 iframe 的 HTML 源码 */
  html?: string;
}

/**
 * 应用组件：将传入的 HTML 源码（html 参数）渲染到一个全尺寸 iframe 中。
 * 不渲染标题栏（header 由 WidgetTypeConfig.showHeader 控制为 false），
 * 支持任意 size 并自动填满卡片容器。
 */
export const ApplicationWidget: React.FC<ApplicationWidgetProps> = ({
  html,
}) => {
  return (
    <iframe
      title="application"
      srcDoc={html ?? ''}
      sandbox="allow-scripts allow-forms allow-popups allow-modals"
      className="h-full w-full border-0"
      style={{ background: 'transparent' }}
    />
  );
};
