'use client';

import { MotionConfig, motion } from 'motion/react';
import Link from 'next/link';
import {
  Activity, AlertTriangle, ArrowRight, BanknoteIcon, CalendarX, CheckCircle2,
  Clock, FileEdit, FileText, FolderKanban, Send, TrendingUp, XCircle,
} from 'lucide-react';
import { useSelector } from 'react-redux';

import { StatusBadge } from '@/components/common/Badge';
import SLAViolationWidget from '@/components/common/SLAViolationWidget';
import RevenueAreaChart from '@/components/charts/RevenueAreaChart';
import StatusBreakdown from '@/components/charts/StatusBreakdown';
import KpiTile from '@/components/dashboard/KpiTile';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import Reveal, { revealItem } from '@/components/motion/Reveal';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';

import { mockProjects } from '@/mock/projects';
import { mockInvoices } from '@/mock/invoices';
import { mockBOQItems } from '@/mock/boq';
import { mockUsers } from '@/mock/users';
import { INVOICE_STATUS, BOQ_STATUS, PROJECT_STATUS } from '@/constants/statuses';
import { formatCurrency, formatDate } from '@/utils';
import { invoiceNumberOrPending } from '@/utils/invoiceDisplay';

// ---------------------------------------------------------------------------
// Derived KPI values from mock data
// ---------------------------------------------------------------------------

function getUserName(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? user.name : 'N/A';
}

const activeProjects = mockProjects.filter((p) => p.status === PROJECT_STATUS.ACTIVE);
const totalRevenue = mockProjects.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
const totalCollected = mockProjects.reduce((sum, p) => sum + (p.collectedValue || 0), 0);
const totalInvoices = mockInvoices.length;

const pendingApprovalInvoices = mockInvoices.filter(
  (inv) => inv.status === INVOICE_STATUS.SUBMITTED || inv.status === INVOICE_STATUS.UNDER_REVIEW
);
const pendingApprovals = pendingApprovalInvoices.length;
const delayedBOQCount = mockBOQItems.filter((b) => b.status === BOQ_STATUS.DELAYED).length;

const collectedInvoiceValue = mockInvoices
  .filter((inv) => inv.status === INVOICE_STATUS.APPROVED)
  .reduce((sum, inv) => sum + inv.invoiceAmount, 0);

const totalWIP = totalRevenue - collectedInvoiceValue;
const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

const slaViolations = [
  { id: 'sla-001', projectName: 'ERP Implementation Phase 2', boqItem: 'SAP Finance Module Configuration', daysOverdue: 47, level: 2 },
  { id: 'sla-002', projectName: 'Data Analytics Platform', boqItem: 'Data Lake Architecture Design', daysOverdue: 168, level: 3 },
  { id: 'sla-003', projectName: 'Digital Transformation Initiative', boqItem: 'Cloud Migration - Wave 1', daysOverdue: 22, level: 1 },
  { id: 'sla-004', projectName: 'HR Digital Transformation', boqItem: 'Talent Management Platform Implementation', daysOverdue: 1, level: 1 },
];

const revenueTrendData = [
  { month: 'Jan', revenue: 1_200_000, invoiced: 950_000, collected: 800_000 },
  { month: 'Feb', revenue: 1_450_000, invoiced: 1_100_000, collected: 950_000 },
  { month: 'Mar', revenue: 1_380_000, invoiced: 1_250_000, collected: 1_050_000 },
  { month: 'Apr', revenue: 1_700_000, invoiced: 1_400_000, collected: 1_200_000 },
  { month: 'May', revenue: 1_520_000, invoiced: 1_150_000, collected: 900_000 },
  { month: 'Jun', revenue: 1_950_000, invoiced: 1_600_000, collected: 1_250_000 },
];

const revenueTrend = revenueTrendData.map((d) => d.revenue);
const invoicedTrend = revenueTrendData.map((d) => d.invoiced);
const collectedTrend = revenueTrendData.map((d) => d.collected);

/**
 * Invoice states. Each pairs a reserved status colour with its own icon and
 * label so the state never rides on hue alone — required, since several of
 * these hues sit close together for colour-blind viewers.
 */
const invoiceStatusData = [
  { name: 'Approved', status: INVOICE_STATUS.APPROVED, color: STATUS.good, icon: CheckCircle2 },
  { name: 'Under Review', status: INVOICE_STATUS.UNDER_REVIEW, color: STATUS.warning, icon: Clock },
  { name: 'Submitted', status: INVOICE_STATUS.SUBMITTED, color: STATUS.info, icon: Send },
  { name: 'Draft', status: INVOICE_STATUS.DRAFT, color: STATUS.neutral, icon: FileEdit },
  { name: 'Rejected', status: INVOICE_STATUS.REJECTED, color: STATUS.critical, icon: XCircle },
  { name: 'Delayed', status: INVOICE_STATUS.DELAYED, color: STATUS.serious, icon: AlertTriangle },
]
  .map((s) => ({ ...s, value: mockInvoices.filter((i) => i.status === s.status).length }))
  .filter((s) => s.value > 0);

const recentProjects = [...mockProjects]
  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  .slice(0, 5);

const pendingApprovalList = pendingApprovalInvoices.slice(0, 5).map((inv) => ({
  ...inv,
  projectName: mockProjects.find((p) => p.id === inv.projectId)?.projectName || 'Unknown Project',
}));

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ---------------------------------------------------------------------------
// Hero — collection rate as a single headline figure
// ---------------------------------------------------------------------------

function CollectionRing({ value }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
        <motion.circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (value / 100) * circumference }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fcc354" />
            <stop offset="100%" stopColor="#f8485e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold text-white">
          <AnimatedCounter value={value} format={(v) => `${Math.round(v)}%`} duration={1.4} />
        </p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/45">
          Collected
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const currency = useSelector((state) => state.ui.currency);
  const money = (v) => formatCurrency(v, currency);

  const kpis = [
    {
      label: 'Total Revenue',
      value: totalRevenue,
      format: money,
      icon: TrendingUp,
      accent: SERIES_ROLE.revenue,
      trend: revenueTrend,
      delta: 'Recognised',
      deltaType: 'neutral',
      footnote: `Across ${mockProjects.length} projects`,
    },
    {
      label: 'Collected',
      value: collectedInvoiceValue,
      format: money,
      icon: CheckCircle2,
      accent: SERIES_ROLE.collected,
      trend: collectedTrend,
      delta: `${collectionRate}% of revenue`,
      deltaType: 'positive',
      footnote: 'Approved invoices',
    },
    {
      label: 'Work in Progress',
      value: totalWIP,
      format: money,
      icon: Activity,
      accent: SERIES_ROLE.wip,
      trend: invoicedTrend,
      delta: 'Not yet invoiced',
      deltaType: 'neutral',
      footnote: 'Revenue less collected',
    },
    {
      label: 'Pending Approvals',
      value: pendingApprovals,
      icon: Clock,
      accent: STATUS.warning,
      delta: pendingApprovals > 0 ? 'Action required' : 'All clear',
      deltaType: pendingApprovals > 0 ? 'negative' : 'positive',
      footnote: `${totalInvoices} invoices total`,
    },
    {
      label: 'SLA Violations',
      value: slaViolations.length,
      icon: AlertTriangle,
      accent: STATUS.critical,
      delta: `${slaViolations.filter((v) => v.level >= 2).length} critical`,
      deltaType: slaViolations.length > 0 ? 'negative' : 'positive',
      footnote: `${delayedBOQCount} delayed BOQ items`,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        {/* ============================ Hero ============================ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative isolate overflow-hidden rounded-3xl bg-[#17161c] px-6 py-7 sm:px-9 sm:py-8"
        >
          {/* Ambient colour fields. Held still (2026-10-08): drifting them forever
              made the browser re-blur two 90–100px glows on every frame,
              scrolling included. Still, they are painted once. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -left-16 -top-24 h-72 w-72 rounded-full bg-[#f8485e] opacity-40 blur-[90px]" />
            <div className="absolute -bottom-28 right-10 h-72 w-72 rounded-full bg-[#4a3aa7] opacity-40 blur-[100px]" />
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                backgroundSize: '56px 56px',
              }}
            />
          </div>

          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#fcc354]">
                {greeting()} · {formatDate(new Date())}
              </p>
              <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-white sm:text-[2.5rem] sm:leading-[1.1]">
                Executive Dashboard
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {activeProjects.length} active projects ·{' '}
                <span className="font-semibold text-white/80">{money(totalRevenue)}</span> recognised
                revenue, with{' '}
                <span className="font-semibold text-white/80">{money(totalWIP)}</span> still in progress.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#17161c] transition-colors hover:bg-white/90"
                >
                  <FolderKanban size={15} />
                  Browse projects
                </Link>
                <Link
                  href="/invoices"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  <FileText size={15} />
                  Review invoices
                  {pendingApprovals > 0 && (
                    <span className="ml-0.5 rounded-full bg-[#f8485e] px-1.5 py-0.5 text-[10px] font-bold">
                      {pendingApprovals}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <CollectionRing value={collectionRate} />
          </div>
        </motion.section>

        {/* ========================== KPI tiles ========================== */}
        <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiTile key={kpi.label} {...kpi} />
          ))}
        </Reveal>

        {/* =========================== Charts =========================== */}
        <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <motion.section
            variants={revealItem}
            className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)] lg:col-span-3"
          >
            <header className="mb-5">
              <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>
                Revenue, invoiced &amp; collected
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
                Last six months · all three measures share one scale
              </p>
            </header>
            <RevenueAreaChart data={revenueTrendData} />
          </motion.section>

          <motion.section
            variants={revealItem}
            className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)] lg:col-span-2"
          >
            <header className="mb-5">
              <h2 className="text-base font-semibold tracking-tight" style={{ color: CHROME.textPrimary }}>
                Invoice pipeline
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
                {totalInvoices} invoices by current state
              </p>
            </header>
            <StatusBreakdown data={invoiceStatusData} />
          </motion.section>
        </Reveal>

        {/* ========================= Detail lists ========================= */}
        <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recent projects */}
          <motion.section
            variants={revealItem}
            className="overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white shadow-[var(--shadow-card)]"
          >
            <header className="flex items-center justify-between gap-2 border-b border-[#f1f0ee] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                  Recent Projects
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>Last updated</p>
              </div>
              <Link href="/projects" className="flex items-center gap-1 text-xs font-semibold text-[#f8485e] hover:opacity-80">
                View all <ArrowRight size={12} />
              </Link>
            </header>
            <ul className="divide-y divide-[#f4f3f1]">
              {recentProjects.map((project) => (
                <li key={project.id} className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#faf9f8]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                      {project.projectName}
                    </p>
                    <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
                      {project.clientName} · {getUserName(project.projectManager)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#f8485e] tabular-nums">
                      {money(project.projectValue)}
                    </p>
                  </div>
                  <StatusBadge status={project.status} size="sm" />
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Pending approvals */}
          <motion.section
            variants={revealItem}
            className="overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white shadow-[var(--shadow-card)]"
          >
            <header className="flex items-center justify-between gap-2 border-b border-[#f1f0ee] px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                  Pending Approvals
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
                  {pendingApprovals} awaiting action
                </p>
              </div>
              <Link href="/invoices" className="flex items-center gap-1 text-xs font-semibold text-[#f8485e] hover:opacity-80">
                View all <ArrowRight size={12} />
              </Link>
            </header>
            {pendingApprovalList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <CheckCircle2 size={26} className="text-[#0ca30c]" />
                <p className="text-sm font-semibold text-[#006300]">All invoices processed</p>
                <p className="text-xs" style={{ color: CHROME.textMuted }}>Nothing is waiting on you.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#f4f3f1]">
                {pendingApprovalList.map((inv) => (
                  <li key={inv.id} className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#faf9f8]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                        {invoiceNumberOrPending(inv)}
                      </p>
                      <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
                        {inv.projectName}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#f8485e] tabular-nums">
                        {money(inv.invoiceAmount)}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* SLA violations */}
          <motion.section
            variants={revealItem}
            className="overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]"
          >
            <header className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                  <AlertTriangle size={14} className="text-[#d03b3b]" />
                  SLA Violations
                </h2>
                <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
                  {slaViolations.length} active
                </p>
              </div>
            </header>
            <SLAViolationWidget violations={slaViolations} viewAllHref="/projects" />
          </motion.section>
        </Reveal>

        {/* ======================= Footer summary ======================= */}
        <Reveal className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Collected', value: totalCollected, format: money, accent: SERIES_ROLE.collected, icon: BanknoteIcon },
            { label: 'Outstanding', value: totalRevenue - totalCollected, format: money, accent: STATUS.warning, icon: Clock },
            { label: 'BOQ Items', value: mockBOQItems.length, accent: SERIES_ROLE.invoiced, icon: FileText },
            { label: 'Delayed Items', value: delayedBOQCount, accent: STATUS.serious, icon: CalendarX },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={revealItem}
              className="rounded-2xl border border-[#e9e7e5] bg-white px-4 py-4 text-center shadow-[var(--shadow-card)]"
            >
              <span
                className="mx-auto grid h-8 w-8 place-items-center rounded-lg"
                style={{ backgroundColor: `${s.accent}1a`, color: s.accent }}
              >
                <s.icon size={15} />
              </span>
              {/* Proportional figures, not tabular — these are standalone
                  stat values, not a vertically-aligned column. */}
              <p className="mt-2.5 text-lg font-bold" style={{ color: CHROME.textPrimary }}>
                <AnimatedCounter value={s.value} format={s.format} />
              </p>
              <p className="mt-0.5 text-[11px] font-medium" style={{ color: CHROME.textMuted }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </Reveal>
      </div>
    </MotionConfig>
  );
}
