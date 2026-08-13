import {Smartphone} from 'lucide-react';

/** 移动端访问时的占位提示：本应用暂不支持移动端，建议在 PC 端使用。 */
export default function MobileUnsupported() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[color:var(--bg-color)] px-6 text-center">
      <div className="max-w-sm">
        <div className="mb-4 flex justify-center  dark:text-slate-500">
          <Smartphone size={48} />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
          暂时不支持移动端
        </h1>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          当前应用暂不支持在移动设备上使用，请在电脑（PC）端打开以获得完整体验。
        </p>
      </div>
    </div>
  );
}
