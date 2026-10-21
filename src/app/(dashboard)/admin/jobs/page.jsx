'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarClock, Play, Power, Timer } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import LookupBadge from '@/components/ui/LookupBadge';
import CronField from '@/components/workflow/builder/CronField';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { describeCron, looksLikeCron } from '@/utils/cron';
import { formatDateTime } from '@/utils/formatters';
import { relativeTime } from '@/utils/relativeTime';
import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { backgroundJobsRepository } from '@/repositories/backgroundJobsRepository';

/** States a run has not finished in — "Run now" watches until it leaves them. */
const RUNNING_STATES = ['Enqueued', 'Processing'];
/** How often to look while a job someone just started is still going. */
const WATCH_MS = 3000;
/** And for how long at most, so a stuck job cannot poll for ever. */
const WATCH_LIMIT_MS = 120_000;

const STATE_LOOK = {
  Succeeded: { tone: STATUS.good, label: 'Succeeded' },
  Failed: { tone: STATUS.critical, label: 'Failed' },
  // Hangfire will try again; `lastRunError` says why the last try failed.
  Scheduled: { tone: STATUS.warning, label: 'Retrying' },
  Enqueued: { tone: STATUS.info, label: 'Queued' },
  Processing: { tone: STATUS.info, label: 'Running' },
};

const MODULE_ORDER = ['Workflow', 'Notifications'];

/** The schedule in words, with the raw expression beside it for whoever reads cron. */
function Schedule({ schedule }) {
  const words = describeCron(schedule);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span>{words ?? 'Custom schedule'}</span>
      <code className="rounded px-1 font-mono text-[10px]" style={{ backgroundColor: '#f6f5f3', color: CHROME.textMuted }}>
        {schedule}
      </code>
    </span>
  );
}

const JobRow = memo(function JobRow({ job, now, busy, onToggle, onRunNow, onEditSchedule }) {
  const state = STATE_LOOK[job.lastRunState] ?? null;
  const running = RUNNING_STATES.includes(job.lastRunState);

  return (
    <li className="flex flex-col gap-3 border-b border-[#f1f0ee] px-4 py-4 last:border-0 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold" style={{ color: job.isOn ? CHROME.textPrimary : CHROME.textMuted }}>
          {job.name}
          {!job.isOn && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: '#f1f0ee', color: CHROME.textMuted }}>
              Off
            </span>
          )}
        </p>
        {job.description && (
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: CHROME.textMuted }}>{job.description}</p>
        )}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
          <span className="inline-flex items-center gap-1">
            <CalendarClock size={11} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            <Schedule schedule={job.schedule} />
          </span>
          {job.isOn && job.nextRunOn && (
            <span title={formatDateTime(job.nextRunOn)}>next {relativeTime(job.nextRunOn, now)}</span>
          )}
        </p>
      </div>

      <div className="flex min-w-0 flex-col gap-1 lg:w-72">
        <p className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          Last run
          {state ? <LookupBadge label={state.label} colorHex={state.tone} /> : <span>never</span>}
          {job.lastRunOn && <span title={formatDateTime(job.lastRunOn)}>{relativeTime(job.lastRunOn, now)}</span>}
        </p>
        {job.lastRunResult && (
          <p className="text-[11px] leading-snug" style={{ color: CHROME.textSecondary }}>{job.lastRunResult}</p>
        )}
        {job.lastRunError && (
          <p
            className="rounded-md px-2 py-1 text-[11px] leading-snug"
            style={{ backgroundColor: withAlpha(STATUS.critical, 0.07), color: CHROME.textSecondary }}
            title={job.lastRunError}
          >
            <span className="line-clamp-3">{job.lastRunError}</span>
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" icon={Play} onClick={() => onRunNow(job)} loading={busy === 'run' || running} disabled={Boolean(busy)}>
          {running ? 'Running' : 'Run now'}
        </Button>
        <Button size="sm" variant="ghost" icon={CalendarClock} onClick={() => onEditSchedule(job)} disabled={Boolean(busy)}>
          Schedule
        </Button>
        <button
          type="button"
          role="switch"
          aria-checked={job.isOn}
          aria-label={job.isOn ? `Switch ${job.name} off` : `Switch ${job.name} on`}
          onClick={() => onToggle(job)}
          disabled={Boolean(busy)}
          className="inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-[11px] font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: job.isOn ? withAlpha(STATUS.good, 0.12) : '#f1f0ee',
            color: job.isOn ? CHROME.textPrimary : CHROME.textMuted,
          }}
        >
          <span
            className="flex size-5 items-center justify-center rounded-full"
            style={{ backgroundColor: job.isOn ? STATUS.good : '#c3c2b7', color: '#fff' }}
          >
            <Power size={11} aria-hidden="true" />
          </span>
          {job.isOn ? 'On' : 'Off'}
        </button>
      </div>
    </li>
  );
});

/**
 * Every background job the app runs: what it does, when, whether it is on and
 * how its last run went. `System.ManageJobs`.
 *
 * Off keeps the schedule and just stops; "Run now" works on a job that is off
 * too (it runs once and stays off). Switching one off asks first, quoting the
 * job's own description of what stops — some of these are the reason anything
 * happens at all (starting workflows from events, sending emails).
 */
export default function BackgroundJobsPage() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  /** jobKey → 'run' | 'toggle' | 'schedule', while a change is in flight. */
  const [busy, setBusy] = useState({});
  const [confirmOff, setConfirmOff] = useState(null);
  const [editing, setEditing] = useState(null);
  const [draftSchedule, setDraftSchedule] = useState('');
  const [actionError, setActionError] = useState(null);
  const watchUntil = useRef(0);

  const load = useCallback(async () => {
    try {
      const rows = await backgroundJobsRepository.getJobs();
      setJobs(rows);
      setNow(Date.now());
      setLoaded(true);
      setError(null);
      return rows;
    } catch (err) {
      setError(err);
      return null;
    }
  }, []);

  useLoadOnChange(load);

  // After "Run now": look again every few seconds until nothing is queued or running.
  const anyRunning = jobs.some((j) => RUNNING_STATES.includes(j.lastRunState));
  useEffect(() => {
    if (!anyRunning || Date.now() > watchUntil.current) return undefined;
    const id = setInterval(load, WATCH_MS);
    return () => clearInterval(id);
  }, [anyRunning, load]);

  const replace = (row) => setJobs((prev) => prev.map((j) => (j.jobKey === row.jobKey ? row : j)));
  const setJobBusy = (key, what) => setBusy((prev) => ({ ...prev, [key]: what }));

  const update = async (job, changes, what) => {
    setJobBusy(job.jobKey, what);
    setActionError(null);
    try {
      const row = await backgroundJobsRepository.updateJob(job, { schedule: job.schedule, isOn: job.isOn, ...changes });
      replace(row);
      return row;
    } catch (err) {
      setActionError(err);
      return null;
    } finally {
      setJobBusy(job.jobKey, null);
    }
  };

  const handleToggle = useCallback((job) => {
    if (job.isOn) setConfirmOff(job);
    else update(job, { isOn: true }, 'toggle').then((row) => row && toast.success(`${job.name} is on`));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  const handleRunNow = useCallback(async (job) => {
    setJobBusy(job.jobKey, 'run');
    setActionError(null);
    try {
      const row = await backgroundJobsRepository.runNow(job);
      replace(row);
      watchUntil.current = Date.now() + WATCH_LIMIT_MS;
      toast.info(`${job.name} started`, job.isOn ? undefined : 'It runs once and stays off.');
    } catch (err) {
      setActionError(err);
    } finally {
      setJobBusy(job.jobKey, null);
    }
  }, [toast]);

  const handleEditSchedule = useCallback((job) => {
    setEditing(job);
    setDraftSchedule(job.schedule);
  }, []);

  const saveSchedule = async () => {
    const row = await update(editing, { schedule: draftSchedule.trim() }, 'schedule');
    if (row) {
      setEditing(null);
      toast.success('Schedule changed', describeCron(row.schedule) ?? row.schedule);
    }
  };

  const groups = useMemo(() => {
    const byModule = new Map();
    for (const job of jobs) {
      if (!byModule.has(job.module)) byModule.set(job.module, []);
      byModule.get(job.module).push(job);
    }
    return [...byModule.entries()].sort(
      ([a], [b]) => (MODULE_ORDER.indexOf(a) + 1 || 99) - (MODULE_ORDER.indexOf(b) + 1 || 99)
    );
  }, [jobs]);

  return (
    <div>
      <PageHeader
        title="Background jobs"
        subtitle="What runs on its own, when it runs, and how it went last time. Times are the server's."
      />

      {actionError && <div className="mb-4"><ErrorNote error={actionError} /></div>}

      {error && !loaded ? (
        <ErrorNote error={error} onRetry={load} />
      ) : !loaded ? (
        <Card><Skeleton rows={6} height={64} /></Card>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Timer size={24} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            <p className="text-sm" style={{ color: CHROME.textSecondary }}>No background jobs were reported.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([module, rows]) => (
            <Card key={module} padding={false}>
              <div className="flex items-center justify-between border-b border-[#f1f0ee] px-4 py-3">
                <h2 className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{module}</h2>
                <span className="text-[11px]" style={{ color: CHROME.textMuted }}>
                  {rows.filter((r) => r.isOn).length} of {rows.length} on
                </span>
              </div>
              <ul>
                {rows.map((job) => (
                  <JobRow
                    key={job.jobKey}
                    job={job}
                    now={now}
                    busy={busy[job.jobKey] ?? null}
                    onToggle={handleToggle}
                    onRunNow={handleRunNow}
                    onEditSchedule={handleEditSchedule}
                  />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* Switching off asks first, quoting what stops. */}
      <Modal
        open={confirmOff != null}
        onClose={() => setConfirmOff(null)}
        title={`Switch off "${confirmOff?.name ?? ''}"?`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOff(null)}>Keep it on</Button>
            <Button
              variant="danger"
              icon={Power}
              loading={busy[confirmOff?.jobKey] === 'toggle'}
              onClick={async () => {
                const job = confirmOff;
                const row = await update(job, { isOn: false }, 'toggle');
                if (row) {
                  setConfirmOff(null);
                  toast.success(`${job.name} is off`, 'Its schedule is kept for when it is switched back on.');
                }
              }}
            >
              Switch off
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {confirmOff?.description && (
            <p
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
              style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
              {confirmOff.description}
            </p>
          )}
          <p className="text-xs" style={{ color: CHROME.textMuted }}>
            The schedule is kept. &ldquo;Run now&rdquo; still works while it is off.
          </p>
        </div>
      </Modal>

      <Modal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={`Schedule — ${editing?.name ?? ''}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              icon={CalendarClock}
              onClick={saveSchedule}
              loading={busy[editing?.jobKey] === 'schedule'}
              disabled={!looksLikeCron(draftSchedule) || draftSchedule.trim() === editing?.schedule}
            >
              Save schedule
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <CronField value={draftSchedule} onChange={setDraftSchedule} />
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
            Five parts — minute, hour, day, month, weekday — in the server&rsquo;s local time. Every minute is{' '}
            <code className="font-mono">* * * * *</code>.
          </p>
        </div>
      </Modal>
    </div>
  );
}
