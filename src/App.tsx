import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { confirm } from './components/confirm/confirm';
import { useAppInit } from './hooks/useAppInit';
import { useThemeVariables } from './hooks/useThemeVariables';
import { useHomeStore } from './store/useHomeStore';
import { AddWidgetView } from './views/AddWidgetView';
import { visitorApi } from './api/visitor';
import { CURRENT_DATA_VERSION } from './utils/migration';

export default function App() {
  // 主题相关状态：仅用于写入 CSS 变量（深浅色 / 主题色 / 字号 / 圆角）
  const { isDarkMode, themeColor, fontVariant, cardRadius } = useHomeStore(
    useShallow((s) => ({
      isDarkMode: s.isDarkMode,
      themeColor: s.themeColor,
      fontVariant: s.fontVariant,
      cardRadius: s.cardRadius,
    })),
  );

  useThemeVariables({ isDarkMode, themeColor, fontVariant, cardRadius });

  // 应用启动初始化：全局点击音效
  useAppInit();

  // 进入页面上报访客信息（PV/UV/IP 统计），仅触发一次。
  useEffect(() => {
    visitorApi.report();
  }, []);

  // 版本一致性检测（诊断用）：对比代码目标版本、默认数据版本与本地持久化数据版本，
  // 不一致说明本地数据为旧版本，刷新后会走增量迁移/补全逻辑。
  useEffect(() => {
    const currentVersion = CURRENT_DATA_VERSION;

    let persistedVersion: number | undefined;
    try {
      const raw = localStorage.getItem('apple-homepage-store');
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { version?: number } };
        persistedVersion = parsed.state?.version;
      }
    } catch {
      persistedVersion = undefined;
    }

    const persistedConsistent = persistedVersion === currentVersion;

    if (!persistedConsistent) {
      console.warn(
        `[版本检测] 本地持久化数据版本(${persistedVersion ?? '无'})与代码目标版本(${currentVersion})不一致，将在下次写入时升级为 ${currentVersion}。`,
      );
      // 本地已有旧版本数据（非首次访问）且与当前系统版本不一致时，提示用户重置系统。
      // 确认后恢复默认配置并持久化，版本号随之对齐为 CURRENT_DATA_VERSION，避免反复提示。
      if (persistedVersion !== undefined) {
        confirm({
          title: '检测到数据版本不一致',
          body: `本地保存的数据版本（v${persistedVersion}）与当前系统版本（v${currentVersion}）不一致，可能存在兼容性问题。建议重置系统恢复默认配置，此操作不可撤销；也可以选择「继续使用」由系统自动迁移数据。`,
          confirmText: '重置系统',
          cancelText: '继续使用',
          danger: true,
          onConfirm: () => {
            useHomeStore.getState().resetAll();
          },
        });
      }
    }
  }, []);

  // 桌面即「添加网页」，铺满整个视口。
  return (
    <div className="h-[100dvh] w-full overflow-hidden font-sans selection:bg-[color:var(--accent)] selection:text-white">
      <AddWidgetView />
    </div>
  );
}
