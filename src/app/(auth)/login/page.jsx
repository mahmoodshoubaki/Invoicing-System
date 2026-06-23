'use client';

import { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState({});

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     window.location.href = '/dashboard';
  //   }
  // }, [isAuthenticated]);
  const DEMO_ACCOUNTS = [
    { label: 'Administrator', email: 'ahmed.rashidi@devoteam.com' },
    { label: 'Project Manager', email: 'sara.otaibi@devoteam.com' },
    { label: 'Invoicing Team', email: 'khalid.zahrani@devoteam.com' },
    { label: 'BU Head', email: 'abdullah.malik@devoteam.com' },
  ];

  const validate = () => {
    const errors = {};
    if (!form.email) errors.email = 'Email is required';
    else if (!form.email.includes('@')) errors.email = 'Enter a valid email address';
    if (!form.password) errors.password = 'Password is required';
    setFieldError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(form.email, form.password);
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/dashboard';
      window.location.href = redirectTo;
    } catch {
      // error state is already set inside AuthContext.login — nothing to do here
    }
  };

  const fillDemo = (email) => {
    setForm({ email, password: 'demo123' });
    setFieldError({});
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
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-3 shadow-lg shadow-primary/30">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Devoteam Middle East</h1>
          <p className="text-white/60 text-sm mt-0.5">Enterprise Invoicing & Tracking System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="gradient-primary px-6 py-5">
            <h2 className="text-white font-bold text-lg">Active Directory Sign In</h2>
            <p className="text-white/80 text-sm mt-0.5">Use your corporate credentials to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Global error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Corporate Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="yourname@devoteam.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg transition-colors
                    ${fieldError.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}
                  `}
                  disabled={isLoading}
                />
              </div>
              {fieldError.email && (
                <p className="text-xs text-red-500 mt-1">{fieldError.email}</p>
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
                'Sign In with Active Directory'
              )}
            </button>

            {/* Info */}
            <p className="text-xs text-gray-400 text-center">
              Authentication is managed by your organization's Active Directory.<br />
              Contact IT support if you cannot access the system.
            </p>
          </form>

          {/* Demo accounts */}
          <div className="px-6 pb-6">
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Demo Accounts (any password)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillDemo(acc.email)}
                    className="text-left p-2 rounded-lg border border-gray-100 hover:border-primary hover:bg-red-50 transition-colors"
                  >
                    <p className="text-xs font-medium text-gray-700">{acc.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{acc.email}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-4">
          © {new Date().getFullYear()} Devoteam Middle East · All rights reserved
        </p>
      </div>
    </div>
  );
}
