'use client';

import { useRef } from 'react';
import { AlertTriangle, FileSpreadsheet, FolderOpen } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass } from '@/components/ui/kit';
import { MIGRATION_MAX_BYTES, formatBytes } from '@/lib/dataMigration';
import { CHROME, STATUS } from '@/theme/vizPalette';

const FOLDER_PICKER = { webkitdirectory: '', directory: '' };

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: CHROME.textMuted }}>{label}</p>
      <div className="mt-0.5 truncate text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{children}</div>
    </div>
  );
}

/**
 * @param {{ folder: ReturnType<import('./useMigrationFolder').useMigrationFolder>, disabled: boolean }} props
 */
export default function FolderSection({ folder, disabled }) {
  const inputRef = useRef(null);
  const { selection } = folder;

  return (
    <section className="rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[var(--shadow-card)]">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>1. Pick the Migrations folder</h2>
          <p className="mt-0.5 text-xs" style={{ color: CHROME.textMuted }}>
            The workbook sits at its top; files go in BOQs/&lt;project code&gt;/ and Invoices/&lt;invoice ref&gt;/.
          </p>
        </div>
        <Button icon={FolderOpen} variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          {selection ? 'Pick another folder' : 'Pick folder'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          {...FOLDER_PICKER}
          className="hidden"
          onChange={(e) => { folder.pick(e.target.files); e.target.value = ''; }}
        />
      </header>

      {!selection ? (
        <p className="rounded-xl border border-dashed border-[#e1e0d9] px-4 py-8 text-center text-xs" style={{ color: CHROME.textMuted }}>
          No folder picked yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact label="Folder">{selection.folderName || '—'}</Fact>
            <Fact label="Files to send">{selection.included.length}</Fact>
            <Fact label="Upload size">{formatBytes(folder.uploadBytes)}</Fact>
            <Fact label="Skipped">{selection.skipped.length}</Fact>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: CHROME.textSecondary }}>
            <FileSpreadsheet size={14} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            {selection.workbooks.length === 0 ? (
              <span style={{ color: STATUS.critical }}>No .xlsx workbook at the top of this folder.</span>
            ) : selection.workbooks.length === 1 ? (
              <span>Workbook: <strong style={{ color: CHROME.textPrimary }}>{folder.workbook.name}</strong></span>
            ) : (
              <label className="flex items-center gap-2">
                Workbook:
                <select
                  value={folder.workbookIndex}
                  onChange={(e) => folder.setWorkbookIndex(Number(e.target.value))}
                  disabled={disabled}
                  className={controlClass}
                >
                  {selection.workbooks.map((w, i) => <option key={w.name} value={i}>{w.name}</option>)}
                </select>
              </label>
            )}
          </div>

          {folder.tooBig && (
            <p role="alert" className="flex items-start gap-1.5 text-xs" style={{ color: STATUS.critical }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              The upload is {formatBytes(folder.uploadBytes)}; at most {formatBytes(MIGRATION_MAX_BYTES)} can be imported at once.
            </p>
          )}

          {selection.skipped.length > 0 && (
            <details className="text-xs" style={{ color: CHROME.textSecondary }}>
              <summary className="cursor-pointer select-none">Skipped files ({selection.skipped.length}) — not sent</summary>
              <ul className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#fbfaf9] px-3 py-2 font-mono text-[11px]">
                {selection.skipped.map((s) => (
                  <li key={s.path} className="flex justify-between gap-3 py-0.5">
                    <span className="truncate">{s.path}</span>
                    <span className="shrink-0" style={{ color: CHROME.textMuted }}>{s.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
