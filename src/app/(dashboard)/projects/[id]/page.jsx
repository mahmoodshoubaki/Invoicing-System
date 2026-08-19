'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  Banknote,
  TrendingUp,
  FileText,
  Clock,
  ChevronLeft,
  History,
  Edit2,
  Eye,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card, { StatCard } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { ConfirmModal } from '@/components/common/Modal';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import {
  fetchMainProjectDetails,
  fetchSubProjectsSummary,
  selectMainProjectDetails,
  selectMainDetailsLoading,
  selectSubProjects,
  selectSubProjectsLoading,
} from '@/store/slices/projectsSlice';
import { aggregateSubProjectFinancials } from '@/models/project';
import { fetchBOQByProjectCode, selectBOQItems, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { fetchInvoicesByProjectCode, selectInvoices, selectInvoicesLoading } from '@/store/slices/invoicesSlice';
import {
  selectBillingFrequenciesMap,
  selectBoqItemStatusesMap,
  selectBoqItemStatusColorsMap,
  selectInvoiceStatusesMap,
  selectInvoiceStatusColorsMap,
} from '@/store/slices/lookupsSlice';
import { usePermission } from '@/hooks/usePermission';

const TABS = ['Overview', 'EPM Sub-Projects', 'BOQ', 'Invoices'];

export default function ProjectDetailPage() {
  // The route param is the project code (GetProjectsList no longer returns
  // an id) — used directly as the key for every per-project fetch below.
  // Client-side navigations (router.push/<Link>) don't decode %2F etc. back
  // out of the segment the way server-side rendering does, so decode it
  // ourselves here. Safe either way: a value Next already decoded (no % left)
  // passes through decodeURIComponent unchanged.
  const { id: rawId } = useParams();
  const projectCode = decodeURIComponent(rawId);
  const router   = useRouter();
  const dispatch = useDispatch();

  const project          = useSelector(selectMainProjectDetails);
  const mainLoading      = useSelector(selectMainDetailsLoading);
  const subProjects      = useSelector(selectSubProjects);
  const subProjectsLoading = useSelector(selectSubProjectsLoading);
  const currency  = useSelector((s) => s.ui.currency);

  const boqItems              = useSelector(selectBOQItems);
  const currentBOQ            = useSelector(selectCurrentBOQ);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqItemStatusesMap    = useSelector(selectBoqItemStatusesMap);
  const boqItemStatusColorsMap = useSelector(selectBoqItemStatusColorsMap);
  const invoiceStatusesMap    = useSelector(selectInvoiceStatusesMap);
  const invoiceStatusColorsMap = useSelector(selectInvoiceStatusColorsMap);
  const invoices              = useSelector(selectInvoices);
  const invoicesLoading       = useSelector(selectInvoicesLoading);
  const { can } = usePermission();
  const [activeTab, setActiveTab]       = useState('Overview');
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving]       = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
    dispatch(fetchInvoicesByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  const totals = aggregateSubProjectFinancials(subProjects);

  const handleArchive = () => {
    setArchiving(true);
    setTimeout(() => {
      setArchiving(false);
      setArchiveModal(false);
      router.push('/projects');
    }, 600);
  };

  if (mainLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Project not found.</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const subProjectColumns = [
    {
      key: 'projectName',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm leading-tight">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {row.projectCode}
            {row.projectNameFocus ? ` · ${row.projectNameFocus}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'contractName',
      label: 'Contract Name',
      render: (val, row) => (
        <div>
          <p className="text-sm text-gray-700 leading-tight">{val ?? '—'}</p>
          {row.contractNumber != null && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">{row.contractNumber}</p>
          )}
        </div>
      ),
    },
    { key: 'clientName', label: 'Client' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'invoicingPlatform', label: 'Invoicing Platform' },
    {
      key: 'projectValue',
      label: 'Project Value',
      align: 'center',
      render: (val) => <span className="font-semibold text-gray-800 text-sm">{formatCurrency(val, currency)}</span>,
    },
    {
      key: 'wip',
      label: 'WIP',
      align: 'center',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalInvoicesValue',
      label: 'Total Invoiced',
      align: 'center',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  const boqColumns = [
    {
      key: 'englishName',
      label: 'Item',
      render: (val, row) => (
        <div className='w-xs'>
          <p className="font-medium text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.arabicName}</p>
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'center' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'center',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'center',
      render: (val) => <span className="font-semibold">{formatCurrency(val, currency)}</span>,
    },
    {
      key: 'statusId',
      label: 'Status',
      align: 'center',
      sortable: false,
      render: (val) => <StatusBadge status={boqItemStatusesMap[val] ?? '—'} colors={boqItemStatusColorsMap[val]} />,
    },
    {
      key: 'baselineInvoicingDate',
      label: 'Baseline Expected Invoicing Date',
      align: 'center',
      render: (val) => formatDate(val),
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Invoicing Date',
      align: 'center',
      render: (val) => formatDate(val),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing Frequency',
      align: 'center',
      render: (val) => billingFrequenciesMap[val] ?? '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      sortable: false,
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="xs"
            icon={History}
            onClick={() => setHistoryItemId(row.id)}
            title="History"
          />
        </div>
      ),
    },
  ];

  const invoiceColumns = [
    {
      key: "invoiceNumber",
      label: "Invoice #",
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-gray-700">
          {val}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: "Amount",
      align: "center",
      render: (val) => (
        <span className="font-semibold">{formatCurrency(val, currency)}</span>
      ),
    },
    {
      key: "statusId",
      label: "Status",
      sortable: false,
      render: (val) => (
        <StatusBadge
          status={invoiceStatusesMap[val] ?? "—"}
          colors={invoiceStatusColorsMap[val]}
        />
      ),
    },
    {
      key: "submittedBy",
      label: "Submitted By",
      render: (val) => val || "—",
    },
    {
      key: "submissionDate",
      label: "Submitted Date",
      render: (val) => formatDateTime(val),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row) => (
        
        <div onClick={(e) => e.stopPropagation()}>
          {can("Invoices", "Update") && (
            <Link
              href={`/invoices/${row.id}/edit${projectCode ? `?projectCode=${encodeURIComponent(projectCode)}` : ""}`}
            >
              <Button variant="ghost" icon={Edit2} size="sm">
                
              </Button>
            </Link>
          )}
          
            <Link
              href={`/invoices/${row.id}?projectCode=${encodeURIComponent(projectCode)}`}
            >
              <Button variant="ghost" size="sm" icon={Eye}>
                
              </Button>
            </Link>
          </div>
      ),
    },
  ];

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
    </div>
  );

  return (
    <div>
      <ConfirmModal
        open={archiveModal}
        onClose={() => setArchiveModal(false)}
        onConfirm={handleArchive}
        title="Archive Project"
        message={`Are you sure you want to archive "${project.contractName}"? This action will move the project to archived status.`}
        confirmLabel="Archive Project"
        loading={archiving}
      />

      <BOQItemHistoryModal
        open={historyItemId != null}
        onClose={() => setHistoryItemId(null)}
        boqItemId={historyItemId}
      />

      <PageHeader
        title={project.contractName}
        subtitle={`Project Code: ${projectCode}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project.contractName },
        ]}
        actions={
          <>
            <Link href="/projects">
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
          </>
        }
      />

      {/* Stat Cards — aggregated across all sub-projects */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Project Value"
          value={formatCurrency(totals.projectValue, currency)}
          icon={Banknote}
          color="primary"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totals.totalRevenue, currency)}
          icon={TrendingUp}
          color="success"
          subtitle="WIP"
          changeType="negative"
          change={formatCurrency(totals.wip, currency)}
        />
        <StatCard
          title="Total Invoicing"
          value={formatCurrency(totals.totalInvoicesValue, currency)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title="Collected Value"
          value={formatCurrency(totals.collectedValue, currency)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title="Non-Collected Value"
          value={formatCurrency(totals.nonCollectedValue, currency)}
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
                Contract Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Contract Name" value={project.contractName} />
                <InfoRow label="Project Code"  value={projectCode} />
              </div>
            </Card>

            {/* Every sub-project shares the same contract dates — any one is a
                valid source, same convention as the BOQ invoicing tracker. */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
                Contract Timeline
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Contract Start Date"     value={formatDate(subProjects[0]?.contractStartDate)} />
                <InfoRow label="Contract Finish Date"    value={formatDate(subProjects[0]?.contractFinishDate)} />
                <InfoRow label="Contract Signature Date" value={formatDate(subProjects[0]?.contractSignatureDate)} />
                <InfoRow label="Site Receipt Date"       value={formatDate(subProjects[0]?.siteReceiptDate)} />
                <InfoRow label="Contract Duration"       value={subProjects[0]?.contractDuration} />
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Project Value"                    value={formatCurrency(totals.projectValue, currency)} />
              <InfoRow label="VAT Value"                       value={formatCurrency(totals.vatValue, currency)} />
              <InfoRow label="Total Revenue"                   value={formatCurrency(totals.totalRevenue, currency)} />
              <InfoRow label="Revenue (P.S)"                   value={formatCurrency(totals.revenuePS, currency)} />
              <InfoRow label="Revenue SW Licenses"             value={formatCurrency(totals.revenueSWLicenses, currency)} />
              <InfoRow label="Revenue Logistics"               value={formatCurrency(totals.revenueLogistics, currency)} />
              <InfoRow label="Revenue Training"                value={formatCurrency(totals.revenueTraining, currency)} />
              <InfoRow label="Revenue External Sub-Contractors" value={formatCurrency(totals.revenueExternalSubs, currency)} />
              <InfoRow label="Total Invoices"                  value={formatCurrency(totals.totalInvoicesValue, currency)} />
              <InfoRow label="Collected"                       value={formatCurrency(totals.collectedValue, currency)} />
              <InfoRow label="Non-Collected"                   value={formatCurrency(totals.nonCollectedValue, currency)} />
              <InfoRow label="Work in Progress (WIP)"          value={formatCurrency(totals.wip, currency)} />
            </div>
          </Card>
        </div>
      )}

      {/* Sub-Projects Tab */}
      {activeTab === 'EPM Sub-Projects' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {subProjects.length} sub-project{subProjects.length !== 1 ? 's' : ''}
          </p>
          <Table columns={subProjectColumns} data={subProjects} isLoading={subProjectsLoading} rowKey="projectCode" emptyMessage="No sub-projects found" />
        </div>
      )}

      {/* BOQ Tab */}
      {activeTab === 'BOQ' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{boqItems.length} BOQ item{boqItems.length !== 1 ? 's' : ''}</p>
            {currentBOQ?.id ? (
              <Link href={`/projects/${encodeURIComponent(projectCode)}/boq`}>
                <Button variant="outline" size="sm">Manage BOQ</Button>
              </Link>
            ) : can('Boqs', 'Create') ? (
              <Link href={`/projects/${encodeURIComponent(projectCode)}/boq/new`}>
                <Button size="sm">Add First Item</Button>
              </Link>
            ) : null}
          </div>
          <Table columns={boqColumns} data={boqItems} emptyMessage="No BOQ items for this project" />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'Invoices' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
            {can('Invoices', 'Create') && (
              <Link href={`/projects/${encodeURIComponent(projectCode)}/invoices/new`}>
                <Button size="sm">New Invoice Request</Button>
              </Link>
            )}
          </div>
          <Table
            columns={invoiceColumns}
            data={invoices}
            isLoading={invoicesLoading}
            onRowClick={(row) => router.push(`/invoices/${row.id}?projectCode=${encodeURIComponent(projectCode)}`)}
            emptyMessage="No invoice requests for this project"
          />
        </div>
      )}
    </div>
  );
}
