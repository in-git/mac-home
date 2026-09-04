import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload, RotateCcw, Code2, Server, Plus } from 'lucide-react';
import { DesktopConfig } from '../types';

interface JsonDrawerProps {
  isOpen: boolean;
  config: DesktopConfig;
  onClose: () => void;
  onImport: (newConfig: DesktopConfig) => void;
  onReset: () => void;
  onAddNewApp: () => void;
}

export const JsonDrawer: React.FC<JsonDrawerProps> = ({
  isOpen,
  config,
  onClose,
  onImport,
  onReset,
  onAddNewApp,
}) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'json' | 'api'>('json');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportArea, setShowImportArea] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(config, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desktop_config_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed.items || !Array.isArray(parsed.items)) {
        throw new Error('无效的 JSON 格式：必须包含 items 数组');
      }
      onImport(parsed as DesktopConfig);
      setShowImportArea(false);
      setImportText('');
      setImportError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '解析失败，请检查 JSON 格式';
      setImportError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end animate-fade-in select-text"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85vh] bg-neutral-900 border-t border-neutral-700/80 rounded-t-[32px] p-4 flex flex-col shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Handle */}
        <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-3" />

        {/* Title & Controls */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold tracking-tight text-neutral-100">
              后端接口 JSON 数据中心
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab('json')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'json' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            实时桌面数据 JSON
          </button>
          <button
            onClick={() => setTab('api')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              tab === 'api' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            后端 API 规范说明
          </button>
        </div>

        {/* Content */}
        {tab === 'json' ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 font-medium transition-colors border border-neutral-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '一键复制'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 font-medium transition-colors border border-neutral-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出 JSON
                </button>
                <button
                  onClick={() => setShowImportArea(!showImportArea)}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1 font-medium transition-colors border border-neutral-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  导入 JSON
                </button>
              </div>

              <button
                onClick={onAddNewApp}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 flex items-center gap-1 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                新增应用
              </button>

              <button
                onClick={() => {
                  if (confirm('确定将桌面布局还原为截图初始预设吗？')) {
                    onReset();
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 flex items-center gap-1 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置预设
              </button>
            </div>

            {/* Import area drawer */}
            {showImportArea && (
              <div className="p-3 mb-2 rounded-xl bg-neutral-800/90 border border-neutral-700 flex flex-col gap-2 animate-fade-in">
                <span className="text-xs text-neutral-300 font-medium">
                  粘贴后端返回的 DesktopConfig JSON:
                </span>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"version":"1.0.0","items":[...]}'
                  rows={4}
                  className="w-full p-2 text-xs font-mono bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-200 focus:outline-none focus:border-blue-500"
                />
                {importError && (
                  <span className="text-[11px] text-rose-400 font-medium">{importError}</span>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowImportArea(false)}
                    className="px-3 py-1 rounded-lg bg-neutral-700 text-xs text-neutral-300"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleImportSubmit}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium"
                  >
                    应用导入
                  </button>
                </div>
              </div>
            )}

            {/* JSON Code Viewer */}
            <div className="flex-1 overflow-auto rounded-xl bg-neutral-950 p-3 border border-neutral-800 text-[11px] font-mono text-emerald-400 max-h-[380px]">
              <pre className="whitespace-pre-wrap">{jsonString}</pre>
            </div>
          </div>
        ) : (
          /* API Integration Docs Tab */
          <div className="flex-1 overflow-auto max-h-[380px] text-xs text-neutral-300 space-y-3 pr-1">
            <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700">
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold mb-1">
                GET /api/desktop/apps
              </span>
              <p className="text-neutral-400 text-[11px]">
                获取当前用户的桌面布局配置，包含栅格位置 (x, y, w, h)、应用信息与文件夹子应用。
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700">
              <span className="inline-block px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] font-bold mb-1">
                PUT /api/desktop/apps
              </span>
              <p className="text-neutral-400 text-[11px]">
                当用户拖拽调整、新增或编辑 APP 时调用，保存最新的完整 JSON 树。
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[11px] font-bold text-neutral-400 block mb-1">
                前端调用示例 (Fetch):
              </span>
              <pre className="text-[10px] font-mono text-cyan-300 overflow-x-auto">
{`// 1. 获取桌面配置
const res = await fetch('/api/desktop/apps');
const config = await res.json();

// 2. 拖拽后同步保存
await fetch('/api/desktop/apps', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updatedConfig)
});`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
