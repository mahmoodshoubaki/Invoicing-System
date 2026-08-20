'use client';

import { memo, useMemo } from 'react';
import Table from '@/components/common/Table';
import { StatusBadge } from '@/components/common/Badge';
import { formatCurrency } from '@/utils/formatters';

function SubProjectsTab({ subProjects, subProjectsLoading, currency }) {
  const columns = useMemo(() => [
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
  ], [currency]);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {subProjects.length} sub-project{subProjects.length !== 1 ? 's' : ''}
      </p>
      <Table
        columns={columns}
        data={subProjects}
        isLoading={subProjectsLoading}
        rowKey="projectCode"
        emptyMessage="No sub-projects found"
      />
    </div>
  );
}

export default memo(SubProjectsTab);
