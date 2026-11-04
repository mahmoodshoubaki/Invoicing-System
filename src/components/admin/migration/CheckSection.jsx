'use client';

import { CheckCircle2, Info, ListChecks } from 'lucide-react';

import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import { CHROME, STATUS } from '@/theme/vizPalette';
import MigrationCounts from './MigrationCounts';
import MigrationProblems from './MigrationProblems';

/**
 * @param {{ run: ReturnType<import('./useMigrationRun').useMigrationRun> }} props
 */
export default function CheckSection({ run }) {
  const { check } = run;
  const clean = check.status === 'done' && check.result.problems.length === 0;

  return (
    <section className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>2. Check</h2>
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
            Sends the workbook and the list of files (not their content). Nothing is saved.
          </p>
        </div>
        <Button icon={ListChecks} size="sm" onClick={run.runCheck} disabled={!run.canCheck} loading={check.status === 'running'}>
          {check.status === 'done' ? 'Check again' : 'Check'}
        </Button>
      </header>

      {check.status === 'idle' && (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>Not checked yet. Picking another folder needs a new check.</p>
      )}
      {check.status === 'error' && <ErrorNote error={check.error} onRetry={run.runCheck} />}
      {check.status === 'done' && (
        <div className="flex flex-col gap-4">
          <MigrationCounts counts={check.result.counts} />
          {clean ? (
            <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: STATUS.good }}>
              <CheckCircle2 size={14} aria-hidden="true" />
              No problems found. It can be imported.
            </p>
          ) : (
            <>
              <p className="flex items-start gap-1.5 rounded-lg bg-[#f6f5f3] px-3 py-2 text-xs" style={{ color: CHROME.textSecondary }}>
                <Info size={13} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
                Fix these and check again. The rules across sheets only run once every sheet and file reads cleanly,
                so a later check can find new problems.
              </p>
              <MigrationProblems problems={check.result.problems} />
            </>
          )}
        </div>
      )}
    </section>
  );
}
