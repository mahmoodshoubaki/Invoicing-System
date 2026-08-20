'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  User, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight,
  ShieldCheck, Layers, LineChart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/theme/assets/devoteam-logo.png';

const EASE = [0.16, 1, 0.3, 1];

/** Rotating value props on the brand panel — purely decorative. */
const HIGHLIGHTS = [
  { icon: Layers, title: 'Every project, one ledger', body: 'BOQs, invoicing plans and collections in a single tracked pipeline.' },
  { icon: LineChart, title: 'Variance you can see', body: 'Know the moment a cycle slips — before it becomes a delayed invoice.' },
  { icon: ShieldCheck, title: 'Governed by workflow', body: 'Role-based approvals with a complete, auditable revision history.' },
];

function AuroraField() {
  // Three slow-drifting colour fields. Sizes/positions are deliberately
  // oversized and blurred so the edges never read as discrete circles.
  const blobs = [
    { className: 'bg-[#f8485e]', size: 620, from: { x: -80, y: -60 }, to: { x: 60, y: 80 }, duration: 18, opacity: 0.55 },
    { className: 'bg-[#fcc354]', size: 520, from: { x: 220, y: 260 }, to: { x: 80, y: 120 }, duration: 22, opacity: 0.40 },
    { className: 'bg-[#4a3aa7]', size: 700, from: { x: 40, y: 320 }, to: { x: 240, y: 180 }, duration: 26, opacity: 0.45 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[110px] ${b.className}`}
          style={{ width: b.size, height: b.size, opacity: b.opacity }}
          initial={b.from}
          animate={{ x: [b.from.x, b.to.x, b.from.x], y: [b.from.y, b.to.y, b.from.y] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Hairline grid — gives the colour field some architecture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* Vignette so the form side never fights the colour for attention */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141319] via-transparent to-[#141319]/60" />
    </div>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState({});
  const [highlight, setHighlight] = useState(0);

  // Already signed in (e.g. valid session restored from sessionStorage) — no need to log in again.
  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('redirect') || '/dashboard';
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const timer = setInterval(() => setHighlight((h) => (h + 1) % HIGHLIGHTS.length), 5000);
    return () => clearInterval(timer);
  }, []);

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

  const Highlight = HIGHLIGHTS[highlight].icon;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
        {/* ================= Brand panel ================= */}
        <aside className="relative isolate overflow-hidden bg-[#141319] px-8 py-12 sm:px-14 lg:flex lg:flex-col lg:justify-between lg:py-16">
          <AuroraField />

          <motion.div
            className="relative z-10 flex items-center gap-3"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md">
              <Image src={logo} alt="" width={28} height={28} className="rounded-md" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Devoteam Middle East</p>
              <p className="text-xs text-white/45">Invoicing &amp; Revenue Tracking</p>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            className="relative z-10 mt-14 max-w-lg lg:mt-0"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
          >
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Revenue,
              <br />
              <span className="bg-gradient-to-r from-[#fca2ae] via-[#fcc354] to-[#f8485e] bg-clip-text text-transparent">
                under control.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/55">
              From bill of quantities to collected cash — one system tracking every
              cycle, variance and approval across the portfolio.
            </p>

            {/* Rotating highlight */}
            <div className="mt-10 min-h-28">
              <AnimatePresence mode="wait">
                <motion.div
                  key={highlight}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f8485e]/15 ring-1 ring-[#f8485e]/25">
                    <Highlight size={18} className="text-[#fca2ae]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{HIGHLIGHTS[highlight].title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/50">
                      {HIGHLIGHTS[highlight].body}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Progress pips */}
              <div className="mt-4 flex gap-2">
                {HIGHLIGHTS.map((h, i) => (
                  <button
                    key={h.title}
                    type="button"
                    onClick={() => setHighlight(i)}
                    aria-label={`Show highlight ${i + 1}: ${h.title}`}
                    className="group py-2"
                  >
                    <span
                      className={`block h-1 rounded-full transition-all duration-500 ${
                        i === highlight ? 'w-8 bg-[#f8485e]' : 'w-4 bg-white/20 group-hover:bg-white/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.p
            className="relative z-10 mt-12 text-xs text-white/25 lg:mt-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            © {new Date().getFullYear()} Devoteam Middle East · All rights reserved
          </motion.p>
        </aside>

        {/* ================= Form panel ================= */}
        <main className="flex items-center justify-center px-6 py-14 sm:px-12">
          <motion.div
            className="w-full max-w-[400px]"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
            >
              <h2 className="text-2xl font-bold tracking-tight text-[#3c3c3a]">Sign in</h2>
              <p className="mt-1.5 text-sm text-[#6f6f6c]">
                Use your Devoteam directory account to continue.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <AlertCircle size={16} className="mt-px shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
              >
                <label htmlFor="username" className="mb-2 block text-[13px] font-semibold text-[#3c3c3a]">
                  Username
                </label>
                <div className="group relative">
                  <User
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a0] transition-colors group-focus-within:text-[#f8485e]"
                  />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={form.username}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, username: e.target.value }));
                      if (fieldError.username) setFieldError((p) => ({ ...p, username: undefined }));
                    }}
                    placeholder="your.name"
                    disabled={isLoading}
                    aria-invalid={Boolean(fieldError.username)}
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm transition-all
                      ${fieldError.username
                        ? 'border-red-300 bg-red-50/40'
                        : 'border-[#e4e2e2] focus:border-[#f8485e]'}`}
                  />
                </div>
                {fieldError.username && (
                  <p className="mt-1.5 text-xs text-red-500">{fieldError.username}</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
              >
                <label htmlFor="password" className="mb-2 block text-[13px] font-semibold text-[#3c3c3a]">
                  Password
                </label>
                <div className="group relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a0] transition-colors group-focus-within:text-[#f8485e]"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, password: e.target.value }));
                      if (fieldError.password) setFieldError((p) => ({ ...p, password: undefined }));
                    }}
                    placeholder="••••••••"
                    disabled={isLoading}
                    aria-invalid={Boolean(fieldError.password)}
                    className={`w-full rounded-xl border bg-white py-3 pl-10 pr-11 text-sm transition-all
                      ${fieldError.password
                        ? 'border-red-300 bg-red-50/40'
                        : 'border-[#e4e2e2] focus:border-[#f8485e]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#a1a1a0] hover:text-[#6f6f6c]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldError.password && (
                  <p className="mt-1.5 text-xs text-red-500">{fieldError.password}</p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
              >
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.015 }}
                  whileTap={{ scale: isLoading ? 1 : 0.985 }}
                  className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#f8485e] py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgb(248_72_94/0.55)] transition-colors hover:bg-[#e93a50] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.div
              className="mt-8 border-t border-[#e4e2e2] pt-5"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } } }}
            >
              <p className="flex items-center justify-center gap-1.5 text-xs text-[#a1a1a0]">
                <ShieldCheck size={13} />
                Contact your administrator if you cannot access the system.
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}
