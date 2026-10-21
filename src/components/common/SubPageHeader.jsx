'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { CHROME } from '@/theme/vizPalette';

/**
 * Header for pages nested under a project (BOQ, invoice forms, edit screens).
 *
 * Deliberately lighter than the dark hero on the project/dashboard landing
 * pages — a full aurora panel on top of every form would fight the form for
 * attention. Same family, a third of the weight.
 *
 * `breadcrumbs` and `actions` should be stable references (useMemo / module
 * constant) since this is memoised.
 */
function SubPageHeader({ title, subtitle, icon: Icon, breadcrumbs = [], actions, eyebrow }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white px-5 py-5 shadow-[var(--shadow-card)] sm:px-6"
    >
      {/* Soft brand wash in the corner — enough to tie back to the hero pages */}
      <div
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[#f8485e] opacity-[0.07] blur-3xl"
        aria-hidden="true"
      />

      {breadcrumbs.length > 0 && (
        <nav className="relative mb-2.5 flex flex-wrap items-center gap-1 text-xs" style={{ color: CHROME.textMuted }}>
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="shrink-0" />}
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-[#f8485e]">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium" style={{ color: CHROME.textSecondary }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f8485e]/10 text-[#f8485e]">
              <Icon size={18} />
            </span>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#f8485e]">
                {eyebrow}
              </p>
            )}
            {/* No empty heading when a page leaves the title to a card below. */}
            {title && (
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: CHROME.textPrimary }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm" style={{ color: CHROME.textSecondary }}>{subtitle}</p>
            )}
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.header>
  );
}

export default memo(SubPageHeader);
