import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { DesktopItem, ItemType } from '../types';

interface EditModalProps {
  isOpen: boolean;
  item: DesktopItem | null;
  onClose: () => void;
  onSave: (updatedItem: DesktopItem) => void;
  onDelete: (id: string) => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('app');
  const [logo, setLogo] = useState('camera');
  const [badge, setBadge] = useState<string>('');
  const [des, setDes] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);

  useEffect(() => {
    if (item) {
      setName(item.name || item.title || '');
      setType(item.type);
      setLogo(item.logo || item.iconName || 'camera');
      setBadge(item.badge ? String(item.badge) : '');
      setDes(item.des || '');
      setLink(item.link || '');
      setWidth(item.layout.w);
      setHeight(item.layout.h);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || '未命名';
    const updated: DesktopItem = {
      ...item,
      name: finalName,
      title: finalName,
      logo: logo.trim(),
      iconName: logo.trim(),
      des: des.trim() || undefined,
      link: link.trim() || undefined,
      type,
      badge: badge ? (isNaN(Number(badge)) ? badge : Number(badge)) : undefined,
      layout: {
        ...item.layout,
        w: width,
        h: height,
      },
    };
    onSave(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] rounded-[28px] bg-neutral-900 border border-neutral-700/80 p-5 shadow-2xl text-white flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-base font-bold tracking-tight text-neutral-100">
            编辑桌面项目 (SiteItem 节点)
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3  max-h-[70vh] overflow-y-auto pr-1">
          {/* App Name */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">
              应用名称 (name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500 font-medium"
              placeholder="例如：微信、电话、相机"
              required
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">
              项目类型 (type)
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItemType)}
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
            >
              <option value="app">单个应用 (app)</option>
              <option value="folder-large">大文件夹 3x3 (folder-large)</option>
              <option value="folder-vertical">竖排卡片 (folder-vertical)</option>
              <option value="capsule">横向胶囊 (capsule)</option>
              <option value="folder-mini">迷你文件夹 1x1 (folder-mini)</option>
              <option value="widget-clock">时钟组件 (widget-clock)</option>
            </select>
          </div>

          {/* Logo / Icon Name selection */}
          {type === 'app' && (
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                图标 / Logo (logo)
              </label>
              <select
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
              >
                <option value="phone">电话 (phone)</option>
                <option value="wechat">微信 (wechat)</option>
                <option value="qq">QQ (qq)</option>
                <option value="douyin">抖音 (douyin)</option>
                <option value="wps">WPS (wps)</option>
                <option value="camera">相机 (camera)</option>
                <option value="mail">电子邮件 (mail)</option>
                <option value="alipay">支付宝 (alipay)</option>
                <option value="bilibili">哔哩哔哩 (bilibili)</option>
                <option value="workbuddy">WorkBuddy</option>
                <option value="qianwen">通义千问 (qianwen)</option>
                <option value="doubao">豆包 (doubao)</option>
                <option value="custom">首字通用图标 (custom)</option>
              </select>
            </div>
          )}

          {/* Grid Size (w x h) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                宽度栅格 (w: 1~6)
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={width}
                onChange={(e) => setWidth(Math.max(1, Math.min(6, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                高度栅格 (h: 1~4)
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={height}
                onChange={(e) => setHeight(Math.max(1, Math.min(4, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Badge */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">
              角标通知 (badge - 可选)
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="例如：4 或 99+"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">
              应用描述 (des - 可选)
            </label>
            <input
              type="text"
              value={des}
              onChange={(e) => setDes(e.target.value)}
              placeholder="例如：短视频记录美好生活"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-neutral-400 font-medium mb-1">
              网页链接 (link - 可选)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                const displayName = item.name || item.title || '该应用';
                if (confirm(`确定删除应用 "${displayName}" 吗？`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl /20 text-rose-400 hover:/30 flex items-center gap-1 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 shadow-md transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
