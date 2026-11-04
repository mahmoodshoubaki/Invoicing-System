'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import ErrorNote from '@/components/ui/ErrorNote';
import Skeleton from '@/components/ui/Skeleton';
import { revealItem } from '@/components/motion/Reveal';
import { CHROME } from '@/theme/vizPalette';
import NotAvailable from './NotAvailable';

/**
 * A short dashboard list with its own loading, no-access, error and empty states.
 *
 * @param {{
 *   title: string,
 *   icon?: import('react').ComponentType<any>,
 *   subtitle: string,
 *   source: { status: string, error: Error|null, reload: () => void },
 *   isEmpty: boolean,
 *   forbiddenText: string,
 *   emptyTitle: string,
 *   emptyText: string,
 *   children: import('react').ReactNode,
 *   href?: string,
 * }} props
 */
export default function DashboardListCard({
  title, icon: Icon = null, subtitle, source, isEmpty, forbiddenText, emptyTitle, emptyText, children, href = null,
}) {
  let body;
  if (source.status === 'loading') body = <div className="p-5"><Skeleton rows={4} height={52} /></div>;
  else if (source.status === 'forbidden') body = <div className="p-5"><NotAvailable text={forbiddenText} /></div>;
  else if (source.status === 'error') body = <div className="p-5"><ErrorNote error={source.error} onRetry={source.reload} compact /></div>;
  else if (isEmpty) {
    body = (
      <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
        <CheckCircle2 size={26} className="text-[#0ca30c]" />
        <p className="text-sm font-semibold text-[#006300]">{emptyTitle}</p>
        <p className="text-xs" style={{ color: CHROME.textMuted }}>{emptyText}</p>
      </div>
    );
  } else body = <ul className="divide-y divide-[#f4f3f1]">{children}</ul>;

  return (
    <motion.section variants={revealItem} className="overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white shadow-[var(--shadow-card)]">
      <header className="flex items-center justify-between gap-2 border-b border-[#f1f0ee] px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
            {Icon && <Icon size={14} className="text-[#d03b3b]" aria-hidden="true" />}
            {title}
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>{subtitle}</p>
        </div>
        {href && source.status !== 'forbidden' && (
          <Link href={href} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#f8485e] hover:opacity-80">
            View all <ArrowRight size={12} />
          </Link>
        )}
      </header>
      {body}
    </motion.section>
  );
}
