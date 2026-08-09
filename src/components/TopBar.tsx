import {
  Battery,
  CloudSun,
  Image as ImageIcon,
  Moon,
  Sun,
  Volume2,
  Wifi,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { LoginModal } from '../views/login/LoginModal';
import { LoginUser, doLogout, clearStoredAuth } from '../api/auth';

interface Props {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenWallpaperModal: () => void;
  weatherTemp?: string;
  currentUser?: LoginUser | null;
  onLoginSuccess: (user: LoginUser) => void;
  onLogout: () => void;
}

export const TopBar: React.FC<Props> = ({
  isDarkMode,
  onToggleDarkMode,
  isEditMode,
  onToggleEditMode,
  onOpenWallpaperModal,
  weatherTemp = '26°C',
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      );
      setDateStr(
        now.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
          weekday: 'short',
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await doLogout();
    } catch {
      /* 忽略退出接口异常，本地清理即可 */
    } finally {
      clearStoredAuth();
      setIsLoggingOut(false);
      setIsLogoutOpen(false);
      onLogout();
    }
  };

  const displayName =
    currentUser?.nickname ||
    currentUser?.realName ||
    currentUser?.account ||
    '未登录';

  return (
    <header className="sticky top-0 z-50 w-full h-8 px-3 glass-panel flex items-center justify-between text-xs font-medium border-b border-white/20 dark:border-white/10 select-none shadow-xs">
      {/* Left Menu Items */}
      <div className="flex items-center space-x-3">
        <span className="font-semibold text-slate-800 dark:text-slate-100 hidden sm:inline">
          吴文龙的实验室
        </span>
      </div>

      {/* Center spacer */}

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-slate-700 dark:text-slate-200">
        {/* Login / User */}
        {currentUser ? (
          <button
            onClick={() => setIsLogoutOpen(true)}
            className="flex items-center space-x-1.5 px-1.5 py-0.5 rounded-[var(--card-radius)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors max-w-[120px]"
            title="点击退出登录"
          >
            <UserIcon size={14} />
            <span className="hidden sm:inline truncate">{displayName}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsLoginOpen(true)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-[var(--card-radius)] bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-colors"
          >
            <UserIcon size={14} />
            <span>登录</span>
          </button>
        )}

        {/* Weather Quick Stat */}
        <div className="hidden md:flex items-center space-x-1 text-font-sm font-medium bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-[var(--card-radius)]">
          <CloudSun size={13} className="text-amber-500" />
          <span>上海 {weatherTemp}</span>
        </div>

        {/* Wallpaper Picker Toggle */}
        <button
          onClick={onOpenWallpaperModal}
          className="p-1 rounded-[var(--card-radius)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="切换动态/静态壁纸"
        >
          <ImageIcon size={14} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1 rounded-[var(--card-radius)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title={isDarkMode ? '切换浅色模式' : '切换深色模式'}
        >
          {isDarkMode ? (
            <Sun size={14} className="text-amber-400" />
          ) : (
            <Moon size={14} className="text-slate-700" />
          )}
        </button>

        {/* Status System Icons */}
        <div className="hidden lg:flex items-center space-x-1.5 opacity-80">
          <Wifi size={13} />
          <Volume2 size={13} />
          <Battery size={14} />
        </div>

        {/* Time and Date */}
        <div className="flex items-center space-x-1 font-semibold text-font-sm pl-1">
          <span className="hidden sm:inline opacity-70">{dateStr}</span>
          <span>{timeStr}</span>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={onLoginSuccess}
      />

      <Modal
        isOpen={isLogoutOpen}
        onClose={() => !isLoggingOut && setIsLogoutOpen(false)}
        title="退出登录"
        icon={<LogOut size={18} className="text-red-500" />}
        maxWidth="max-w-xs"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            确定要退出登录吗？
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsLogoutOpen(false)}
              disabled={isLoggingOut}
              className="rounded-[var(--card-radius)] bg-black/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-[var(--card-radius)] bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              {isLoggingOut && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              退出登录
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
