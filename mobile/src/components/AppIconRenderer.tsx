import React from 'react';
import {
  Phone,
  MessageSquare,
  Music,
  FileText,
  Bot,
  Camera,
  Mail,
  Sparkles,
} from 'lucide-react';

interface AppIconRendererProps {
  name: string;
  logo?: string;
  iconName?: string;
  background?: string;
  iconColor?: string;
  symbol?: string;
  grayMode?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AppIconRenderer: React.FC<AppIconRendererProps> = ({
  name,
  logo,
  iconName,
  background,
  iconColor,
  symbol,
  grayMode = true,
}) => {
  const iconKey = (logo || iconName || '').toLowerCase().trim();
  const displayName = name || '应用';
  const bgColor = background || iconColor || '#3b82f6';

  // If logo is an image URL
  if (logo && (logo.startsWith('http') || logo.startsWith('/') || logo.startsWith('data:'))) {
    return (
      <img
        src={logo}
        alt={displayName}
        className={`w-full h-full object-cover rounded-[16px] select-none ${
          grayMode ? 'grayscale brightness-90' : ''
        }`}
      />
    );
  }

  // 1. Gray Placeholder Mode (System Uniform Aesthetic)
  if (grayMode) {
    switch (iconKey) {
      case 'phone':
      case '电话':
        return <Phone className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'wechat':
      case '微信':
        return <MessageSquare className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'qq':
        return <Bot className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'douyin':
      case '抖音':
        return <Music className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'wps':
        return <FileText className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'camera':
      case '相机':
        return <Camera className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'mail':
      case '邮件':
        return <Mail className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'workbuddy':
      case '助理':
        return <Bot className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'qianwen':
      case '通义千问':
        return <Sparkles className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'doubao':
      case '豆包':
        return <MessageSquare className="w-6 h-6 text-neutral-300 stroke-[2]" />;
      case 'alipay':
      case '支付宝':
        return <span className="text-[19px] font-bold text-neutral-200 leading-none">支</span>;
      case 'bilibili':
      case '哔哩哔哩':
        return (
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-bold text-neutral-200 tracking-tighter leading-none">
              bili
            </span>
            <div className="w-4 h-[2px] bg-neutral-400 rounded-full mt-0.5" />
          </div>
        );
      default:
        return (
          <span className="text-[16px] font-bold text-neutral-300 select-none">
            {symbol || displayName.slice(0, 1)}
          </span>
        );
    }
  }

  // 2. Color Mode (High-Fidelity Brand Icons)
  switch (iconKey) {
    case 'phone':
    case '电话':
      return (
        <div className="w-full h-full rounded-[16px] bg-[#00C853] flex items-center justify-center shadow-md">
          <Phone className="w-6 h-6 text-white stroke-[2.2] fill-white/15" />
        </div>
      );

    case 'wechat':
    case '微信':
      return (
        <div className="w-full h-full rounded-[16px] bg-[#07C160] flex items-center justify-center shadow-md">
          <div className="flex -space-x-1">
            <div className="w-5 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-0.5 rounded-full bg-[#07C160]" />
                <span className="w-0.5 h-0.5 rounded-full bg-[#07C160]" />
              </div>
            </div>
          </div>
        </div>
      );

    case 'qq':
      return (
        <div className="w-full h-full rounded-[16px] bg-white flex items-center justify-center shadow-md border border-neutral-200">
          <div className="w-6 h-7 rounded-full bg-neutral-900 flex flex-col items-center justify-center relative">
            <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-0.5 rounded-full bg-neutral-900" />
                <span className="w-0.5 h-0.5 rounded-full bg-neutral-900" />
              </div>
            </div>
            <div className="w-2.5 h-1 bg-amber-500 rounded-full mt-0.5" />
            <div className="w-4 h-1.5 bg-rose-500 rounded-full mt-0.5" />
          </div>
        </div>
      );

    case 'douyin':
    case '抖音':
      return (
        <div className="w-full h-full rounded-[16px] bg-black flex items-center justify-center shadow-md">
          <div className="relative">
            <Music className="w-6 h-6 text-cyan-400 stroke-[2.5]" />
            <Music className="w-6 h-6 text-rose-500 stroke-[2.5] absolute -top-0.5 -left-0.5 mix-blend-screen opacity-90" />
          </div>
        </div>
      );

    case 'wps':
      return (
        <div className="w-full h-full rounded-[16px] bg-white flex items-center justify-center shadow-md border border-neutral-200">
          <span className="text-[20px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500">
            W
          </span>
        </div>
      );

    case 'camera':
    case '相机':
      return (
        <div className="w-full h-full rounded-[16px] bg-gradient-to-b from-neutral-700 via-neutral-900 to-black p-1 flex items-center justify-center border border-white/20 shadow-inner">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-400/80 bg-neutral-800 flex items-center justify-center relative">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-900 via-blue-700 to-indigo-950 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-300/60 blur-[0.5px]" />
            </div>
            <span className="absolute -top-0.5 text-[5px] text-neutral-400 font-mono tracking-tighter">
              CAMERA
            </span>
          </div>
        </div>
      );

    case 'mail':
    case '邮件':
      return (
        <div className="w-full h-full rounded-[16px] bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center shadow-md">
          <Mail className="w-6 h-6 text-white stroke-[2.2]" />
        </div>
      );

    case 'alipay':
    case '支付宝':
      return (
        <div className="w-full h-full rounded-[16px] bg-[#1677FF] flex items-center justify-center shadow-md">
          <span className="text-[24px] font-bold text-white tracking-tight leading-none">支</span>
        </div>
      );

    case 'bilibili':
    case '哔哩哔哩':
      return (
        <div className="w-full h-full rounded-[16px] bg-[#FB7299] flex flex-col items-center justify-center shadow-md p-1">
          <span className="text-[12px] font-black text-white tracking-tight leading-none">
            bilibili
          </span>
          <div className="flex gap-1.5 mt-1">
            <span className="w-1.5 h-1 bg-white rounded-full" />
            <span className="w-1.5 h-1 bg-white rounded-full" />
          </div>
        </div>
      );

    case 'workbuddy':
    case '助理':
      return (
        <div className="w-full h-full rounded-[16px] bg-[#00C853] flex items-center justify-center shadow-md">
          <div className="w-8 h-8 rounded-xl bg-white/90 flex flex-col items-center justify-center">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <span className="w-3 h-0.5 bg-emerald-600 rounded-full mt-1" />
          </div>
        </div>
      );

    case 'qianwen':
    case '通义千问':
      return (
        <div className="w-full h-full rounded-[16px] bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 flex items-center justify-center shadow-md">
          <Sparkles className="w-6 h-6 text-white stroke-[2]" />
        </div>
      );

    case 'doubao':
    case '豆包':
      return (
        <div className="w-full h-full rounded-[16px] bg-white flex items-center justify-center shadow-md overflow-hidden p-1 border border-neutral-100">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center relative overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-amber-200/90 flex flex-col items-center justify-center pt-1">
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-neutral-800" />
                <span className="w-1 h-1 rounded-full bg-neutral-800" />
              </div>
              <span className="w-1.5 h-0.5 rounded-full bg-rose-400 mt-0.5" />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div
          style={{ backgroundColor: bgColor }}
          className="w-full h-full rounded-[16px] flex items-center justify-center shadow-md"
        >
          <span className="text-[17px] font-bold text-white select-none">
            {symbol || displayName.slice(0, 1)}
          </span>
        </div>
      );
  }
};
