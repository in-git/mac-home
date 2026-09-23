import { useEffect } from 'react';
import { useAppInit } from './hooks/useAppInit';

import { HomeView } from './views/HomeView';
import { visitorApi } from './api/visitor';
import { LoadingOverlay } from './components/LoadingOverlay/LoadingOverlay';

export default function App() {


  // 应用启动初始化：全局点击音效
  useAppInit();

  // 进入页面上报访客信息（PV/UV/IP 统计），仅触发一次。
  useEffect(() => {
    visitorApi.report();
  }, []);


  return (
    <div className="h-[100dvh] bg-white w-full overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      <HomeView />
      {/**
       * 网页内的全屏 loading：由 loadingStore 驱动。
       *
       * 目前只服务于**视频播放**（等首帧出画）。
       * 打开网页卡片的 loading 不走这里 —— 在 App 内交给原生遮罩
       * （见 `utils/appBridge.ts`），在浏览器内是开新标签页、
       * 不需要遮罩遮掩当前页。
       */}
      <LoadingOverlay />
    </div>
  );
}
