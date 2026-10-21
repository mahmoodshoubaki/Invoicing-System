'use client';

import { motion } from 'motion/react';
import { revealItem } from '@/components/motion/Reveal';
import { CHROME } from '@/theme/vizPalette';

/**
 * A titled panel for one group of form fields or read-only detail.
 *
 * Uses the shared `revealItem` variant, so wrapping a set of these in
 * `<Reveal>` staggers them in without any per-section wiring.
 */
export default function FormSection({
  title, subtitle, icon: Icon, actions, children, className = '', tone = 'default',
}) {
  const toneRing = tone === 'muted' ? 'bg-[#f4f3f1] text-[#898781]' : 'bg-[#f8485e]/10 text-[#f8485e]';

  return (
    <motion.section
      variants={revealItem}
      className={`rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#f1f0ee] pb-3.5">
          <div className="flex min-w-0 items-start gap-2.5">
            {Icon && (
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${toneRing}`}>
                <Icon size={15} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{title}</h2>
              {subtitle && (
                <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </motion.section>
  );
}
