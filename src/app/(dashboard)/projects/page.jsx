'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X, Building2 } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/components/common/PageHeader';
import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { mockProjects } from '@/mock/projects';
import { PROJECT_STATUS_LIST } from '@/constants/statuses';
import { formatCurrency } from '@/utils/formatters';
import { getUserName } from '@/mock/users';

const PAGE_SIZE = 10;

const BUSINESS_UNITS = [
  'Energy & Resources',
  'Telecom & Media',
  'Government & Public Sector',
  'Petrochemical & Industrial',
  'Real Estate & Infrastructure',
  'Logistics & Transport',
];

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [buFilter, setBuFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProjects(mockProjects);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.contractName?.toLowerCase().includes(q) ||
        p.contractNumber?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.projectCode?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchBU = !buFilter || p.businessUnit === buFilter;
      return matchSearch && matchStatus && matchBU;
    });
  }, [projects, search, statusFilter, buFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setBuFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || buFilter;

  const columns = [
    {
      key: 'contractName',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-800 text-sm leading-tight">{val}</p>
          <p className="text-xs text-gray-400 mt-0.5">{row.projectCode}</p>
        </div>
      ),
    },
    {
      key: 'contractNumber',
      label: 'Contract #',
      render: (val) => <span className="font-mono text-xs text-gray-600">{val}</span>,
    },
    { key: 'clientName', label: 'Client' },
    {
      key: 'projectManager',
      label: 'PM',
      render: (val) => <span className="text-sm">{getUserName(val)}</span>,
    },
    {
      key: 'businessUnit',
      label: 'Business Unit',
      render: (val) => (
        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{val}</span>
      ),
    },
    {
      key: 'projectValue',
      label: 'Project Value',
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-gray-800 text-sm">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Link href={`/projects/${row.id}`}>
            <Button variant="ghost" size="xs">View</Button>
          </Link>
          <Link href={`/projects/${row.id}/edit`}>
            <Button variant="outline" size="xs">Edit</Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${filtered.length} project${filtered.length !== 1 ? 's' : ''} found`}
        actions={
          <Link href="/projects/new">
            <Button icon={Plus}>New Project</Button>
          </Link>
        }
      />

      {/* Filter Bar */}
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

        <select
          value={buFilter}
          onChange={(e) => { setBuFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-gray-50 min-w-[180px]"
        >
          <option value="">All Business Units</option>
          {BUSINESS_UNITS.map((bu) => (
            <option key={bu} value={bu}>{bu}</option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={paginatedData}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/projects/${row.id}`)}
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
