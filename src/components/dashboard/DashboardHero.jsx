'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { FileText, FolderKanban } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { INVOICE_STATUS_ID } from '@/constants/statuses';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import ProjectStatusFilter from './ProjectStatusFilter';

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

const strong = (chunks) => <span className="font-semibold text-white/80">{chunks}</span>;

/**
 * @param {{ financial: { status: string, data: Object|null }, invoices: { status: string, data: Object|null }, pending: { status: string, data: Object|null }, filters: ReturnType<import('./useDashboard').useDashboardFilters>, }} props
 */
export default function DashboardHero({ financial, invoices, pending, filters }) {
  const t = useTranslations('dashboard');
  const format = useLocaleFormat();
  const fin = financial.data;
  const invoicesInProgress = invoices.data?.inProgress.count ?? 0;
  const waiting = pending.data ? pending.data.byType.reduce((sum, t) => sum + t.count, 0) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative isolate overflow-hidden rounded-3xl bg-[#17161c] px-6 py-7 sm:px-9 sm:py-8"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -inset-s-16 -top-24 h-72 w-72 rounded-full bg-[#f8485e] opacity-40 blur-[90px]" />
        <div className="absolute -bottom-28 inset-e-10 h-72 w-72 rounded-full bg-[#4a3aa7] opacity-40 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#fcc354]">
            {t(`greeting.${greetingKey()}`)} · {format.date(new Date())}
          </p>
          <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-white sm:text-[2.5rem] sm:leading-[1.1]">
            {t('title')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {fin && (
              <>
                {t.rich('heroProjects', { active: fin.activeProjectCount, total: fin.projectCount, b: strong })}
                {waiting != null ? ' · ' : '.'}
              </>
            )}
            {waiting != null && (
              <>
                {t.rich('heroWaiting', { count: waiting, b: strong })}
              </>
            )}
            {!fin && waiting == null && (financial.status === 'loading' || pending.status === 'loading') && t('source.loading')}
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#17161c] transition-colors hover:bg-white/90"
            >
              <FolderKanban size={15} />
              {t('browseProjects')}
            </Link>
            <Link
              href={ROUTES.INVOICES_WITH_STATUS(INVOICE_STATUS_ID.IN_PROGRESS)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <FileText size={15} />
              {t('reviewInvoices')}
              {invoicesInProgress > 0 && (
                <span className="ms-0.5 rounded-full bg-[#f8485e] px-1.5 py-0.5 text-[10px] font-bold">{invoicesInProgress}</span>
              )}
            </Link>
          </div>
        </div>

        <ProjectStatusFilter filters={filters} />
      </div>
    </motion.section>
  );
}
