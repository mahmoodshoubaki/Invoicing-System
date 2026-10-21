'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, GitBranch, Plus, Search, SearchX } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Reveal from '@/components/motion/Reveal';
import WorkflowCard from '@/components/workflow/WorkflowCard';
import VersionHistoryModal from '@/components/workflow/VersionHistoryModal';
import StartRunModal from '@/components/workflow/startRun/StartRunModal';
import { usePermission } from '@/hooks/usePermission';
import { allow, WORKFLOW_PERMISSIONS } from '@/constants/workflowPermissions';
import { TARGET_TYPE_LABELS } from '@/constants/workflow';
import { ROUTES } from '@/constants/routes';
import { CHROME } from '@/theme/vizPalette';
import {
  fetchDefinitions,
  selectDefinitions,
  selectDefinitionsLoading,
  selectDefinitionsError,
} from '@/store/slices/workflowSlice';

const TARGET_FILTERS = [
  { key: '', label: 'All targets' },
  ...Object.entries(TARGET_TYPE_LABELS).map(([key, label]) => ({ key, label })),
];

export default function WorkflowsPage() {
  const dispatch = useDispatch();
  const { can } = usePermission();

  const workflows = useSelector(selectDefinitions);
  const isLoading = useSelector(selectDefinitionsLoading);
  const error = useSelector(selectDefinitionsError);

  const [search, setSearch] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [versionsFor, setVersionsFor] = useState(null);
  const [startFor, setStartFor] = useState(null);

  const canManage = allow(can, WORKFLOW_PERMISSIONS.MANAGE);
  const canRun = allow(can, WORKFLOW_PERMISSIONS.RUN);

  useEffect(() => {
    // Unfiltered on purpose: the list is small, and filtering client-side keeps
    // the target-type counts stable instead of having them shift as you narrow.
    dispatch(fetchDefinitions());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workflows.filter((w) => {
      const matchesSearch =
        !q ||
        w.name?.toLowerCase().includes(q) ||
        w.code?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q);
      const matchesTarget = !targetFilter || String(w.targetTypeKey) === targetFilter;
      return matchesSearch && matchesTarget;
    });
  }, [workflows, search, targetFilter]);

  const handleOpenVersions = useCallback((workflow) => setVersionsFor(workflow), []);
  const handleStart = useCallback((workflow) => setStartFor(workflow), []);
  const handleCloseVersions = useCallback(() => setVersionsFor(null), []);

  return (
    <div>
      <VersionHistoryModal
        workflow={versionsFor}
        open={Boolean(versionsFor)}
        onClose={handleCloseVersions}
      />

      {/* Mounted per workflow rather than kept alive and reset: a fresh mount
          is what guarantees the previous run's answers are gone. */}
      {startFor && (
        <StartRunModal
          key={startFor.code}
          workflow={startFor}
          open
          onClose={() => setStartFor(null)}
        />
      )}

      <PageHeader
        title="Workflows"
        subtitle="Design, publish and monitor approval flows"
        actions={
          canManage && (
            <Link href={ROUTES.WORKFLOW_BUILDER}>
              <Button size="sm" icon={Plus}>New workflow</Button>
            </Link>
          )
        }
      />

      <Card padding={false} className="mb-5">
        <div className="flex flex-wrap items-center gap-3 p-3.5">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: CHROME.textMuted }}
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code or description…"
              aria-label="Search workflows"
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1">
            {TARGET_FILTERS.map((tab) => {
              const active = targetFilter === tab.key;
              return (
                <button
                  key={tab.key || 'all'}
                  type="button"
                  onClick={() => setTargetFilter(tab.key)}
                  aria-pressed={active}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? '#f1f0ee' : 'transparent',
                    color: active ? CHROME.textPrimary : CHROME.textMuted,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {isLoading && workflows.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : error && workflows.length === 0 ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Could not load workflows"
            message={typeof error === 'string' ? error : error?.message}
            action={
              <Button variant="outline" size="sm" onClick={() => dispatch(fetchDefinitions())}>
                Try again
              </Button>
            }
          />
        </Card>
      ) : workflows.length === 0 ? (
        <Card>
          <EmptyState
            icon={GitBranch}
            title="No workflows yet"
            message={
              canManage
                ? 'Build one to start routing approvals. Nothing runs until a version is published.'
                : 'Nobody has created a workflow yet.'
            }
            action={
              canManage && (
                <Link href={ROUTES.WORKFLOW_BUILDER}>
                  <Button size="sm" icon={Plus}>New workflow</Button>
                </Link>
              )
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="Nothing matches"
            message="No workflow matches your search and filter."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setTargetFilter('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <Reveal className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((workflow) => (
            <WorkflowCard
              key={workflow.code}
              workflow={workflow}
              canManage={canManage}
              canRun={canRun}
              onOpenVersions={handleOpenVersions}
              onStart={handleStart}
            />
          ))}
        </Reveal>
      )}
    </div>
  );
}
