'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, FileSignature, Layers, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import MetricBars from '@/components/charts/MetricBars';
import Reveal, { revealItem } from '@/components/motion/Reveal';
import InfoRow from './InfoRow';
import { CHROME, SERIES, STATUS } from '@/theme/vizPalette';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { formatCurrency } from '@/utils/formatters';

const ltr = (chunks) => <span dir="ltr">{chunks}</span>;

function Panel({ title, icon: Icon, subtitle, children, className = '' }) {
  return (
    <motion.section
      variants={revealItem}
      className={`rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)] ${className}`}
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

function contractProgress(startDate, finishDate) {
  if (!startDate || !finishDate) return null;
  const start = new Date(startDate).getTime();
  const finish = new Date(finishDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(finish) || finish <= start) return null;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / (finish - start)) * 100)));
}

function OverviewTab({ project, projectCode, subProjects, totals, currency }) {
  const t = useTranslations('projects');
  const format = useLocaleFormat();
  const contract = subProjects.find((p) => p.isMainProject) ?? subProjects[0];
  const money = (v) => formatCurrency(v, currency);
  const progress = contractProgress(contract?.contractStartDate, contract?.contractFinishDate);

  const revenueMix = [
    { label: t('overview.streams.ps'), value: totals.revenuePS },
    { label: t('overview.streams.swLicenses'), value: totals.revenueSWLicenses },
    { label: t('overview.streams.logistics'), value: totals.revenueLogistics },
    { label: t('overview.streams.training'), value: totals.revenueTraining },
    { label: t('overview.streams.externalSubs'), value: totals.revenueExternalSubs },
  ];

  const invoiced = totals.totalInvoicesValue || 0;
  const segments = [
    { key: 'collected', label: t('overview.collected'), value: totals.collectedValue, color: SERIES[2] },
    { key: 'nonCollected', label: t('overview.nonCollected'), value: totals.nonCollectedValue, color: STATUS.warning },
  ].filter((s) => s.value > 0);

  return (
    <Reveal className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Panel title={t('overview.contractInfo')} icon={FileSignature}>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label={t('overview.contractName')} value={project.contractName} />
            <InfoRow label={t('overview.projectCode')} value={<span dir="ltr">{projectCode}</span>} />
            <InfoRow label={t('overview.bdm')} value={contract?.bdm} />
            <InfoRow label={t('overview.businessUnit')} value={contract?.businessUnit} />
            <InfoRow label={t('overview.signatureDate')} value={format.date(contract?.contractSignatureDate)} />
            <InfoRow label={t('overview.siteReceiptDate')} value={format.date(contract?.siteReceiptDate)} />
          </div>
        </Panel>

        <Panel
          title={t('overview.timeline')}
          icon={CalendarClock}
          subtitle={contract?.contractDuration ? t('overview.duration', { value: contract.contractDuration }) : undefined}
        >
          {progress === null ? (
            <p className="py-4 text-sm" style={{ color: CHROME.textMuted }}>
              {t('overview.noDates')}
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                  {format.date(contract.contractStartDate)}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: progress === 100 ? STATUS.critical : CHROME.textPrimary }}
                >
                  {progress === 100 ? t('card.termEnded') : t('card.elapsed', { percent: progress })}
                </span>
                <span className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                  {format.date(contract.contractFinishDate)}
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

      <div className="flex flex-col gap-5">
        <Panel title={t('overview.financialSummary')} icon={Wallet} subtitle={t('overview.financialSummaryNote')}>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label={t('overview.projectValue')} value={money(totals.projectValue)} />
            <InfoRow label={t('overview.vatValue')} value={money(totals.vatValue)} />
            <InfoRow label={t('overview.totalRevenue')} value={money(totals.totalRevenue)} />
            <InfoRow label={t('overview.wip')} value={money(totals.wip)} />
          </div>

          {invoiced > 0 && segments.length > 0 && (
            <div className="mt-5 border-t border-[#f1f0ee] pt-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-semibold" style={{ color: CHROME.textSecondary }}>
                  {t('overview.cashPosition')}
                </span>
                <span className="text-xs tabular-nums" style={{ color: CHROME.textMuted }}>
                  {t.rich('overview.invoicedAmount', { value: money(invoiced), amount: ltr })}
                </span>
              </div>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-[#f1f0ee]">
                {segments.map((seg) => (
                  <motion.div
                    key={seg.key}
                    className="h-full first:rounded-s-full last:rounded-e-full"
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
                  <li key={seg.key} className="flex items-center gap-1.5 text-xs">
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

        <Panel title={t('overview.revenueMix')} icon={Layers} subtitle={t('overview.revenueMixNote')}>
          <MetricBars
            items={revenueMix}
            format={money}
            emptyMessage={t('overview.noRevenue')}
          />
        </Panel>
      </div>
    </Reveal>
  );
}

export default memo(OverviewTab);
