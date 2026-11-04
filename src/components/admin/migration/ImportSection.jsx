'use client';

import { useState } from 'react';
import { CheckCircle2, CloudUpload, Square } from 'lucide-react';

import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import ErrorNote from '@/components/ui/ErrorNote';
import { formatBytes } from '@/lib/dataMigration';
import { CHROME, STATUS } from '@/theme/vizPalette';
import MigrationCounts from './MigrationCounts';
import MigrationProblems from './MigrationProblems';

function Progress({ progress }) {
  const pct = progress.total ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-[#f1f0ee]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-[#f8485e] transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs tabular-nums" style={{ color: CHROME.textSecondary }}>
        {progress.uploaded
          ? 'Uploaded. The server is checking and saving everything — this can take a while.'
          : `Uploading ${formatBytes(progress.loaded)} of ${formatBytes(progress.total)} (${pct}%)`}
      </p>
    </div>
  );
}

/**
 * @param {{ run: ReturnType<import('./useMigrationRun').useMigrationRun>, folder: ReturnType<import('./useMigrationFolder').useMigrationFolder>, }} props
 */
export default function ImportSection({ run, folder }) {
  const [confirming, setConfirming] = useState(false);
  const { upload } = run;
  const running = upload.status === 'running';

  return (
    <section className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>3. Import</h2>
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
            Uploads every file and saves everything in one go — or nothing, if anything is wrong. No workflows start.
          </p>
        </div>
        {running ? (
          <Button icon={Square} size="sm" variant="outline" onClick={run.stopImport} disabled={upload.progress?.uploaded}>
            Stop upload
          </Button>
        ) : (
          <Button icon={CloudUpload} size="sm" onClick={() => setConfirming(true)} disabled={!run.canImport}>Import</Button>
        )}
      </header>

      {upload.status === 'idle' && (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>Available after a check with no problems.</p>
      )}
      {running && upload.progress && <Progress progress={upload.progress} />}
      {upload.status === 'error' && <ErrorNote error={upload.error} />}
      {upload.status === 'done' && (
        <div className="flex flex-col gap-4">
          {upload.result.saved ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: STATUS.good }}>
              <CheckCircle2 size={16} aria-hidden="true" />
              Imported. Workflows were not started — start runs by hand where needed.
            </p>
          ) : (
            <p className="text-sm font-semibold" style={{ color: STATUS.critical }}>Nothing was saved.</p>
          )}
          <MigrationCounts counts={upload.result.counts} />
          {upload.result.problems.length > 0 && <MigrationProblems problems={upload.result.problems} />}
        </div>
      )}

      <ConfirmModal
        open={confirming}
        title="Import the historical data?"
        message={`${folder.included.length} files and the workbook (${formatBytes(folder.uploadBytes)}) will be uploaded and saved in one go. It cannot be undone from here.`}
        confirmLabel="Import"
        confirmVariant="primary"
        onClose={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); run.runImport(); }}
      />
    </section>
  );
}
