import { useState, useEffect, useRef } from 'react';
import { initialDesktopConfig } from './data/initialDesktop';
import { DesktopConfig, DesktopItem } from './types';
import { DesktopGrid } from './components/DesktopGrid';
import { EditModal } from './components/EditModal';
import { JsonDrawer } from './components/JsonDrawer';
import { FolderModal } from './components/FolderModal';

// Helper to normalize and ensure full SiteItem compatibility
const normalizeConfig = (raw: DesktopConfig): DesktopConfig => {
  return {
    ...raw,
    items: (raw.items || []).map((it) => {
      const name = it.name || it.title || '应用';
      const logo = it.logo || it.iconName;
      const background = it.background || it.iconColor;
      return {
        ...it,
        name,
        title: name,
        logo,
        iconName: logo,
        background,
        iconColor: background,
      };
    }),
    dockItems: (raw.dockItems || []).map((d) => {
      const name = d.name || '应用';
      const logo = d.logo || d.iconName;
      const background = d.background || d.iconColor;
      return {
        ...d,
        name,
        logo,
        iconName: logo,
        background,
        iconColor: background,
      };
    }),
  };
};

export default function App() {
  // Load saved configuration from localStorage or default
  const [config, setConfig] = useState<DesktopConfig>(() => {
    const savedV3 = localStorage.getItem('desktop_config_v3');
    if (savedV3) {
      try {
        return normalizeConfig(JSON.parse(savedV3));
      } catch {
        // fallback
      }
    }
    const savedV2 = localStorage.getItem('desktop_config_v2');
    if (savedV2) {
      try {
        return normalizeConfig(JSON.parse(savedV2));
      } catch {
        // fallback
      }
    }
    return normalizeConfig(initialDesktopConfig);
  });

  // State
  const [grayMode] = useState<boolean>(true); // User requested: "应用icon使用gray占位"
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<DesktopItem | null>(null);
  const [activeFolderItem, setActiveFolderItem] = useState<DesktopItem | null>(null);
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState<boolean>(false);

  // Drag-and-drop state between Desktop and Bottom Dock
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('desktop_config_v3', JSON.stringify(config));
  }, [config]);

  // Layout change handler from react-grid-layout
  const handleLayoutChange = (newItems: DesktopItem[]) => {
    setConfig((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      items: newItems,
    }));
  };

  // Save edited app properties from modal
  const handleSaveItem = (updatedItem: DesktopItem) => {
    const finalName = updatedItem.name || updatedItem.title || '未命名';
    const finalLogo = updatedItem.logo || updatedItem.iconName;
    const finalBg = updatedItem.background || updatedItem.iconColor;

    const normalized: DesktopItem = {
      ...updatedItem,
      name: finalName,
      title: finalName,
      logo: finalLogo,
      iconName: finalLogo,
      background: finalBg,
      iconColor: finalBg,
    };

    setConfig((prev) => {
      const exists = prev.items.some((it) => it.id === normalized.id);
      let newItems: DesktopItem[];
      if (exists) {
        newItems = prev.items.map((it) => (it.id === normalized.id ? normalized : it));
      } else {
        newItems = [...prev.items, normalized];
      }
      return {
        ...prev,
        lastUpdated: new Date().toISOString(),
        items: newItems,
      };
    });
  };

  // Delete item handler
  const handleDeleteItem = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      lastUpdated: new Date().toISOString(),
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  // Add new app
  const handleAddNewApp = () => {
    const newId = `app-${Date.now()}`;
    const newItem: DesktopItem = {
      id: newId,
      name: '新应用',
      title: '新应用',
      type: 'app',
      logo: 'camera',
      iconName: 'camera',
      background: '#3b82f6',
      iconColor: '#3b82f6',
      showInSystem: true,
      createTime: new Date().toISOString(),
      layout: {
        i: newId,
        x: 0,
        y: 8,
        w: 1,
        h: 1,
      },
    };
    setEditingItem(newItem);
  };

  // Reset to initial preset
  const handleReset = () => {
    setConfig(normalizeConfig(initialDesktopConfig));
    localStorage.removeItem('desktop_config_v3');
    localStorage.removeItem('desktop_config_v2');
    setIsEditMode(false);
    showToast('已重置桌面');
  };

  // Import JSON from backend
  const handleImportConfig = (newConfig: DesktopConfig) => {
    setConfig(normalizeConfig(newConfig));
    setIsEditMode(false);
  };

  return (
    <div className="w-full h-screen h-[100dvh] bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans sm:p-3">
      {/* Mobile Shell Container */}
      <div
        className="w-full max-w-[430px] h-full sm:h-[94vh] sm:max-h-[890px] flex flex-col relative overflow-hidden shadow-2xl bg-black select-none sm:rounded-[40px] sm:border-[8px] sm:border-neutral-800"
        onWheel={(e) => {
          if (desktopScrollRef.current && !desktopScrollRef.current.contains(e.target as Node)) {
            desktopScrollRef.current.scrollTop += e.deltaY;
          }
        }}
        onClick={(e) => {
          if (isEditMode) {
            const target = e.target as HTMLElement;
            if (
              !target.closest('.react-grid-item') &&
              !target.closest('button')
            ) {
              setIsEditMode(false);
            }
          }
        }}
      >
        {/* Fujiwara Tofu Shop Wallpaper with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: `url('/wallpaper.jpg')`,
            backgroundPosition: 'center 45%',
          }}
        >
          {/* Subtle contrast gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/60 pointer-events-none" />
        </div>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-neutral-900/90 text-white text-xs font-medium backdrop-blur-md border border-white/15 shadow-xl pointer-events-none animate-fade-in flex items-center gap-1.5">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Desktop Grid with react-grid-layout - Scrollable desktop area */}
        <div
          ref={desktopScrollRef}
          id="desktop-scroll-area"
          className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-start pt-2 pb-2 overscroll-contain select-none touch-pan-y"
          onClick={(e) => {
            if (isEditMode) {
              const target = e.target as HTMLElement;
              if (
                !target.closest('.react-grid-item') &&
                !target.closest('button')
              ) {
                setIsEditMode(false);
              }
            }
          }}
        >
          <DesktopGrid
            items={config.items}
            grayMode={grayMode}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            onLayoutChange={handleLayoutChange}
            onEditItem={(item) => setEditingItem(item)}
            onDeleteItem={handleDeleteItem}
            onOpenFolder={(item) => setActiveFolderItem(item)}
          />
        </div>

        {/* Shared Screen-Center Folder Modal */}
        <FolderModal
          item={activeFolderItem}
          grayMode={grayMode}
          onClose={() => setActiveFolderItem(null)}
          onAppClick={(subApp) => {
            showToast(`打开应用: ${subApp.name}`);
          }}
        />

        {/* Edit App Properties Modal */}
        <EditModal
          isOpen={editingItem !== null}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
        />

        {/* Backend Interface JSON Config Drawer */}
        <JsonDrawer
          isOpen={isJsonDrawerOpen}
          config={config}
          onClose={() => setIsJsonDrawerOpen(false)}
          onImport={handleImportConfig}
          onReset={handleReset}
          onAddNewApp={handleAddNewApp}
        />
      </div>
    </div>
  );
}
