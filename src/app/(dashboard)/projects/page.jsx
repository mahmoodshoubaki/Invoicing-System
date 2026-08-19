'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Search, X } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { fetchProjects, selectProjects, selectProjectsLoading } from '@/store/slices/projectsSlice';
import { PROJECT_STATUS_LIST } from '@/constants/statuses';

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const router   = useRouter();
  const dispatch = useDispatch();

  const projects  = useSelector(selectProjects);
  const isLoading = useSelector(selectProjectsLoading);

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.projectName?.toLowerCase().includes(q) ||
        p.contractNumber?.toString().toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.projectNameFocus?.toLowerCase().includes(q) ||
        p.projectCode?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter;

  const columns = [
    {
      key: 'contractName',
      label: 'Contract Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm leading-tight">{val ?? '—'}</p>
          {row.contractNumber != null && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">{row.contractNumber}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {row.projectCode}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {row.projectName ? `EPM: ${row.projectName}` : ''}
            </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {row.projectNameFocus ? `Focus: ${row.projectNameFocus}` : ''}
          </p>
        </div>
      ),
    },
    { key: 'clientName', label: 'Client' },
    { key: 'poNumber', label: 'PO Number' },
    { key: 'invoicingPlatform', label: 'Invoicing Platform' },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} project${filtered.length !== 1 ? 's' : ''} found`}
      />

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, contract#, client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50 min-w-[150px]"
        >
          <option value="">All Statuses</option>
          {PROJECT_STATUS_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        rowKey="projectCode"
        onRowClick={(row) => router.push(`/projects/${encodeURIComponent(row.projectCode)}`)}
        sortable
        pagination={
          filtered.length > PAGE_SIZE
            ? {
                page,
                totalPages,
                total: filtered.length,
                from: (page - 1) * PAGE_SIZE + 1,
                to: Math.min(page * PAGE_SIZE, filtered.length),
                onChange: (p) => setPage(p),
              }
            : undefined
        }
      />
    </div>
  );
}
