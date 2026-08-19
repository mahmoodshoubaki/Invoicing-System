'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/theme/assets/devoteam-logo.png';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState({});

  // Already signed in (e.g. valid session restored from sessionStorage) — no need to log in again.
  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '/dashboard';
    }
  }, [isAuthenticated]);

  const validate = () => {
    const errors = {};
    if (!form.username) errors.username = 'Username is required';
    if (!form.password) errors.password = 'Password is required';
    setFieldError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.username, form.password);
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      window.location.href = redirectTo;
    } catch {
      // error state is already set inside AuthContext.login — nothing to do here
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#3c3c3a] to-gray-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-4 text-center border border-white/10">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3 shadow-lg shadow-primary/30 rounded-full">
            <Image src={logo} alt="Devoteam logo" width={56} height={56} className="rounded-full" />
          </div>
          <h1 className="text-xl font-bold text-white">Devoteam Middle East</h1>
          <p className="text-white/60 text-sm mt-0.5">Enterprise Invoicing & Tracking System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="gradient-primary px-6 py-5">
            <h2 className="text-white font-bold text-lg">Sign In</h2>
            <p className="text-white/80 text-sm mt-0.5">Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Global error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="Enter your username"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg transition-colors
                    ${fieldError.username ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}
                  `}
                  disabled={isLoading}
                />
              </div>
              {fieldError.username && (
                <p className="text-xs text-red-500 mt-1">{fieldError.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg transition-colors
                    ${fieldError.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}
                  `}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldError.password && (
                <p className="text-xs text-red-500 mt-1">{fieldError.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Info */}
            <p className="text-xs text-gray-400 text-center">
              Contact your Admin if you cannot access the system.
            </p>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-4">
          © {new Date().getFullYear()} Devoteam Middle East · All rights reserved
        </p>
      </div>
    </div>
  );
}
