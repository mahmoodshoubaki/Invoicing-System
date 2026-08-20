'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight, Building2, CreditCard, Receipt } from 'lucide-react';
import { StatusBadge } from '@/components/common/Badge';
import { revealItem } from '@/components/motion/Reveal';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatDate } from '@/utils/formatters';

/**
 * How far through the contract window today sits, as a percentage.
 * Returns null when either bound is missing so the caller can hide the meter
 * rather than render a misleading empty track.
 */
function contractProgress(startDate, finishDate) {
  if (!startDate || !finishDate) return null;
  const start = new Date(startDate).getTime();
  const finish = new Date(finishDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(finish) || finish <= start) return null;
  const pct = ((Date.now() - start) / (finish - start)) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function ProjectCard({ project }) {
  const progress = contractProgress(project.contractStartDate, project.contractFinishDate);
  const overdue = progress === 100;

  const meta = [
    { icon: Building2, value: project.clientName },
    { icon: CreditCard, value: project.poNumber && `PO ${project.poNumber}` },
    { icon: Receipt, value: project.invoicingPlatform },
  ].filter((m) => m.value);

  return (
    <motion.div variants={revealItem} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
      <Link
        href={`/projects/${encodeURIComponent(project.projectCode)}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[0_2px_6px_-2px_rgb(60_60_58/0.08)] transition-shadow hover:shadow-[0_18px_38px_-14px_rgb(60_60_58/0.20)]"
      >
        {/* Brand rail that wipes in on hover */}
        <span
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#f8485e] via-[#fca2ae] to-[#fcc354] transition-transform duration-500 ease-out group-hover:scale-x-100"
          aria-hidden="true"
        />

        <header className="flex items-start justify-between gap-3">
          <span className="rounded-md bg-[#f4f3f1] px-2 py-1 font-mono text-[11px] font-semibold text-[#52514e]">
            {project.projectCode}
          </span>
          <StatusBadge status={project.status} size="sm" />
        </header>

        <h3
          className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug"
          style={{ color: CHROME.textPrimary }}
        >
          {project.contractName ?? project.projectName ?? 'Untitled contract'}
        </h3>

        {project.contractNumber != null && (
          <p className="mt-1 font-mono text-xs" style={{ color: CHROME.textMuted }}>
            Contract #{project.contractNumber}
          </p>
        )}

        <ul className="mt-3.5 flex flex-col gap-1.5">
          {meta.map((m) => (
            <li key={m.value} className="flex items-center gap-2 text-xs" style={{ color: CHROME.textSecondary }}>
              <m.icon size={12} className="shrink-0" style={{ color: CHROME.textMuted }} />
              <span className="truncate">{m.value}</span>
            </li>
          ))}
        </ul>

        {/* Contract timeline — only when both bounds exist */}
        {progress !== null && (
          <div className="mt-auto pt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]" style={{ color: CHROME.textMuted }}>
              <span>{formatDate(project.contractStartDate)}</span>
              <span className={`font-semibold ${overdue ? 'text-[#c0392f]' : ''}`}>
                {overdue ? 'Term ended' : `${progress}% elapsed`}
              </span>
              <span>{formatDate(project.contractFinishDate)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f0ee]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: overdue ? STATUS.critical : '#f8485e' }}
                initial={{ width: 0 }}
                whileInView={{ width: `${progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}

        <span
          className="absolute bottom-4 right-4 text-[#a1a1a0] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 md:-translate-x-1"
          aria-hidden="true"
        >
          <ArrowUpRight size={16} />
        </span>
      </Link>
    </motion.div>
  );
}

export default memo(ProjectCard);
