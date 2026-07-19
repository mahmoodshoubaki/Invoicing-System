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
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card, { StatCard } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { ConfirmModal } from '@/components/common/Modal';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/formatters';
import {
  fetchProjectById,
  selectSelectedProject,
  selectProjectsLoading,
} from '@/store/slices/projectsSlice';
import { fetchBOQByProjectCode, selectBOQItems, selectCurrentBOQ } from '@/store/slices/boqSlice';
import { selectBillingFrequenciesMap, selectBoqItemStatusesMap } from '@/store/slices/lookupsSlice';

const TABS = ['Overview', 'BOQ', 'Invoices'];

export default function ProjectDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const dispatch = useDispatch();

  const project   = useSelector(selectSelectedProject);
  const isLoading = useSelector(selectProjectsLoading);
  const currency  = useSelector((s) => s.ui.currency);

  const boqItems              = useSelector(selectBOQItems);
  const currentBOQ            = useSelector(selectCurrentBOQ);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqItemStatusesMap    = useSelector(selectBoqItemStatusesMap);
  const invoices = [];
  const [activeTab, setActiveTab]       = useState('Overview');
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving]       = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (project?.projectCode && project.id === id) {
      dispatch(fetchBOQByProjectCode(project.projectCode));
    }
  }, [dispatch, id, project?.projectCode]);

  const handleArchive = () => {
    setArchiving(true);
    setTimeout(() => {
      setArchiving(false);
      setArchiveModal(false);
      router.push('/projects');
    }, 600);
  };

  if (isLoading) {
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

  const boqColumns = [
    {
      key: 'englishName',
      label: 'Item',
      render: (val, row) => (
        <div className='w-16'>
          <p className="font-medium text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.arabicName}</p>
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'right' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'right',
      render: (val) => formatCurrency(val, currency),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'right',
      render: (val) => <span className="font-semibold">{formatCurrency(val, currency)}</span>,
    },
    {
      key: 'statusId',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={boqItemStatusesMap[val] ?? '—'} />,
    },
    {
      key: 'baselineInvoicingDate',
      label: 'Baseline Invoicing Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Invoicing Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'billingFrequencyId',
      label: 'Billing Frequency',
      render: (val) => billingFrequenciesMap[val] ?? '—',
    },
    {
      key: 'actions',
      label: 'Actions',
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
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => <span className="font-mono text-xs font-semibold text-gray-700">{val}</span>,
    },
    {
      key: 'invoiceAmount',
      label: 'Amount',
      align: 'right',
      render: (val) => <span className="font-semibold">{formatCurrency(val, currency)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'submittedBy',
      label: 'Submitted By',
      render: (val) => val || '—',
    },
    {
      key: 'submittedAt',
      label: 'Submitted Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Link href={`/invoices/${row.id}`}>
            <Button variant="ghost" size="xs">View</Button>
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
        message={`Are you sure you want to archive "${project.projectName}"? This action will move the project to archived status.`}
        confirmLabel="Archive Project"
        loading={archiving}
      />

      <BOQItemHistoryModal
        open={historyItemId != null}
        onClose={() => setHistoryItemId(null)}
        boqItemId={historyItemId}
      />

      <PageHeader
        title={project.projectName}
        subtitle={`${project.projectCode} · ${project.clientName}`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Projects', href: '/projects' },
          { label: project.projectName },
        ]}
        actions={
          <>
            <Link href="/projects">
              <Button variant="ghost" icon={ChevronLeft} size="sm">Back</Button>
            </Link>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Project Value"
          value={formatCurrency(project.projectValue, currency)}
          icon={Banknote}
          color="primary"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(project.totalRevenue, currency)}
          icon={TrendingUp}
          color="success"
          subtitle="WIP"
          changeType="negative"
          change={formatCurrency(project.wip, currency)}
        />
        <StatCard
          title="Total Invoicing"
          value={formatCurrency(project.totalInvoicesValue, currency)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title="Collected Value"
          value={formatCurrency(project.collectedValue, currency)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title="Non-Collected Value"
          value={formatCurrency(project.nonCollectedValue, currency)}
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
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Contract Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Contract Name"       value={project.contractName} />
              <InfoRow label="Contract Number"     value={project.contractNumber} />
              <InfoRow label="Project Name - EPM"  value={project.projectName} />
              <InfoRow label="Project Code"        value={project.projectCode} />
              <InfoRow label="Project Name - Focus" value={project.projectName_Focus} />
              <InfoRow label="Client Name"         value={project.clientName} />
              <InfoRow label="Invoicing Platform"  value={project.invoicingPlatform} />
              <InfoRow label="PO Number"           value={project.poNumber} />
              <div className="col-span-2">
                <InfoRow label="Status" value={<StatusBadge status={project.status} />} />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Financial Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Project Value"                    value={formatCurrency(project.projectValue, currency)} />
              <InfoRow label="VAT %"                           value={`${project.vatPercentage}%`} />
              <InfoRow label="VAT Value"                       value={formatCurrency(project.vatValue, currency)} />
              <InfoRow label="Total Revenue"                   value={formatCurrency(project.totalRevenue, currency)} />
              <InfoRow label="Revenue (P.S)"                   value={formatCurrency(project.revenuePS, currency)} />
              <InfoRow label="Revenue SW Licenses"             value={formatCurrency(project.revenueSWLicenses, currency)} />
              <InfoRow label="Revenue Logistics"               value={formatCurrency(project.revenueLogistics, currency)} />
              <InfoRow label="Revenue Training"                value={formatCurrency(project.revenueTraining, currency)} />
              <InfoRow label="Revenue External Sub-Contractors" value={formatCurrency(project.revenueExternalSubs, currency)} />
              <InfoRow label="Total Invoices"                  value={formatCurrency(project.totalInvoicesValue, currency)} />
              <InfoRow label="Collected"                       value={formatCurrency(project.collectedValue, currency)} />
              <InfoRow label="Non-Collected"                   value={formatCurrency(project.nonCollectedValue, currency)} />
              <InfoRow label="Work in Progress (WIP)"          value={formatCurrency(project.wip, currency)} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Project Team
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Business Unit" value={project.businessUnit} />
              <InfoRow label="DRM"           value={project.drm} />
              <InfoRow label="BDM"           value={project.bdm} />
              <InfoRow label="CRP"           value={project.crp} />
              <InfoRow label="BU Head"       value={project.buHead} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Actual Start Date"       value={formatDate(project.startDate)} />
              <InfoRow label="End Date"                value={formatDate(project.endDate)} />
              <InfoRow label="Duration"                value={project.duration ? `${project.duration} months` : null} />
              <InfoRow label="PO Date"                 value={formatDate(project.poDate)} />
              <InfoRow label="Contract Signature Date" value={formatDate(project.contractSignatureDate)} />
              <InfoRow label="Site Receipt Date"      value={formatDate(project.siteReceiptDate)} />
            </div>
          </Card>
        </div>
      )}

      {/* BOQ Tab */}
      {activeTab === 'BOQ' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{boqItems.length} BOQ item{boqItems.length !== 1 ? 's' : ''}</p>
            {currentBOQ?.id ? (
              <Link href={`/projects/${id}/boq`}>
                <Button variant="outline" size="sm">Manage BOQ</Button>
              </Link>
            ) : (
              <Link href={`/projects/${id}/boq/new`}>
                <Button size="sm">Add First Item</Button>
              </Link>
            )}
          </div>
          <Table columns={boqColumns} data={boqItems} emptyMessage="No BOQ items for this project" />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'Invoices' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
            <Link href={`/invoices/new?projectId=${id}`}>
              <Button size="sm">New Invoice Request</Button>
            </Link>
          </div>
          <Table
            columns={invoiceColumns}
            data={invoices}
            onRowClick={(row) => router.push(`/invoices/${row.id}`)}
            emptyMessage="No invoice requests for this project"
          />
        </div>
      )}
    </div>
  );
}
