'use client';

import { memo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, FileText, LayoutList } from 'lucide-react';

/**
 * Hero panel for the project detail page. Memoised, and deliberately given
 * only the two props it needs — switching tabs or opening a modal below must
 * not repaint it.
 */
function ProjectDetailHeader({ project, projectCode }) {
  const encoded = encodeURIComponent(projectCode);

  return (
    <motion.header
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative isolate mb-6 overflow-hidden rounded-3xl bg-[#17161c] px-6 py-7 sm:px-8"
    >
      {/* Ambient colour fields */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#f8485e] opacity-40 blur-[90px]"
          animate={{ x: [0, 32, 0], y: [0, 18, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-24 right-4 h-64 w-64 rounded-full bg-[#4a3aa7] opacity-35 blur-[95px]"
          animate={{ x: [0, -30, 0], y: [0, -16, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />
      </div>

      <div className="relative">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-xs text-white/40">
          <Link href="/" className="transition-colors hover:text-white/70">Home</Link>
          <ChevronRight size={11} />
          <Link href="/projects" className="transition-colors hover:text-white/70">Projects</Link>
          <ChevronRight size={11} />
          <span className="truncate font-medium text-white/70">{project.contractName ?? projectCode}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <span className="inline-block rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] font-semibold text-white/70 ring-1 ring-white/10">
              {projectCode}
            </span>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-[1.9rem] sm:leading-tight">
              {project.contractName ?? 'Untitled contract'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/projects/${encoded}/boq`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <LayoutList size={15} />
              Manage BOQ
            </Link>
            <Link
              href={`/projects/${encoded}/invoices/new`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-[#17161c] transition-colors hover:bg-white/90"
            >
              <FileText size={15} />
              New invoice
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-medium text-white/55 transition-colors hover:text-white"
            >
              <ChevronLeft size={15} />
              Back
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

export default memo(ProjectDetailHeader);
