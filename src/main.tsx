import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import MobileUnsupported from './views/MobileUnsupported.tsx';
import { ToastProvider } from './components/Toast.tsx';
import './index.css';

// 移动端检测：触屏 + 窄屏（或常见移动 UA）视为移动设备
const isMobile = (() => {
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const touchAndNarrow =
    'ontouchstart' in window && Math.min(window.innerWidth, window.innerHeight) < 768;
  return mobileUA || touchAndNarrow;
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>{isMobile ? <MobileUnsupported /> : <App />}</ToastProvider>
  </StrictMode>,
);
