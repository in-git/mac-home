import { Loader2, Lock, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CaptchaResp,
  doLogin,
  doRegister,
  getPicCaptcha,
  LoginUser,
  setStoredAuth,
} from '../../api/auth';
import { AuthCard } from './AuthCard';
import { AuthField } from './AuthField';
import { CaptchaField } from './CaptchaField';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: LoginUser) => void;
}

type AuthView = 'login' | 'register';

// 左侧大图（取自项目 CircularGallery 的占位图）
const LOGIN_IMAGE = 'https://picsum.photos/seed/1/800/600?grayscale';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [view, setView] = useState<AuthView>('login');

  // 图形验证码
  const [captcha, setCaptcha] = useState<CaptchaResp>({
    validCodeBase64: '',
    validCodeReqNo: '',
  });
  const refreshCaptcha = async () => {
    try {
      setCaptcha(await getPicCaptcha());
    } catch {
      /* 静默 */
    }
  };

  useEffect(() => {
    if (isOpen) {
      setView('login');
      reset();
      refreshCaptcha();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // form fields
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [picCode, setPicCode] = useState('');

  const reset = () => {
    setAccount('');
    setPassword('');
    setPicCode('');
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const switchView = (v: AuthView) => {
    setView(v);
    setError('');
    reset();
    refreshCaptcha();
  };

  const handleSubmit = async () => {
    setError('');
    if (!account.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (!picCode.trim()) {
      setError('请输入图形验证码');
      return;
    }
    setLoading(true);
    try {
      let result: { token: string; user: LoginUser };
      if (view === 'login') {
        result = await doLogin({
          account: account.trim(),
          password,
          validCode: picCode.trim(),
          validCodeReqNo: captcha.validCodeReqNo,
        });
      } else {
        result = await doRegister({
          account: account.trim(),
          password,
          validCode: picCode.trim(),
          validCodeReqNo: captcha.validCodeReqNo,
        });
      }
      setStoredAuth(result.token, result.user);
      reset();
      onClose();
      onSuccess?.(result.user);
    } catch (e: any) {
      setError(e?.message || '操作失败，请稍后重试');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AuthCard
      imageUrl={LOGIN_IMAGE}
      imageAlt="登录"
      onBackdropClick={handleClose}
    >
      <div className="space-y-3">
        <div>
          <h2 className="text-[26px]  tracking-tight dark:text-white">
            {view === 'login' ? '登录' : '创建账户'}
          </h2>
          <p className="mt-1 text-font-sm  ">
            {view === 'login'
              ? '欢迎回来，请登录您的账户'
              : '填写信息以注册新账户'}
          </p>
        </div>

        <AuthField icon={<User size={16} className="text-slate-400" />}>
          <input
            autoFocus
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="账号"
            className="w-full bg-transparent text-font-md outline-none placeholder:text-slate-400"
          />
        </AuthField>

        <AuthField icon={<Lock size={16} className="text-slate-400" />}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={view === 'login' ? '密码' : '设置登录密码'}
            className="w-full bg-transparent text-font-md outline-none placeholder:text-slate-400"
          />
        </AuthField>

        <CaptchaField
          value={picCode}
          onChange={setPicCode}
          base64={captcha.validCodeBase64}
          onRefresh={refreshCaptcha}
        />

        {error && (
          <p className="px-1 text-font-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--card-radius)] bg-[color:var(--accent)] py-3 text-font-md  text-white shadow-sm duration-150 hover:bg-[color:var(--accent-hover)] active:scale-[0.985] disabled:opacity-60"
        >
          {loading && <Loader2 size={17} className="animate-spin" />}
          {loading ? '处理中…' : view === 'login' ? '登录' : '注册'}
        </button>

        {/* 切换登录 / 注册（非 tabbar，底部文字链接） */}
        <p className="pt-1 text-center text-font-sm ">
          {view === 'login' ? (
            <>
              还没有账户？{' '}
              <button
                onClick={() => switchView('register')}
                className=" text-[color:var(--accent)]"
              >
                创建账户
              </button>
            </>
          ) : (
            <>
              已有账户？{' '}
              <button
                onClick={() => switchView('login')}
                className=" text-[color:var(--accent)]"
              >
                去登录
              </button>
            </>
          )}
        </p>
      </div>
    </AuthCard>,
    document.body,
  );
};
