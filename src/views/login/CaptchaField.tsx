import { RefreshCw } from 'lucide-react';
import { AuthField } from './AuthField';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** 图形验证码 base64 图片 */
  base64?: string;
  /** 刷新验证码 */
  onRefresh: () => void;
}

/** 图形验证码字段：输入框 + 可点击刷新的验证码图片 */
export function CaptchaField({ value, onChange, base64, onRefresh }: Props) {
  return (
    <AuthField icon={<RefreshCw size={16} className="text-slate-400" />}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="图形验证码"
        className="w-full bg-transparent text-font-md outline-none placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={onRefresh}
        className="shrink-0"
        title="刷新验证码"
      >
        {base64 ? (
          <img
            src={base64}
            alt="captcha"
            className="h-9 w-[88px] rounded-[calc(var(--card-radius)*0.5)] object-cover"
          />
        ) : (
          <RefreshCw size={16} className="animate-spin text-slate-400" />
        )}
      </button>
    </AuthField>
  );
}
