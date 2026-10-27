'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  UserCheck,
  Github,
  Info,
} from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!res?.ok) {
        setErrorMsg(res?.error || 'Đăng nhập không thành công. Vui lòng thử lại.');
        setIsLoading(false);
      } else {
        // Dùng window.location.href để refresh session cookie đầy đủ tới server & middleware
        window.location.href = callbackUrl;
      }
    } catch (error) {
      setErrorMsg('Đã có lỗi xảy ra trong quá trình đăng nhập.');
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    setErrorMsg('');
    try {
      await signIn('github', { callbackUrl });
    } catch (error) {
      setErrorMsg('Không thể chuyển hướng đăng nhập GitHub.');
      setIsGithubLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10">
      {/* Header Form */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-rose-600/30">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Đăng Nhập Hệ Thống
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Cổng Quản lý Deadline Lớp học &bull; PTIT IT
        </p>
      </div>

      {/* Thông báo lỗi */}
      {errorMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form đăng nhập Credentials */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Email sinh viên PTIT
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sv@ptit.edu.vn"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isGithubLoading}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 disabled:opacity-70 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Dải phân cách "Hoặc tiếp tục với" */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>

      {/* Nút Đăng nhập bằng GitHub (Điểm cộng OAuth) */}
      <button
        type="button"
        onClick={handleGithubLogin}
        disabled={isLoading || isGithubLoading}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow disabled:opacity-70"
      >
        {isGithubLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            <span>Đang chuyển hướng GitHub...</span>
          </>
        ) : (
          <>
            <Github className="w-4 h-4 text-white" />
            <span>Đăng nhập bằng GitHub</span>
          </>
        )}
      </button>

      {/* Hộp Tài khoản Mẫu Bắt Buộc */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
          Tài khoản kiểm thử bắt buộc (1-Click Fill)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@ptit.edu.vn', 'admin123')}
            className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-left transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block">Admin (Lớp trưởng)</span>
              <span className="text-[10px] text-amber-700">admin@ptit.edu.vn</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('sv@ptit.edu.vn', 'sv123456')}
            className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-left transition-colors flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold block">Sinh viên (User)</span>
              <span className="text-[10px] text-blue-700">sv@ptit.edu.vn</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
