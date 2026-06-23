'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  Archive,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  ChevronLeft,
  SaudiRiyalIcon,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import Card, { StatCard } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { ConfirmModal } from '@/components/common/Modal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { mockProjects } from '@/mock/projects';
import { mockBOQItems } from '@/mock/boq';
import { mockInvoices } from '@/mock/invoices';
import { getUserName } from '@/mock/users';
import { formatCurrency, formatDate } from '@/utils/formatters';

const TABS = ['Overview', 'BOQ', 'Invoices'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [boqItems, setBoqItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [archiveModal, setArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const proj = mockProjects.find((p) => p.id === id);
      setProject(proj || null);
      setBoqItems(mockBOQItems.filter((b) => b.projectId === id));
      setInvoices(mockInvoices.filter((i) => i.projectId === id));
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [id]);

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
      key: 'englishItem',
      label: 'Item',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.arabicItem}</p>
        </div>
      ),
    },
    { key: 'quantity', label: 'Qty', align: 'right' },
    {
      key: 'unitCost',
      label: 'Unit Cost',
      align: 'right',
      render: (val) => formatCurrency(val),
    },
    {
      key: 'totalCost',
      label: 'Total Cost',
      align: 'right',
      render: (val) => <span className="font-semibold">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'expectedInvoicingDate',
      label: 'Expected Invoicing Date',
      render: (val) => formatDate(val),
    },
    { key: 'billingFrequency', label: 'Billing Frequency' },
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
      render: (val) => <span className="font-semibold">{formatCurrency(val)}</span>,
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
      render: (val) => getUserName(val),
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
        message={`Are you sure you want to archive "${project.contractName}"? This action will move the project to archived status.`}
        confirmLabel="Archive Project"
        loading={archiving}
      />

      <PageHeader
        title={project.contractName}
        subtitle={`${project.contractNumber} · ${project.clientName}`}
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
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline" icon={Edit} size="sm">Edit</Button>
            </Link>
            <Button
              variant="danger"
              icon={Archive}
              size="sm"
              onClick={() => setArchiveModal(true)}
            >
              Archive
            </Button>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Project Value"
          value={formatCurrency(project.projectValue)}
          icon={SaudiRiyalIcon}
          color="primary"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(project.totalRevenue)}
          icon={TrendingUp}
          color="success"
          subtitle="WIP"
          changeType="negative"
          change={formatCurrency(project.wip)}
        />
        <StatCard
          title="Total Invoicing"
          value={formatCurrency(project.totalInvoicesValue)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title="Collected Value"
          value={formatCurrency(project.collectedValue)}
          icon={FileText}
          color="info"
        />
        <StatCard
          title="Non-Collected Value"
          value={formatCurrency(project.nonCollectedValue)}
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
          {/* Contract Info */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Contract Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Contract Name" value={project.contractName} />
              <InfoRow label="Contract Number" value={project.contractNumber} />
              <InfoRow label="Project Name - EPM" value={project.projectName} />
              <InfoRow label="Project Code" value={project.projectCode} />
              <InfoRow label="Project Name - Focus" value={project.projectName} />
              <InfoRow label="Client Name" value={project.clientName} />
              <InfoRow label="Invoicing Platform" value={project.invoicingPlatform} />
              <InfoRow label="PO Number" value={project.poNumber} />
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
              <InfoRow label="Project Value" value={formatCurrency(project.projectValue)} />
              <InfoRow label="VAT %" value={`${project.vatPercent}%`} />
              <InfoRow label="VAT (SAR)" value={formatCurrency(project.vatSAR)} />
              <InfoRow label="Total Revenue" value={formatCurrency(project.totalRevenue)} />
              <InfoRow label="Revenue (P.S)" value={formatCurrency(project.totalRevenue)} />
              <InfoRow label="Revenue SW Licenses" value={formatCurrency(project.revenueSWLic)} />
              <InfoRow label="Revenue Logistics" value={formatCurrency(project.revenueLogistics)} />
              <InfoRow label="Revenue Training" value={formatCurrency(project.revenueTraining)} />
              <InfoRow label="Revenue External Sub-Contractors" value={formatCurrency(project.revenueExternalSubs)} />
              <InfoRow label="Total Invoices" value={formatCurrency(project.totalInvoicesValue)} />
              <InfoRow label="Collected" value={formatCurrency(project.collectedValue)} />
              <InfoRow label="Non-Collected" value={formatCurrency(project.nonCollectedValue)} />
              <InfoRow label="Work in Progress (WIP)" value={formatCurrency(project.wipValue)} />
            </div>
          </Card>

          {/* Team */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Project Team
            </h3>
            <div className="grid grid-cols-2 gap-4">
              
              <InfoRow label="Business Unit" value={project.businessUnit} />
              <InfoRow label="Project Manager" value={getUserName(project.projectManager)} />
              <InfoRow label="BDM" value={getUserName(project.bdm)} />
              <InfoRow label="DRM" value={getUserName(project.drm)} />
              <InfoRow label="CRP" value={getUserName(project.crp)} />
              <InfoRow label="BU Head" value={getUserName(project.buHead)} />
            </div>
          </Card>

          {/* Timeline & Financial */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Actual Start Date" value={formatDate(project.startDate)} />
              <InfoRow label="End Date" value={formatDate(project.endDate)} />
              <InfoRow label="Duration" value={project.durationMonths ? `${project.durationMonths} months` : '—'} />
            </div>
          </Card>
        </div>
      )}

      {/* BOQ Tab */}
      {activeTab === 'BOQ' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{boqItems.length} BOQ item{boqItems.length !== 1 ? 's' : ''}</p>
            <Link href={`/boq/${id}`}>
              <Button variant="outline" size="sm">Manage BOQ</Button>
            </Link>
          </div>
          <Table
            columns={boqColumns}
            data={boqItems}
            emptyMessage="No BOQ items for this project"
          />
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
