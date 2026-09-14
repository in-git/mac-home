import { useEffect } from 'react';
import { useAppInit } from './hooks/useAppInit';
import { useThemeVariables } from './hooks/useThemeVariables';
import { DEFAULT_APPEARANCE } from './types';
import { AddWidgetView } from './views/AddWidgetView';
import { visitorApi } from './api/visitor';

export default function App() {
  // 外观：固定默认值，只用于写入 CSS 变量（深浅色 / 主题色 / 字号 / 圆角）
  useThemeVariables(DEFAULT_APPEARANCE);

  // 应用启动初始化：全局点击音效
  useAppInit();

  // 进入页面上报访客信息（PV/UV/IP 统计），仅触发一次。
  useEffect(() => {
    visitorApi.report();
  }, []);


  // 桌面即「添加网页」，铺满整个视口。
  return (
    <div className="h-[100dvh] w-full overflow-hidden font-sans selection:bg-[color:var(--accent)] selection:text-white">
      <AddWidgetView />
    </div>
  );
}
