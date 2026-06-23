'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { mockBOQItems } from '@/mock/boq';
import { mockProjects } from '@/mock/projects';
import { BOQ_STATUS } from '@/constants/statuses';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getSlaStatus } from '@/constants/sla';

function getRowBg(item) {
  if (item.status === BOQ_STATUS.DELAYED) return 'bg-red-50/60';
  if (item.status === BOQ_STATUS.APPROVED) return 'bg-green-50/40';
  return '';
}

function SlaIndicator({ date, status }) {
  if (status === BOQ_STATUS.INVOICED) return null;
  const sla = getSlaStatus(date);
  if (sla === 'normal') return null;
  const colorMap = {
    overdue: 'text-red-600',
    critical: 'text-red-500',
    warning: 'text-yellow-500',
  };
  return (
    <Clock
      size={14}
      className={`inline-block ml-1.5 shrink-0 ${colorMap[sla] || ''}`}
      title={`SLA: ${sla}`}
    />
  );
}

export default function BOQPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(mockBOQItems);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!projectFilter) return items;
    return items.filter((i) => i.projectId === projectFilter);
  }, [items, projectFilter]);

  const getProjectName = (projectId) => {
    const p = mockProjects.find((pr) => pr.id === projectId);
    return p ? p.contractName : projectId;
  };

  const columns = [
    {
      key: 'projectId',
      label: 'Project',
      render: (val, row) => (
        <div className="max-w-[200px]">
          <p className="font-medium text-gray-800 text-sm truncate">{getProjectName(val)}</p>
        </div>
      ),
    },
    {
      key: 'arabicItem',
      label: 'Arabic Item',
      render: (val) => (
        <span className="text-sm text-gray-700 font-arabic" dir="rtl">{val}</span>
      ),
    },
    {
      key: 'englishItem',
      label: 'English Item',
      render: (val, row) => (
        <div className="flex items-center gap-1 max-w-[200px]">
          <span className="text-sm text-gray-700 truncate">{val}</span>
          <SlaIndicator date={row.expectedInvoicingDate} status={row.status} />
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
      render: (val) => <span className="font-semibold text-gray-800">{formatCurrency(val)}</span>,
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
      render: (val, row) => {
        const sla = getSlaStatus(val);
        return (
          <span className={`text-sm ${
            sla === 'overdue' ? 'text-red-600 font-semibold' :
            sla === 'warning' ? 'text-yellow-600' : 'text-gray-700'
          }`}>
            {formatDate(val)}
          </span>
        );
      },
    },
    { key: 'billingFrequency', label: 'Billing' },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Link href={`/boq/${row.projectId}`}>
            <Button variant="ghost" size="xs">View Project BOQ</Button>
          </Link>
        </div>
      ),
    },
  ];

  // Custom row render to apply row-level background colors
  const dataWithBg = filtered;

  return (
    <div>
      <PageHeader
        title="BOQ / Invoicing Plan"
        subtitle={`${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/boq/new">
            <Button icon={Plus}>Add BOQ Item</Button>
          </Link>
        }
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          Delayed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          Approved
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-yellow-500" />
          Due within 7 days
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-red-600" />
          Overdue
        </span>
      </div>

      {/* Project Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by Project:</label>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="flex-1 max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50"
        >
          <option value="">All Projects</option>
          {mockProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.contractName}</option>
          ))}
        </select>
        {projectFilter && (
          <Button variant="ghost" size="sm" onClick={() => setProjectFilter('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Custom table with row coloring */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : dataWithBg.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                    No BOQ items found
                  </td>
                </tr>
              )
              : dataWithBg.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:opacity-90 cursor-pointer ${getRowBg(row)}`}
                    onClick={() => router.push(`/boq/${row.projectId}`)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-gray-700 ${
                          col.align === 'right' ? 'text-right' : ''
                        } ${col.className || ''}`}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
