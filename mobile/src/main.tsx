import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 进入页面时重置所有本地存储，确保每次加载都使用初始预设数据
try {
  localStorage.clear();
  sessionStorage.clear();
} catch {
  // 存储不可用时忽略（如隐私模式）
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
