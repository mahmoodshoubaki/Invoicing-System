'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { MotionConfig, motion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, FolderKanban, LayoutGrid, Rows3, Search, SearchX, X,
} from 'lucide-react';

import Table from '@/components/common/Table';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import ProjectCard from '@/components/projects/ProjectCard';
import Reveal from '@/components/motion/Reveal';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import { fetchProjects, selectProjects, selectProjectsLoading } from '@/store/slices/projectsSlice';
import { PROJECT_STATUS_LIST } from '@/constants/statuses';
import { CHROME } from '@/theme/vizPalette';

const PAGE_SIZE = 12;

export default function ProjectsPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const projects = useSelector(selectProjects);
  const isLoading = useSelector(selectProjectsLoading);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.projectName?.toLowerCase().includes(q) ||
        p.contractName?.toLowerCase().includes(q) ||
        p.contractNumber?.toString().toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.projectNameFocus?.toLowerCase().includes(q) ||
        p.projectCode?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  /** Counts per status for the filter pills — computed off the unfiltered set
   *  so the numbers don't shift as you narrow the list. */
  const statusCounts = useMemo(() => {
    const counts = {};
    for (const p of projects) {
      if (p.status) counts[p.status] = (counts[p.status] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const hasFilters = Boolean(search || statusFilter);

  const columns = useMemo(() => [
    {
      key: 'contractName',
      label: 'Contract Name',
      render: (val, row) => (
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: CHROME.textPrimary }}>
            {val ?? '—'}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: CHROME.textMuted }}>
            <span className="font-mono">{row.projectCode}</span>
            {row.contractNumber != null && <span className="font-mono">· #{row.contractNumber}</span>}
          </div>
          {(row.projectName || row.projectNameFocus) && (
            <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>
              {row.projectName ? `EPM: ${row.projectName}` : ''}
              {row.projectName && row.projectNameFocus ? ' · ' : ''}
              {row.projectNameFocus ? `Focus: ${row.projectNameFocus}` : ''}
            </p>
          )}
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
  ], []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-5">
        {/* ============================ Header ============================ */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <nav className="mb-1.5 flex items-center gap-1 text-xs" style={{ color: CHROME.textMuted }}>
              <span>Home</span>
              <ChevronRight size={12} />
              <span className="font-medium" style={{ color: CHROME.textSecondary }}>Projects</span>
            </nav>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight" style={{ color: CHROME.textPrimary }}>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f8485e]/10 text-[#f8485e]">
                <FolderKanban size={18} />
              </span>
              Projects
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: CHROME.textSecondary }}>
              <AnimatedCounter value={filtered.length} className="font-semibold" />
              {' '}of {projects.length} {projects.length === 1 ? 'project' : 'projects'} shown
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-xl bg-[#f4f3f1] p-1">
            {[
              { id: 'grid', label: 'Cards', icon: LayoutGrid },
              { id: 'table', label: 'Table', icon: Rows3 },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setView(opt.id)}
                aria-pressed={view === opt.id}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === opt.id ? 'text-[#3c3c3a]' : 'text-[#898781] hover:text-[#52514e]'
                }`}
              >
                {view === opt.id && (
                  <motion.span
                    layoutId="projects-view-toggle"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <opt.icon size={13} className="relative z-10" />
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
        </motion.header>

        {/* ============================ Filters ============================ */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-[#e9e7e5] bg-white p-4 shadow-[var(--shadow-card)]"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="group relative min-w-[240px] flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a1a0] transition-colors group-focus-within:text-[#f8485e]"
              />
              <input
                type="text"
                placeholder="Search contract, code, client…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-xl border border-[#e4e2e2] bg-white py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[#f8485e]"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" icon={X} onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>

          {/* Status pills — carry their own counts, so filtering is a choice
              made with the distribution already visible. */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[{ label: 'All statuses', value: '' }, ...PROJECT_STATUS_LIST.map((s) => ({ label: s, value: s }))].map((opt) => {
              const active = statusFilter === opt.value;
              const count = opt.value ? (statusCounts[opt.value] ?? 0) : projects.length;
              return (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[#f8485e] bg-[#f8485e]/10 text-[#d9304a]'
                      : 'border-[#e9e7e5] bg-white text-[#52514e] hover:border-[#fca2ae] hover:bg-[#f8485e]/5'
                  }`}
                >
                  {opt.label}
                  <span className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                    active ? 'bg-[#f8485e] text-white' : 'bg-[#f1f0ee] text-[#898781]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ============================ Results ============================ */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-[#e9e7e5] bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#dedcda] bg-white py-16 text-center"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f3f1]">
              <SearchX size={22} className="text-[#a1a1a0]" />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>No projects match your filters</p>
              <p className="mt-1 text-xs" style={{ color: CHROME.textMuted }}>
                Try a different search term or clear the status filter.
              </p>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" icon={X} onClick={handleClearFilters}>
                Clear filters
              </Button>
            )}
          </motion.div>
        ) : view === 'grid' ? (
          <>
            <Reveal key={`${search}-${statusFilter}-${safePage}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginatedData.map((project) => (
                <ProjectCard key={project.projectCode} project={project} />
              ))}
            </Reveal>

            {totalPages > 1 && (
              <nav className="flex items-center justify-between gap-3 pb-2" aria-label="Pagination">
                <p className="text-xs" style={{ color: CHROME.textMuted }}>
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm" icon={ChevronLeft}
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  />
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - safePage) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-current={p === safePage ? 'page' : undefined}
                        className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                          p === safePage ? 'bg-[#f8485e] text-white' : 'text-[#52514e] hover:bg-[#f4f3f1]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <Button
                    variant="outline" size="sm" icon={ChevronRight}
                    disabled={safePage >= totalPages}
                    onClick={() => setPage(safePage + 1)}
                  />
                </div>
              </nav>
            )}
          </>
        ) : (
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
                    page: safePage,
                    totalPages,
                    total: filtered.length,
                    from: (safePage - 1) * PAGE_SIZE + 1,
                    to: Math.min(safePage * PAGE_SIZE, filtered.length),
                    onChange: (p) => setPage(p),
                  }
                : undefined
            }
          />
        )}
      </div>
    </MotionConfig>
  );
}
