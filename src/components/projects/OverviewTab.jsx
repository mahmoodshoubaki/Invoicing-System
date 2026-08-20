'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, FileSignature, Layers, Wallet } from 'lucide-react';
import MetricBars from '@/components/charts/MetricBars';
import Reveal, { revealItem } from '@/components/motion/Reveal';
import InfoRow from './InfoRow';
import { CHROME, SERIES, STATUS } from '@/theme/vizPalette';
import { formatCurrency, formatDate } from '@/utils/formatters';

function Panel({ title, icon: Icon, subtitle, children, className = '' }) {
  return (
    <motion.section
      variants={revealItem}
      className={`rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[0_2px_6px_-2px_rgb(60_60_58/0.08)] ${className}`}
    >
      <header className="mb-4 flex items-start gap-2.5 border-b border-[#f1f0ee] pb-3">
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f8485e]/10 text-[#f8485e]">
            <Icon size={15} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>{subtitle}</p>}
        </div>
      </header>
      {children}
    </motion.section>
  );
}

/** Percent of the contract window elapsed, or null when a bound is missing. */
function contractProgress(startDate, finishDate) {
  if (!startDate || !finishDate) return null;
  const start = new Date(startDate).getTime();
  const finish = new Date(finishDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(finish) || finish <= start) return null;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (finish - start)) * 100)));
}

function OverviewTab({ project, projectCode, subProjects, totals, currency }) {
  // Every sub-project shares the same contract dates — any one is a valid
  // source, same convention as the BOQ invoicing tracker.
  const contract = subProjects[0];
  const money = (v) => formatCurrency(v, currency);
  const progress = contractProgress(contract?.contractStartDate, contract?.contractFinishDate);

  const revenueMix = [
    { label: 'Professional Services', value: totals.revenuePS },
    { label: 'SW Licenses', value: totals.revenueSWLicenses },
    { label: 'Logistics', value: totals.revenueLogistics },
    { label: 'Training', value: totals.revenueTraining },
    { label: 'External Sub-Contractors', value: totals.revenueExternalSubs },
  ];

  // Cash position, as a share of everything invoiced so far.
  const invoiced = totals.totalInvoicesValue || 0;
  const segments = [
    { label: 'Collected', value: totals.collectedValue, color: SERIES[2] },
    { label: 'Non-collected', value: totals.nonCollectedValue, color: STATUS.warning },
  ].filter((s) => s.value > 0);

  return (
    <Reveal className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* ---------------- Contract identity ---------------- */}
      <div className="flex flex-col gap-5">
        <Panel title="Contract Information" icon={FileSignature}>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Contract Name" value={project.contractName} />
            <InfoRow label="Project Code" value={projectCode} />
            <InfoRow label="Signature Date" value={formatDate(contract?.contractSignatureDate)} />
            <InfoRow label="Site Receipt Date" value={formatDate(contract?.siteReceiptDate)} />
          </div>
        </Panel>

        <Panel
          title="Contract Timeline"
          icon={CalendarClock}
          subtitle={contract?.contractDuration ? `Duration: ${contract.contractDuration}` : undefined}
        >
          {progress === null ? (
            <p className="py-4 text-sm" style={{ color: CHROME.textMuted }}>
              Contract start and finish dates haven&apos;t been set for this project yet.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                  {formatDate(contract.contractStartDate)}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: progress === 100 ? STATUS.critical : CHROME.textPrimary }}
                >
                  {progress === 100 ? 'Term ended' : `${progress}% elapsed`}
                </span>
                <span className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                  {formatDate(contract.contractFinishDate)}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-[#f1f0ee]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: progress === 100 ? STATUS.critical : SERIES[0] }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* ---------------- Money ---------------- */}
      <div className="flex flex-col gap-5">
        <Panel title="Financial Summary" icon={Wallet} subtitle="Aggregated across all sub-projects">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Project Value" value={money(totals.projectValue)} />
            <InfoRow label="VAT Value" value={money(totals.vatValue)} />
            <InfoRow label="Total Revenue" value={money(totals.totalRevenue)} />
            <InfoRow label="Work in Progress" value={money(totals.wip)} />
          </div>

          {/* Cash position — a stacked bar with a 2px surface gap between
              fills so the segments read as separate without needing borders. */}
          {invoiced > 0 && segments.length > 0 && (
            <div className="mt-5 border-t border-[#f1f0ee] pt-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-semibold" style={{ color: CHROME.textSecondary }}>
                  Cash position
                </span>
                <span className="text-xs tabular-nums" style={{ color: CHROME.textMuted }}>
                  {money(invoiced)} invoiced
                </span>
              </div>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-[#f1f0ee]">
                {segments.map((seg) => (
                  <motion.div
                    key={seg.label}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ backgroundColor: seg.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(seg.value / invoiced) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                {segments.map((seg) => (
                  <li key={seg.label} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: seg.color }} aria-hidden="true" />
                    <span style={{ color: CHROME.textSecondary }}>{seg.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
                      {money(seg.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Revenue Mix" icon={Layers} subtitle="By stream, ranked">
          <MetricBars
            items={revenueMix}
            format={money}
            emptyMessage="No revenue has been broken down by stream yet."
          />
        </Panel>
      </div>
    </Reveal>
  );
}

export default memo(OverviewTab);
