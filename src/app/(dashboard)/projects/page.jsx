'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MotionConfig, motion } from 'motion/react';
import { ChevronRight, FolderKanban } from 'lucide-react';

import Table from '@/components/common/Table';
import TablePagination from '@/components/common/TablePagination';
import ErrorNote from '@/components/ui/ErrorNote';
import ProjectCard from '@/components/projects/ProjectCard';
import Reveal from '@/components/motion/Reveal';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import ProjectFilters from '@/components/projects/list/ProjectFilters';
import NoProjectsMatch from '@/components/projects/list/NoProjectsMatch';
import ViewToggle from '@/components/projects/list/ViewToggle';
import { PROJECT_COLUMNS } from '@/components/projects/list/projectColumns';
import { useProjectsList } from '@/components/projects/list/useProjectsList';
import { pageInfo } from '@/lib/pageInfo';
import { CHROME } from '@/theme/vizPalette';

export default function ProjectsPage() {
  const router = useRouter();
  const [view, setView] = useState('grid');
  const list = useProjectsList();
  const pagination = pageInfo(list.page, list.pageSize, list.total, list.setPage, list.setPageSize);

  let results;
  if (list.error) {
    results = <ErrorNote error={list.error} onRetry={list.reload} />;
  } else if (list.loading && view === 'grid') {
    results = (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl border border-[#e9e7e5] bg-white" />
          ))}
        </div>
        {pagination && <TablePagination {...pagination} busy />}
      </>
    );
  } else if (!list.loading && list.rows.length === 0) {
    results = <NoProjectsMatch filtered={list.filtered} onClear={list.clear} />;
  } else if (view === 'grid') {
    results = (
      <>
        <Reveal key={`${list.search}-${list.status}-${list.page}-${list.pageSize}`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.rows.map((project) => (
            <ProjectCard key={project.projectCode} project={project} />
          ))}
        </Reveal>
        {pagination && <TablePagination {...pagination} busy={list.loading} />}
      </>
    );
  } else {
    results = (
      <Table
        columns={PROJECT_COLUMNS}
        data={list.rows}
        isLoading={list.loading}
        rowKey="projectCode"
        onRowClick={(row) => router.push(`/projects/${encodeURIComponent(row.projectCode)}`)}
        sortable={false}
        pagination={pagination}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-5">
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
              <AnimatedCounter value={list.total} className="font-semibold" />
              {list.filtered && list.allTotal != null
                ? ` of ${list.allTotal} ${list.allTotal === 1 ? 'project' : 'projects'} match`
                : ` ${list.total === 1 ? 'project' : 'projects'}`}
            </p>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </motion.header>

        <ProjectFilters
          search={list.search}
          onSearch={list.setSearch}
          status={list.status}
          onStatus={list.setStatus}
          statuses={list.statuses}
          filtered={list.filtered}
          onClear={list.clear}
        />

        {results}
      </div>
    </MotionConfig>
  );
}
