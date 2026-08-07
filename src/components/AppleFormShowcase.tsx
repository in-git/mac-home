import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  User,
  AlertCircle,
  Sparkles,
  Info,
  Sliders,
  Plus,
  Minus,
  CheckSquare,
  Square
} from 'lucide-react';
import { FormDemoState } from '../types';
import { playSound } from '../utils/sound';

interface Props {
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

export const AppleFormShowcase: React.FC<Props> = ({ isModalMode = false, onCloseModal }) => {
  const [formState, setFormState] = useState<FormDemoState>({
    singleInput: '库克 (Tim Cook)',
    multiText: '这是 Apple HIG macOS Sonoma & iOS 规范表单组件。无粗边框、无强烈对比度，采用 12px 哑光圆角与柔和蓝光。',
    selectValue: 'macos-sonoma',
    checkboxVal: true,
    toggleVal: true,
    radioVal: 'standard',
    numberVal: 42,
    sliderVal: 75,
    segmentedVal: 'overview',
    simulatedState: 'default',
  });

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const selectOptions = [
    { value: 'macos-sonoma', label: 'macOS Sonoma 桌面系统' },
    { value: 'ios-18', label: 'iOS 18 苹果人机工程规范' },
    { value: 'vision-os', label: 'visionOS 空间计算UI' },
    { value: 'watch-os', label: 'watchOS 极简响应界面' },
  ];

  const updateState = (key: keyof FormDemoState, val: unknown) => {
    playSound.playClick();
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  const isSimDisabled = formState.simulatedState === 'disabled';
  const isSimError = formState.simulatedState === 'error';

  return (
    <div className={`p-5 text-slate-800 dark:text-slate-100 ${isModalMode ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
      {/* Title & State Tester */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] animate-pulse" />
            <h2 className="text-base font-bold tracking-tight">Apple UI 交互表单规范 showcase</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            符合 Apple HIG (macOS Sonoma / iOS) 规范，磨砂哑光底色、无生硬黑框、12px 标准圆角
          </p>
        </div>

        {/* State Simulator Switcher */}
        <div className="flex items-center space-x-1 bg-black/5 dark:bg-white/10 p-1 rounded-xl text-xs shrink-0">
          <span className="text-[11px] text-slate-400 px-2 font-medium">状态模拟:</span>
          {(['default', 'hover', 'focus', 'disabled', 'error'] as const).map((st) => (
            <button
              key={st}
              onClick={() => updateState('simulatedState', st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                formState.simulatedState === st
                  ? 'bg-[#007AFF] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {st === 'default' && '默认'}
              {st === 'hover' && 'Hover'}
              {st === 'focus' && 'Focus'}
              {st === 'disabled' && '禁用'}
              {st === 'error' && '错误'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Left Column: Input, Textarea, Select, Segmented */}
        <div className="space-y-5">
          {/* 1. Segmented Controller (分段控制器) */}
          <div>
            <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              分段控制器 (Segmented Control)
            </label>
            <div className="relative flex bg-black/5 dark:bg-white/10 p-1 rounded-[12px]">
              {(['overview', 'design', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  disabled={isSimDisabled}
                  onClick={() => updateState('segmentedVal', tab)}
                  className={`flex-1 py-1.5 rounded-[10px] text-xs font-medium transition-all relative z-10 ${
                    formState.segmentedVal === tab
                      ? 'bg-white dark:bg-slate-800 text-[#007AFF] shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  } ${isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {tab === 'overview' && '概览视图'}
                  {tab === 'design' && '设计规范'}
                  {tab === 'settings' && '组件参数'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">苹果经典滑动 Pill 分隔效果</p>
          </div>

          {/* 2. Single-line Input (单行输入框) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-medium text-slate-700 dark:text-slate-300">
                单行输入框 (12px 圆角 + 哑光底色)
              </label>
              {isSimError && (
                <span className="text-[11px] text-red-500 font-medium flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>格式不正确</span>
                </span>
              )}
            </div>

            <div
              className={`relative flex items-center rounded-[12px] transition-all ${
                isSimError
                  ? 'bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50'
                  : formState.simulatedState === 'focus'
                  ? 'bg-white dark:bg-slate-800 ring-2 ring-[#007AFF]/50 shadow-xs'
                  : formState.simulatedState === 'hover'
                  ? 'bg-black/8 dark:bg-white/15'
                  : 'bg-black/5 dark:bg-white/10'
              } ${isSimDisabled ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <User size={15} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                disabled={isSimDisabled}
                value={formState.singleInput}
                onChange={(e) => updateState('singleInput', e.target.value)}
                placeholder="请输入用户名..."
                className="w-full py-2.5 pl-9 pr-3 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center space-x-1">
              <Info size={11} />
              <span>前置图标、无描边框、focus 淡蓝柔光</span>
            </p>
          </div>

          {/* 3. Dropdown Select (下拉选择器) */}
          <div className="relative">
            <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              下拉选择器 (磨砂悬浮弹窗)
            </label>
            <button
              type="button"
              disabled={isSimDisabled}
              onClick={() => {
                if (!isSimDisabled) setIsSelectOpen(!isSelectOpen);
              }}
              className={`w-full py-2.5 px-3 rounded-[12px] flex items-center justify-between text-xs font-medium transition-all ${
                isSimError
                  ? 'bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50'
                  : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
              } ${isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>
                {selectOptions.find((o) => o.value === formState.selectValue)?.label || '请选择项'}
              </span>
              <ChevronDown
                size={15}
                className={`text-slate-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Floating Popover Options */}
            {isSelectOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-full glass-panel rounded-xl shadow-2xl border border-white/50 dark:border-white/15 p-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                {selectOptions.map((opt) => {
                  const isSelected = formState.selectValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        updateState('selectValue', opt.value);
                        setIsSelectOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between transition-colors font-medium text-slate-700 dark:text-slate-200"
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={14} className="text-[#007AFF]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Multi-line Textarea (多行文本域) */}
          <div>
            <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              多行文本域 (macOS 纤细滚动条)
            </label>
            <textarea
              rows={3}
              disabled={isSimDisabled}
              value={formState.multiText}
              onChange={(e) => updateState('multiText', e.target.value)}
              placeholder="请输入详细描述..."
              className={`w-full p-3 rounded-[12px] bg-black/5 dark:bg-white/10 border-none outline-none text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-y transition-all ${
                isSimError
                  ? 'bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50'
                  : 'focus:ring-2 focus:ring-[#007AFF]/50 focus:bg-white dark:focus:bg-slate-800'
              } ${isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        {/* Right Column: Toggle, Checkbox, Radio, Number, Slider, Buttons */}
        <div className="space-y-5">
          {/* 5. Toggle Switch & Checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggle */}
            <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-medium">开关 Toggle</div>
                <div className="text-[10px] text-slate-400">标准 Apple 蓝色</div>
              </div>
              <button
                type="button"
                disabled={isSimDisabled}
                onClick={() => updateState('toggleVal', !formState.toggleVal)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative ${
                  formState.toggleVal ? 'bg-[#007AFF]' : 'bg-slate-300 dark:bg-slate-600'
                } ${isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 block ${
                    formState.toggleVal ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Checkbox */}
            <div className="bg-black/5 dark:bg-white/5 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-medium">复选框 Checkbox</div>
                <div className="text-[10px] text-slate-400">圆角蓝底白勾</div>
              </div>
              <button
                type="button"
                disabled={isSimDisabled}
                onClick={() => updateState('checkboxVal', !formState.checkboxVal)}
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  formState.checkboxVal
                    ? 'bg-[#007AFF] text-white'
                    : 'border-2 border-slate-300 dark:border-slate-600 bg-transparent'
                } ${isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {formState.checkboxVal && <Check size={13} className="stroke-[3]" />}
              </button>
            </div>
          </div>

          {/* 6. Radio Group (单选组) */}
          <div>
            <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              单选组 (Radio Group)
            </label>
            <div className="flex space-x-4 bg-black/5 dark:bg-white/5 p-2.5 rounded-xl">
              {[
                { id: 'standard', label: '标准模式' },
                { id: 'pro', label: '专业级' },
                { id: 'ultra', label: 'Ultra 极限' },
              ].map((r) => {
                const isChecked = formState.radioVal === r.id;
                return (
                  <button
                    key={r.id}
                    disabled={isSimDisabled}
                    onClick={() => updateState('radioVal', r.id)}
                    className="flex items-center space-x-2 text-xs font-medium cursor-pointer"
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isChecked ? 'border-[#007AFF]' : 'border-slate-400'
                      }`}
                    >
                      {isChecked && <span className="w-2 h-2 rounded-full bg-[#007AFF]" />}
                    </span>
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Number Input (数字输入框 Stepper) */}
          <div>
            <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              数字输入框 (Stepper)
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-[12px] p-1 space-x-1">
                <button
                  disabled={isSimDisabled}
                  onClick={() => updateState('numberVal', formState.numberVal - 1)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 shadow-xs"
                >
                  <Minus size={13} />
                </button>
                <input
                  type="number"
                  disabled={isSimDisabled}
                  value={formState.numberVal}
                  onChange={(e) => updateState('numberVal', Number(e.target.value))}
                  className="w-14 text-center font-semibold bg-transparent border-none outline-none text-xs"
                />
                <button
                  disabled={isSimDisabled}
                  onClick={() => updateState('numberVal', formState.numberVal + 1)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center hover:bg-slate-100 shadow-xs"
                >
                  <Plus size={13} />
                </button>
              </div>
              <span className="text-[11px] text-slate-400">微小增量控制 (+1 / -1)</span>
            </div>
          </div>

          {/* 8. Slider (滑块) */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-slate-300">滑块 Slider</label>
              <span className="font-semibold text-[#007AFF]">{formState.sliderVal}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={isSimDisabled}
              value={formState.sliderVal}
              onChange={(e) => updateState('sliderVal', Number(e.target.value))}
              className={`w-full accent-[#007AFF] cursor-pointer ${
                isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* 9. Buttons (主/次要提交按钮: Padding 严格 2:1) */}
          <div className="pt-2">
            <label className="block font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              按钮规范 (严格 2:1 水平/垂直比例)
            </label>
            <div className="flex items-center space-x-3">
              {/* Primary Button */}
              <button
                disabled={isSimDisabled}
                onClick={() => {
                  playSound.playChime();
                  alert('表单保存成功！遵循 Apple HIG 规范。');
                }}
                className={`px-6 py-3 rounded-[12px] bg-[#007AFF] text-white font-semibold text-xs shadow-md hover:bg-blue-600 active:scale-95 transition-all flex items-center space-x-1.5 ${
                  isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Sparkles size={14} />
                <span>主提交按钮</span>
              </button>

              {/* Secondary Button */}
              <button
                disabled={isSimDisabled}
                onClick={() => playSound.playClick()}
                className={`px-6 py-3 rounded-[12px] glass-pill text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all ${
                  isSimDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                次要取消按钮
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalMode && (
        <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/10 flex justify-end">
          <button
            onClick={onCloseModal}
            className="px-6 py-2 rounded-[12px] bg-[#007AFF] text-white font-medium text-xs shadow-sm hover:bg-blue-600"
          >
            关闭预览
          </button>
        </div>
      )}
    </div>
  );
};
