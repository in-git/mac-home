import { useEffect } from 'react';
import { useAppInit } from './hooks/useAppInit';

import { AddWidgetView } from './views/AddWidgetView';
import { visitorApi } from './api/visitor';

export default function App() {


  // 应用启动初始化：全局点击音效
  useAppInit();

  // 进入页面上报访客信息（PV/UV/IP 统计），仅触发一次。
  useEffect(() => {
    visitorApi.report();
  }, []);


  // 桌面即「添加网页」，铺满整个视口。
  return (
    <div className="h-[100dvh] w-full overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      <AddWidgetView />
    </div>
  );
}
