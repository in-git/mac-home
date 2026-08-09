import { sm2 } from 'sm-crypto';
import { createRequest } from '../utils/request';

export const TOKEN_KEY = 'CLIENT_TOKEN';
export const USER_KEY = 'CLIENT_USER_INFO';

// 文档固定 SM2 公钥（所有环境共用）
const LOGIN_PUBLIC_KEY =
  '04298364ec840088475eae92a591e01284d1abefcda348b47eb324bb521bb03b0b2a5bc393f6b71dabb8f15c99a0050818b56b23f31743b93df9cf8948f15ddb54';

/** 密码 SM2 加密 → hex 字符串（cipherMode=1 → 04 || C1 || C3 || C2） */
function encryptPassword(password: string): string {
  return sm2.doEncrypt(password, LOGIN_PUBLIC_KEY, 1);
}

/**
 * C 端认证专用请求实例：
 * - 免登接口（登录 / 验证码）不携带 token
 * - 401 静默处理，由页面自行提示，不跳转 /login
 * - 所有 /auth/c/** 接口通过此实例调用
 */
const authRequest = createRequest({
  getToken: () => null,
  onUnauthorized: () => {
    /* 静默 */
  },
  onError: () => {
    /* 静默，由调用方 catch 提示 */
  },
});

export interface LoginUser {
  accessToken?: string;
  account?: string;
  expire?: string;
  id?: string;
  nickname?: string;
  phone?: string;
  realName?: string;
  status?: string;
  unitName?: string;
  [key: string]: unknown;
}

export interface CaptchaResp {
  /** 图形验证码 base64 图片（data 内字段名为 validCodeBase64） */
  validCodeBase64: string;
  validCodeReqNo: string;
}

/** 图形验证码：GET /auth/c/getPicCaptcha */
export async function getPicCaptcha(): Promise<CaptchaResp> {
  const data = await authRequest.get<CaptchaResp>('/auth/c/getPicCaptcha');
  return data ?? { validCodeBase64: '', validCodeReqNo: '' };
}

/** 短信验证码：GET /auth/c/getPhoneValidCode?phone= */
export async function getPhoneValidCode(phone: string): Promise<void> {
  await authRequest.get('/auth/c/getPhoneValidCode', { params: { phone } });
}

/** 邮箱验证码：GET /auth/c/getEmailValidCode?email= */
export async function getEmailValidCode(email: string): Promise<void> {
  await authRequest.get('/auth/c/getEmailValidCode', { params: { email } });
}

interface DoLoginRaw {
  token: string;
  user?: LoginUser;
}

/** 账号密码登录：POST /auth/c/doLogin */
export async function doLogin(params: {
  account: string;
  password: string;
  validCode?: string;
  validCodeReqNo?: string;
}): Promise<{ token: string; user: LoginUser }> {
  const body = {
    account: params.account,
    password: encryptPassword(params.password),
    validCode: params.validCode,
    validCodeReqNo: params.validCodeReqNo,
  };
  const data = await authRequest.post<DoLoginRaw>('/auth/c/doLogin', body);
  const token = data?.token ?? '';
  const user: LoginUser = data?.user ?? {};
  return { token, user };
}

/** 手机号验证码登录：POST /auth/c/doLoginByPhone */
export async function doLoginByPhone(params: {
  phone: string;
  validCode: string;
  validCodeReqNo: string;
}): Promise<{ token: string; user: LoginUser }> {
  const data = await authRequest.post<DoLoginRaw>(
    '/auth/c/doLoginByPhone',
    params,
  );
  return { token: data?.token ?? '', user: data?.user ?? {} };
}

/** 邮箱验证码登录：POST /auth/c/doLoginByEmail */
export async function doLoginByEmail(params: {
  email: string;
  validCode: string;
  validCodeReqNo: string;
}): Promise<{ token: string; user: LoginUser }> {
  const data = await authRequest.post<DoLoginRaw>(
    '/auth/c/doLoginByEmail',
    params,
  );
  return { token: data?.token ?? '', user: data?.user ?? {} };
}

/** 注册：POST /auth/c/register（按文档同构约定） */
export async function doRegister(params: {
  account?: string;
  password?: string;
  phone?: string;
  phoneValidCode?: string;
  phoneValidCodeReqNo?: string;
  email?: string;
  emailValidCode?: string;
  emailValidCodeReqNo?: string;
  validCode?: string;
  validCodeReqNo?: string;
}): Promise<{ token: string; user: LoginUser }> {
  const body: Record<string, unknown> = {
    validCode: params.validCode,
    validCodeReqNo: params.validCodeReqNo,
  };
  if (params.account) body.account = params.account;
  if (params.password) body.password = encryptPassword(params.password);
  if (params.phone) {
    body.phone = params.phone;
    body.validCode = params.phoneValidCode;
    body.validCodeReqNo = params.phoneValidCodeReqNo;
  }
  if (params.email) {
    body.email = params.email;
    body.validCode = params.emailValidCode;
    body.validCodeReqNo = params.emailValidCodeReqNo;
  }
  const data = await authRequest.post<DoLoginRaw>('/auth/c/register', body);
  return { token: data?.token ?? '', user: data?.user ?? {} };
}

/** 获取登录用户信息：GET /auth/c/getLoginUser */
export async function getLoginUser(): Promise<LoginUser> {
  const data = await authRequest.get<LoginUser>('/auth/c/getLoginUser');
  return data ?? {};
}

/** 退出登录：GET /auth/c/doLogout */
export async function doLogout(): Promise<void> {
  await authRequest.get('/auth/c/doLogout');
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): LoginUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: LoginUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
