'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FileBarChart,
  FileText,
  FileSpreadsheet,
  Download,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { addToast } from '@/store/slices/uiSlice';
import { mockProjects } from '@/mock/projects';
import { mockBOQItems } from '@/mock/boq';
import { mockInvoices } from '@/mock/invoices';
import { INVOICE_STATUS, BOQ_STATUS, PROJECT_STATUS } from '@/constants/statuses';
import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card, { CardHeader } from '@/components/common/Card';
import Badge, { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { formatCurrency, formatDate } from '@/utils/formatters';

function formatPercent(n, d) {
  if (!d) return '0%';
  return `${Math.round((n / d) * 100)}%`;
}

// ---- Report data builders ----

function buildProjectSummary() {
  return mockProjects.map((p) => {
    const projectInvoices = mockInvoices.filter((i) => i.projectId === p.id);
    const approved = projectInvoices.filter((i) => i.status === INVOICE_STATUS.APPROVED);
    const pending = projectInvoices.filter((i) => i.status !== INVOICE_STATUS.APPROVED && i.status !== INVOICE_STATUS.REJECTED);
    return {
      id: p.id,
      projectName: p.projectName,
      client: p.clientName,
      status: p.status,
      projectValue: p.projectValue,
      totalRevenue: p.totalRevenue,
      wip: p.wip,
      invoices: projectInvoices.length,
      collected: p.collectedValue,
      nonCollected: p.nonCollectedValue,
      collectionRate: formatPercent(p.collectedValue, p.totalRevenue),
    };
  });
}

function buildBOQStatus() {
  return mockBOQItems.slice(0, 12).map((b) => {
    const project = mockProjects.find((p) => p.id === b.projectId);
    return {
      id: b.id,
      item: b.englishItem,
      project: project?.projectName || '—',
      totalCost: b.totalCost,
      status: b.status,
      expectedDate: b.expectedInvoicingDate,
      invoiced: b.invoicedQuantity > 0 ? 'Yes' : 'No',
    };
  });
}

function buildInvoiceCollection() {
  return mockProjects.map((p) => {
    const projectInvoices = mockInvoices.filter((i) => i.projectId === p.id);
    const totalInvoiced = projectInvoices.reduce((sum, i) => sum + (i.invoiceAmount || 0), 0);
    const approved = projectInvoices.filter((i) => i.status === INVOICE_STATUS.APPROVED);
    const rejected = projectInvoices.filter((i) => i.status === INVOICE_STATUS.REJECTED);
    return {
      id: p.id,
      project: p.projectName,
      client: p.clientName,
      totalInvoiced,
      collected: p.collectedValue,
      outstanding: p.nonCollectedValue,
      rate: formatPercent(p.collectedValue, totalInvoiced || p.totalRevenue),
      invoiceCount: projectInvoices.length,
      approved: approved.length,
      rejected: rejected.length,
    };
  });
}

// ---- Report card component ----

function ReportCard({ title, description, icon: Icon, iconColor, lastGenerated, children, onGenerate, loading }) {
  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={description}
        icon={Icon}
        action={
          <Button
            size="sm"
            variant="outline"
            icon={loading ? RefreshCw : Download}
            loading={loading}
            onClick={onGenerate}
            className={loading ? 'animate-pulse' : ''}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        }
      />
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <Clock size={11} />
        Last generated: {lastGenerated}
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        {children}
      </div>
    </Card>
  );
}

export default function ReportsPage() {
  const dispatch = useDispatch();
  const currency = useSelector((s) => s.ui.currency);
  const [loadingReport, setLoadingReport] = useState(null);

  const projectData = buildProjectSummary();
  const boqData = buildBOQStatus();
  const collectionData = buildInvoiceCollection();

  async function handleGenerate(reportId, reportName) {
    setLoadingReport(reportId);
    await new Promise((r) => setTimeout(r, 1500));
    setLoadingReport(null);
    dispatch(addToast({
      type: 'success',
      title: 'Report generated',
      message: `${reportName} has been generated successfully.`,
    }));
  }

  const projectColumns = [
    { key: 'projectName', label: 'Project', render: (v) => <span className="font-medium text-gray-800 text-xs">{v}</span> },
    { key: 'client', label: 'Client', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} size="sm" />, sortable: false },
    { key: 'projectValue', label: 'Value', align: 'right', render: (v) => <span className="text-xs font-mono">{formatCurrency(v, currency)}</span> },
    { key: 'totalRevenue', label: 'Revenue', align: 'right', render: (v) => <span className="text-xs font-mono text-green-700">{formatCurrency(v, currency)}</span> },
    { key: 'wip', label: 'WIP', align: 'right', render: (v) => <span className="text-xs font-mono text-amber-700">{formatCurrency(v, currency)}</span> },
    { key: 'collectionRate', label: 'Collection %', align: 'center', render: (v) => (
      <span className={`text-xs font-bold ${parseInt(v) >= 80 ? 'text-green-600' : parseInt(v) >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{v}</span>
    )},
  ];

  const boqColumns = [
    { key: 'item', label: 'BOQ Item', render: (v) => <span className="text-xs font-medium text-gray-800">{v}</span> },
    { key: 'project', label: 'Project', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'status', label: 'Status', sortable: false, render: (v) => <StatusBadge status={v} size="sm" /> },
    { key: 'totalCost', label: 'Cost', align: 'right', render: (v) => <span className="text-xs font-mono">{formatCurrency(v, currency)}</span> },
    { key: 'expectedDate', label: 'Expected Invoicing Date', render: (v) => <span className="text-xs text-gray-500">{v ? formatDate(v) : '—'}</span> },
    { key: 'invoiced', label: 'Invoiced', align: 'center', render: (v) => (
      v === 'Yes'
        ? <CheckCircle size={14} className="text-green-500 mx-auto" />
        : <span className="text-xs text-gray-400">—</span>
    )},
  ];

  const collectionColumns = [
    { key: 'project', label: 'Project', render: (v) => <span className="text-xs font-medium text-gray-800">{v}</span> },
    { key: 'client', label: 'Client', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'totalInvoiced', label: 'Invoiced', align: 'right', render: (v) => <span className="text-xs font-mono">{formatCurrency(v, currency)}</span> },
    { key: 'collected', label: 'Collected', align: 'right', render: (v) => <span className="text-xs font-mono text-green-700">{formatCurrency(v, currency)}</span> },
    { key: 'outstanding', label: 'Outstanding', align: 'right', render: (v) => <span className="text-xs font-mono text-red-600">{formatCurrency(v, currency)}</span> },
    { key: 'rate', label: 'Rate', align: 'center', render: (v) => {
      const n = parseInt(v);
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-xs font-bold ${n >= 80 ? 'text-green-600' : n >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{v}</span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${n >= 80 ? 'bg-green-500' : n >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${Math.min(n, 100)}%` }} />
          </div>
        </div>
      );
    }},
    { key: 'invoiceCount', label: 'Invoices', align: 'center', render: (v) => <span className="text-xs text-gray-600">{v}</span> },
  ];

  // Summary stats
  const totalRevenue = mockProjects.reduce((s, p) => s + p.totalRevenue, 0);
  const totalCollected = mockProjects.reduce((s, p) => s + p.collectedValue, 0);
  const totalOutstanding = mockProjects.reduce((s, p) => s + p.nonCollectedValue, 0);
  const overallRate = formatPercent(totalCollected, totalRevenue);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate and download operational reports for projects, BOQ, and invoicing"
        breadcrumbs={[{ label: 'Reports' }]}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Projects', value: mockProjects.length, icon: FileText, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue, currency), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Collected', value: formatCurrency(totalCollected, currency), icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Outstanding', value: formatCurrency(totalOutstanding, currency), icon: Clock, color: 'bg-red-50 text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {/* Report 1: Project Summary */}
        <ReportCard
          title="Project Summary Report"
          description="All projects with revenue breakdown, WIP status, and invoice collection performance"
          icon={FileBarChart}
          lastGenerated="15 Jun 2026, 09:00"
          loading={loadingReport === 'project'}
          onGenerate={() => handleGenerate('project', 'Project Summary Report')}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {projectColumns.map((col) => (
                  <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projectData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {projectColumns.map((col) => (
                    <td key={col.key} className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-3 py-2.5 text-xs font-bold text-gray-700" colSpan={3}>Totals</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold font-mono">{formatCurrency(mockProjects.reduce((s, p) => s + p.projectValue, 0), currency)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold text-green-700 font-mono">{formatCurrency(totalRevenue, currency)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold text-amber-700 font-mono">{formatCurrency(mockProjects.reduce((s, p) => s + p.wip, 0), currency)}</td>
                <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-700">{overallRate}</td>
              </tr>
            </tfoot>
          </table>
        </ReportCard>

        {/* Report 2: BOQ Status */}
        <ReportCard
          title="BOQ Status Report"
          description="All BOQ items grouped by status — track pending verifications, approvals, and invoicing readiness"
          icon={FileSpreadsheet}
          lastGenerated="14 Jun 2026, 17:30"
          loading={loadingReport === 'boq'}
          onGenerate={() => handleGenerate('boq', 'BOQ Status Report')}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {boqColumns.map((col) => (
                  <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {boqData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {boqColumns.map((col) => (
                    <td key={col.key} className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ReportCard>

        {/* Report 3: Invoice Collection */}
        <ReportCard
          title="Invoice Collection Report"
          description="Collection rates by project — track outstanding invoices and revenue at risk"
          icon={FileText}
          lastGenerated="13 Jun 2026, 11:15"
          loading={loadingReport === 'collection'}
          onGenerate={() => handleGenerate('collection', 'Invoice Collection Report')}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {collectionColumns.map((col) => (
                  <th key={col.key} className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {collectionData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {collectionColumns.map((col) => (
                    <td key={col.key} className={`px-3 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-3 py-2.5 text-xs font-bold text-gray-700" colSpan={2}>Overall</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold font-mono">{formatCurrency(mockInvoices.reduce((s, i) => s + (i.invoiceAmount || 0), 0), currency)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold text-green-700 font-mono">{formatCurrency(totalCollected, currency)}</td>
                <td className="px-3 py-2.5 text-right text-xs font-bold text-red-600 font-mono">{formatCurrency(totalOutstanding, currency)}</td>
                <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-700">{overallRate}</td>
                <td className="px-3 py-2.5 text-center text-xs font-bold text-gray-700">{mockInvoices.length}</td>
              </tr>
            </tfoot>
          </table>
        </ReportCard>
      </div>
    </div>
  );
}
