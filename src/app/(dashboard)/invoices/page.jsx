'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { mockInvoices } from '@/mock/invoices';
import { mockProjects } from '@/mock/projects';
import { mockBOQItems } from '@/mock/boq';
import { INVOICE_STATUS } from '@/constants/statuses';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getUserName } from '@/mock/users';
import { usePermission } from '@/hooks/usePermission';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: INVOICE_STATUS.SUBMITTED },
  { label: 'Under Review', value: INVOICE_STATUS.UNDER_REVIEW },
  { label: 'Approved', value: INVOICE_STATUS.APPROVED },
  { label: 'Rejected', value: INVOICE_STATUS.REJECTED },
];

export default function InvoicesPage() {
  const router = useRouter();
  const { can } = usePermission();
  const currency = useSelector((s) => s.ui.currency);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  const canApprove = can('Invoices', 'Approve');
  const canReject = can('Invoices', 'Reject');

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoices(mockInvoices);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!activeTab) return invoices;
    return invoices.filter((i) => i.status === activeTab);
  }, [invoices, activeTab]);

  const getProjectName = (projectId) => {
    const p = mockProjects.find((pr) => pr.id === projectId);
    return p ? p.contractName : projectId;
  };

  const getBOQItems = (boqItemIds) => {
    const ids = Array.isArray(boqItemIds) ? boqItemIds : [];
    return ids.map((id) => mockBOQItems.find((b) => b.id === id)).filter(Boolean);
  };

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach((tab) => {
      counts[tab.value] = tab.value
        ? invoices.filter((i) => i.status === tab.value).length
        : invoices.length;
    });
    return counts;
  }, [invoices]);

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {val}
        </span>
      ),
    },
    {
      key: 'projectId',
      label: 'Project',
      render: (val) => (
        <div className="max-w-45">
          <p className="text-sm text-gray-700 truncate">{getProjectName(val)}</p>
        </div>
      ),
    },
    {
      key: 'boqItemIds',
      label: 'BOQ Items',
      render: (val) => {
        const items = getBOQItems(val);
        if (items.length === 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="max-w-40">
            <p className="text-sm text-gray-600 truncate">{items[0].englishItem}</p>
            {items.length > 1 && (
              <p className="text-xs text-gray-400">+{items.length - 1} more</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'invoiceAmount',
      label: 'Amount',
      align: 'right',
      render: (val) => <span className="font-semibold text-gray-800">{formatCurrency(val, currency)}</span>,
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
      render: (val) => <span className="text-sm text-gray-600">{getUserName(val)}</span>,
    },
    {
      key: 'submittedAt',
      label: 'Submitted Date',
      render: (val) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/invoices/${row.id}`}>
            <Button variant="ghost" size="xs" icon={Eye}>View</Button>
          </Link>
          {row.status === INVOICE_STATUS.SUBMITTED && (
            <>
              {canApprove && (
                <Button
                  variant="success"
                  size="xs"
                  icon={CheckCircle}
                  onClick={() => {
                    setInvoices((prev) =>
                      prev.map((i) => i.id === row.id ? { ...i, status: INVOICE_STATUS.APPROVED } : i)
                    );
                  }}
                >
                  Approve
                </Button>
              )}
              {canReject && (
                <Button
                  variant="danger"
                  size="xs"
                  icon={XCircle}
                  onClick={() => {
                    setInvoices((prev) =>
                      prev.map((i) => i.id === row.id ? { ...i, status: INVOICE_STATUS.REJECTED } : i)
                    );
                  }}
                >
                  Reject
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoice Requests"
        subtitle={`${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === tab.value
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tabCounts[tab.value] > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                activeTab === tab.value ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tabCounts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/invoices/${row.id}`)}
        sortable
        emptyMessage="No invoice requests found"
      />
    </div>
  );
}
