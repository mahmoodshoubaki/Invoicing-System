'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FolderKanban, Search, X } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { projectRepository } from '@/repositories/projectRepository';

/** Enough to scan without scrolling; typing narrows the rest. */
const SHOWN = 20;

/**
 * Picks the projects a project workflow runs on, by name — the code is what
 * is sent.
 *
 * A project's id is its CODE, and the backend does not check that a code
 * exists: a misspelled one still starts a run, just with no project behind it.
 * So the codes are chosen from the real project list rather than typed.
 *
 * The list is the same `GetProjectsList` the Projects page reads, loaded once
 * when this mounts and filtered here. If it cannot be read — no permission,
 * say — `onUnavailable` hands the job back to the caller's plain text box,
 * rather than leaving somebody unable to start the run at all.
 *
 * @param {{
 *   selectedCodes: string[],
 *   onChange: (codes: string[]) => void,
 *   onUnavailable: () => void,
 * }} props
 */
function ProjectPicker({ selectedCodes, onChange, onUnavailable }) {
  const [projects, setProjects] = useState(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    projectRepository
      .getProjects()
      .then((rows) => {
        if (!cancelled) setProjects(rows.filter((p) => p.projectCode));
      })
      .catch(() => {
        if (!cancelled) onUnavailable?.();
      });
    return () => { cancelled = true; };
    // Loaded once; the caller's callback identity is irrelevant to that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const byCode = useMemo(
    () => Object.fromEntries((projects ?? []).map((p) => [p.projectCode, p])),
    [projects]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? [])
      .filter((p) => !selectedCodes.includes(p.projectCode))
      .filter((p) => !q
        || p.projectCode.toLowerCase().includes(q)
        || p.projectName?.toLowerCase().includes(q)
        || p.clientName?.toLowerCase().includes(q))
      .slice(0, SHOWN);
  }, [projects, query, selectedCodes]);

  const add = (code) => {
    onChange([...selectedCodes, code]);
    setQuery('');
  };

  return (
    <div ref={ref}>
      {selectedCodes.length > 0 && (
        <ul className="mb-1.5 flex flex-wrap gap-1.5" data-motion>
          {selectedCodes.map((code) => {
            const project = byCode[code];
            return (
              <li key={code}>
                <span
                  className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-[11px] font-medium"
                  style={{ backgroundColor: withAlpha(STATUS.info, 0.14), color: STATUS.info }}
                  title={project?.projectName ?? code}
                >
                  <span className="font-mono">{code}</span>
                  {project?.projectName && (
                    <span className="max-w-48 truncate font-normal">· {project.projectName}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onChange(selectedCodes.filter((c) => c !== code))}
                    aria-label={`Remove ${code}`}
                    className="rounded-full p-0.5 hover:bg-black/10"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="relative">
        <Search
          size={13}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"
          style={{ color: CHROME.textMuted }}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search projects by code, name or client…"
          aria-label="Search projects"
          className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs outline-none focus:border-primary"
        />

        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#e1e0d9] bg-white shadow-lg">
            {projects == null ? (
              <p className="px-3 py-2 text-[11px]" style={{ color: CHROME.textMuted }}>Loading projects…</p>
            ) : matches.length === 0 ? (
              <p className="px-3 py-2 text-[11px]" style={{ color: CHROME.textMuted }}>
                {query.trim() ? `No project matches “${query.trim()}”.` : 'No more projects to add.'}
              </p>
            ) : (
              <ul className="max-h-56 overflow-auto" data-motion>
                {matches.map((p) => (
                  <li key={p.projectCode}>
                    <button
                      type="button"
                      onClick={() => add(p.projectCode)}
                      className="flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors hover:bg-[#fbfaf9]"
                    >
                      <FolderKanban size={12} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium" style={{ color: CHROME.textPrimary }}>
                          {p.projectName || p.projectCode}
                        </span>
                        <span className="block truncate text-[10px]" style={{ color: CHROME.textMuted }}>
                          <span className="font-mono">{p.projectCode}</span>
                          {p.clientName && ` · ${p.clientName}`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProjectPicker);
