import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import MobileUnsupported from './views/MobileUnsupported';
import { ToastProvider } from './components/Toast.tsx';
import { isMobileDevice } from './utils/device';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ToastProvider>{isMobileDevice() ? <MobileUnsupported /> : <App />}</ToastProvider>,
);
