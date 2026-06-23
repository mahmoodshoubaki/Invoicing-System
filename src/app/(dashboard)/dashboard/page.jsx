'use client';

import {
  FolderKanban,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  BanknoteIcon,
  CalendarX,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

import Card, { StatCard, CardHeader } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import PageHeader from '@/components/common/PageHeader';
import RevenueChart from '@/components/charts/RevenueChart';
import InvoiceStatusChart from '@/components/charts/InvoiceStatusChart';
import SLAViolationWidget from '@/components/common/SLAViolationWidget';

import { mockProjects } from '@/mock/projects';
import { mockInvoices } from '@/mock/invoices';
import { mockBOQItems } from '@/mock/boq';
import { mockUsers } from '@/mock/users';
import { INVOICE_STATUS, BOQ_STATUS, PROJECT_STATUS } from '@/constants/statuses';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function formatSARM(amount) {
  return `SAR ${(amount / 1_000_000).toFixed(1)}M`;
}

function formatSARK(amount) {
  if (amount >= 1_000_000) return `SAR ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `SAR ${(amount / 1_000).toFixed(0)}K`;
  return `SAR ${amount.toLocaleString()}`;
}

function getUserName(userId) {
  const user = mockUsers.find((u) => u.id === userId);
  return user ? user.name : 'N/A';
}

// ---------------------------------------------------------------------------
// Derived KPI values from mock data
// ---------------------------------------------------------------------------

const totalProjects = mockProjects.length;
const activeProjects = mockProjects.filter((p) => p.status === PROJECT_STATUS.ACTIVE);

const totalRevenue = mockProjects.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
// const totalWIP = mockProjects.reduce((sum, p) => sum + (p.wip || 0), 0);
const totalCollected = mockProjects.reduce((sum, p) => sum + (p.collectedValue || 0), 0);
const totalNonCollected = mockProjects.reduce((sum, p) => sum + (p.nonCollectedValue || 0), 0);
const totalInvoices = mockInvoices.length;

const pendingApprovalInvoices = mockInvoices.filter(
  (inv) => inv.status === INVOICE_STATUS.SUBMITTED || inv.status === INVOICE_STATUS.UNDER_REVIEW
);
const pendingApprovals = pendingApprovalInvoices.length;

const delayedBOQItems = mockBOQItems.filter((b) => b.status === BOQ_STATUS.DELAYED);
const delayedBOQCount = delayedBOQItems.length;

// Collected invoice value (approved invoices)
const collectedInvoiceValue = mockInvoices
  .filter((inv) => inv.status === INVOICE_STATUS.APPROVED)
  .reduce((sum, inv) => sum + inv.invoiceAmount, 0);

  const totalWIP = totalRevenue - collectedInvoiceValue;

const nonCollectedInvoiceValue = mockInvoices
  .filter((inv) => inv.status !== INVOICE_STATUS.APPROVED && inv.status !== INVOICE_STATUS.REJECTED)
  .reduce((sum, inv) => sum + inv.invoiceAmount, 0);

// ---------------------------------------------------------------------------
// SLA Violations — derived from BOQ delayed items + invoice delayed
// ---------------------------------------------------------------------------
const slaViolations = [
  {
    id: 'sla-001',
    projectName: 'ERP Implementation Phase 2',
    boqItem: 'SAP Finance Module Configuration',
    daysOverdue: 47,
    level: 2,
  },
  {
    id: 'sla-002',
    projectName: 'Data Analytics Platform',
    boqItem: 'Data Lake Architecture Design',
    daysOverdue: 168,
    level: 3,
  },
  {
    id: 'sla-003',
    projectName: 'Digital Transformation Initiative',
    boqItem: 'Cloud Migration - Wave 1',
    daysOverdue: 22,
    level: 1,
  },
  {
    id: 'sla-004',
    projectName: 'HR Digital Transformation',
    boqItem: 'Talent Management Platform Implementation',
    daysOverdue: 1,
    level: 1,
  },
];

// ---------------------------------------------------------------------------
// Revenue trend — last 6 months (realistic static data derived from mock)
// ---------------------------------------------------------------------------
const revenueTrendData = [
  { month: 'Jan', revenue: 1_200_000, invoiced: 950_000, collected: 800_000 },
  { month: 'Feb', revenue: 1_450_000, invoiced: 1_100_000, collected: 950_000 },
  { month: 'Mar', revenue: 1_380_000, invoiced: 1_250_000, collected: 1_050_000 },
  { month: 'Apr', revenue: 1_700_000, invoiced: 1_400_000, collected: 1_200_000 },
  { month: 'May', revenue: 1_520_000, invoiced: 1_150_000, collected: 900_000 },
  { month: 'Jun', revenue: 1_950_000, invoiced: 1_600_000, collected: 1_250_000 },
];

// ---------------------------------------------------------------------------
// Invoice status distribution for PieChart
// ---------------------------------------------------------------------------
const invoiceStatusData = [
  {
    name: 'Approved',
    value: mockInvoices.filter((i) => i.status === INVOICE_STATUS.APPROVED).length,
    color: '#16a34a',
  },
  {
    name: 'Under Review',
    value: mockInvoices.filter((i) => i.status === INVOICE_STATUS.UNDER_REVIEW).length,
    color: '#fcc354',
  },
  {
    name: 'Submitted',
    value: mockInvoices.filter((i) => i.status === INVOICE_STATUS.SUBMITTED).length,
    color: '#2563eb',
  },
  {
    name: 'Draft',
    value: mockInvoices.filter((i) => i.status === INVOICE_STATUS.DRAFT).length,
    color: '#9ca3af',
  },
  {
    name: 'Rejected',
    value: mockInvoices.filter((i) => i.status === INVOICE_STATUS.REJECTED).length,
    color: '#f8485e',
  },
  {
    name: 'Delayed',
    value: mockInvoices.filter((i) => i.status === INVOICE_STATUS.DELAYED).length,
    color: '#ea580c',
  },
].filter((d) => d.value > 0);

// ---------------------------------------------------------------------------
// Recent projects — last 5 by updatedAt
// ---------------------------------------------------------------------------
const recentProjects = [...mockProjects]
  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  .slice(0, 5);

// ---------------------------------------------------------------------------
// Pending approvals — submitted + under review invoices
// ---------------------------------------------------------------------------
const pendingApprovalList = pendingApprovalInvoices.slice(0, 5).map((inv) => {
  const project = mockProjects.find((p) => p.id === inv.projectId);
  return { ...inv, projectName: project?.projectName || 'Unknown Project' };
});

// ---------------------------------------------------------------------------
// Small secondary stat cards data
// ---------------------------------------------------------------------------
const secondaryStats = [
  {
    title: 'Total Invoices',
    value: totalInvoices,
    icon: FileText,
    color: 'info',
    subtitle: `${pendingApprovals} awaiting action`,
  },
  {
    title: 'Collected Value',
    value: formatSARK(collectedInvoiceValue),
    icon: CheckCircle,
    color: 'success',
    subtitle: 'Approved invoices',
  },
  {
    title: 'Non-Collected',
    value: formatSARK(nonCollectedInvoiceValue),
    icon: BanknoteIcon,
    color: 'warning',
    subtitle: 'Pending collection',
  },
  {
    title: 'Delayed BOQ Items',
    value: delayedBOQCount,
    icon: CalendarX,
    color: 'danger',
    subtitle: 'Require immediate action',
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`Overview as of ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
      />

      {/* ----------------------------------------------------------------- */}
      {/* Primary KPI row                                                   */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          color="info"
          subtitle={`${activeProjects.length} active`}
          change={`${activeProjects.length} active / ${totalProjects} total`}
          changeType="neutral"
        />
        <StatCard
          title="Total Revenue"
          value={formatSARM(totalRevenue)}
          icon={TrendingUp}
          color="success"
          subtitle="Across all projects"
          change="Recognised revenue"
          changeType="neutral"
        />
        <StatCard
          title="Total WIP"
          value={formatSARM(totalWIP)}
          icon={Activity}
          color="warning"
          subtitle="Work in progress"
          change="Not yet invoiced"
          changeType="neutral"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals}
          icon={Clock}
          color="danger"
          subtitle="Invoices awaiting action"
          change={pendingApprovals > 0 ? 'Action required' : 'All clear'}
          changeType={pendingApprovals > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          title="SLA Violations"
          value={slaViolations.length}
          icon={AlertTriangle}
          color="danger"
          subtitle={`${slaViolations.filter((v) => v.level >= 2).length} critical`}
          change={slaViolations.length > 0 ? 'Needs attention' : 'Compliant'}
          changeType={slaViolations.length > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Secondary stats row                                               */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat) => (
          <Card key={stat.title} className="flex items-start gap-3 p-4">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                stat.color === 'info'
                  ? 'bg-blue-50'
                  : stat.color === 'success'
                  ? 'bg-green-50'
                  : stat.color === 'warning'
                  ? 'bg-yellow-50'
                  : 'bg-red-50'
              }`}
            >
              <stat.icon
                size={17}
                className={
                  stat.color === 'info'
                    ? 'text-blue-600'
                    : stat.color === 'success'
                    ? 'text-green-600'
                    : stat.color === 'warning'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium leading-tight">{stat.title}</p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  stat.color === 'info'
                    ? 'text-blue-700'
                    : stat.color === 'success'
                    ? 'text-green-700'
                    : stat.color === 'warning'
                    ? 'text-yellow-700'
                    : 'text-red-700'
                }`}
              >
                {stat.value}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{stat.subtitle}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Charts row                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue trend — takes 3/5 columns */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Revenue Trend"
            subtitle="Monthly revenue, invoiced & collected — last 6 months"
            icon={TrendingUp}
          />
          <RevenueChart data={revenueTrendData} />
        </Card>

        {/* Invoice status donut — takes 2/5 columns */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Invoice Status Distribution"
            subtitle={`${totalInvoices} total invoices`}
            icon={FileText}
          />
          <InvoiceStatusChart data={invoiceStatusData} />
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom row: Recent projects | Pending approvals | SLA violations */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Projects */}
        <Card padding={false} className="lg:col-span-1 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <CardHeader
              title="Recent Projects"
              subtitle="Last updated"
              icon={FolderKanban}
              action={
                <Link
                  href="/projects"
                  className="text-xs text-primary font-medium hover:opacity-80 flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </Link>
              }
            />
          </div>
          <div className="divide-y divide-gray-50">
            {recentProjects.map((project) => (
              <div key={project.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {project.projectName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {project.clientName} &middot; {getUserName(project.projectManager)}
                    </p>
                    <p className="text-xs font-medium text-primary mt-1">
                      {formatSARK(project.projectValue)}
                    </p>
                  </div>
                  <StatusBadge status={project.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card padding={false} className="lg:col-span-1 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <CardHeader
              title="Pending Approvals"
              subtitle={`${pendingApprovals} invoices awaiting action`}
              icon={Clock}
              action={
                <Link
                  href="/invoices"
                  className="text-xs text-primary font-medium hover:opacity-80 flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </Link>
              }
            />
          </div>
          {pendingApprovalList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2 px-5">
              <CheckCircle size={28} className="text-green-400" />
              <p className="text-sm font-medium text-green-700">All invoices are processed</p>
              <p className="text-xs text-gray-400">No pending approvals at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingApprovalList.map((inv) => (
                <div key={inv.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {inv.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{inv.projectName}</p>
                      <p className="text-xs font-medium text-primary mt-1">
                        {formatSARK(inv.invoiceAmount)}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* SLA Violations */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="SLA Violations"
            subtitle={`${slaViolations.length} active violation${slaViolations.length !== 1 ? 's' : ''}`}
            icon={AlertTriangle}
            action={
              slaViolations.length > 0 ? (
                <Link
                  href="/projects"
                  className="text-xs text-primary font-medium hover:opacity-80 flex items-center gap-1"
                >
                  View all <ArrowRight size={12} />
                </Link>
              ) : null
            }
          />
          <SLAViolationWidget violations={slaViolations} viewAllHref="/projects" />
        </Card>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Financial summary strip                                           */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Total Collected</p>
          <p className="text-xl font-bold text-green-700 mt-1">{formatSARM(totalCollected)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Across all projects</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Non-Collected</p>
          <p className="text-xl font-bold text-yellow-700 mt-1">{formatSARM(totalNonCollected)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Receivables outstanding</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Total BOQ Items</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{mockBOQItems.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {mockBOQItems.filter((b) => b.status === BOQ_STATUS.INVOICED).length} invoiced
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 font-medium">Collection Rate</p>
          <p className="text-xl font-bold text-primary mt-1">
            {totalRevenue > 0 ? `${Math.round((totalCollected / totalRevenue) * 100)}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Collected vs. revenue</p>
        </Card>
      </div>
    </div>
  );
}
