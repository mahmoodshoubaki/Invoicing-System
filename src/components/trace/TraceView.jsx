'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Bell, Fingerprint, GitBranch, Search } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { workflowRepository } from '@/repositories/workflowRepository';
import { usePermission } from '@/hooks/usePermission';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { allow } from '@/constants/workflowPermissions';

const MAX_LENGTH = 64;

/** Each module its own quiet colour, so a long trace reads as two threads. */
const MODULE_LOOK = {
  Workflow: { tone: STATUS.info, icon: GitBranch },
  Notifications: { tone: '#c2562c', icon: Bell },
};

function timeOnly(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/** The trace before or after this one on the same runs — a click away. */
function LinkedTraces({ label, icon: Icon, links, traceHref }) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
      <Icon size={12} aria-hidden="true" />
      {label}
      {links.map((l) => (
        <Link
          key={`${l.correlationId}-${l.workflowInstanceId}`}
          href={traceHref(l.correlationId)}
          className="rounded-md px-1.5 py-0.5 font-mono transition-colors hover:bg-[#f1f0ee]"
          style={{ color: STATUS.info }}
          title={l.linkedOn ? `Linked ${formatDateTime(l.linkedOn)}` : undefined}
        >
          {l.correlationId}
        </Link>
      ))}
    </div>
  );
}

function TraceContent({ traceHref }) {
  const router = useRouter();
  const params = useSearchParams();
  const id = (params.get('id') ?? '').trim();
  const { can } = usePermission();
  const canOpenNotifications = allow(can, NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS);

  const [draft, setDraft] = useState(id);
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(0);

  // The box follows the URL when a linked trace is opened.
  const [shownId, setShownId] = useState(id);
  if (shownId !== id) {
    setShownId(id);
    setDraft(id);
  }

  const load = useCallback(async () => {
    if (!id || id.length > MAX_LENGTH) return;
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await workflowRepository.getCorrelationTrace(id);
      if (request === requestRef.current) setTrace(result);
    } catch (err) {
      if (request === requestRef.current) setError(err);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [id]);

  useLoadOnChange(load);

  const submit = (e) => {
    e.preventDefault();
    const next = draft.trim();
    if (next && next !== id) router.push(traceHref(next));
  };

  const tooLong = draft.trim().length > MAX_LENGTH;
  const current = trace && trace.correlationId === id ? trace : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Trace"
        subtitle="Everything one action caused — the runs it moved, the tasks it made, the notifications that went out."
      />

      <Card className="mb-4">
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-60 flex-1">
            <Fingerprint size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: CHROME.textMuted }} aria-hidden="true" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paste a tracking number, e.g. from an error message"
              aria-label="Tracking number"
              className={`${controlClass} w-full py-2 pl-8 font-mono`}
              style={tooLong ? { borderColor: STATUS.critical } : undefined}
            />
          </div>
          <Button type="submit" icon={Search} disabled={!draft.trim() || tooLong}>Trace</Button>
        </form>
        {tooLong && (
          <p className="mt-1.5 text-[11px]" style={{ color: STATUS.critical }}>
            A tracking number is at most {MAX_LENGTH} characters.
          </p>
        )}
      </Card>

      {!id ? (
        <p className="px-1 text-xs leading-relaxed" style={{ color: CHROME.textMuted }}>
          Every error message shows a reference — that is the tracking number. Paste it above to see what the
          action did across workflows and notifications, in the order it happened. Tracking started on
          7 October 2026, so older actions have none.
        </p>
      ) : error ? (
        <ErrorNote error={error} onRetry={load} />
      ) : loading && !current ? (
        <Card><Skeleton rows={5} height={44} /></Card>
      ) : current ? (
        <Card>
          <div className="mb-4 flex flex-col gap-1.5 border-b border-[#f1f0ee] pb-3">
            <p className="font-mono text-xs" style={{ color: CHROME.textPrimary }}>{current.correlationId}</p>
            <LinkedTraces label="Continues" icon={ArrowLeft} links={current.continues} traceHref={traceHref} />
            <LinkedTraces label="Continued by" icon={ArrowRight} links={current.continuedBy} traceHref={traceHref} />
          </div>

          {current.steps.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: CHROME.textMuted }}>
              Nothing was recorded under this number. It may be mistyped, or from before tracking started.
            </p>
          ) : (
            <ol className={`relative transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {current.steps.map((step, i) => {
                const look = MODULE_LOOK[step.module] ?? { tone: CHROME.textMuted, icon: GitBranch };
                const Icon = look.icon;
                const last = i === current.steps.length - 1;
                return (
                  <li key={`${step.at}-${i}`} className="flex gap-3">
                    <div className="flex w-16 shrink-0 flex-col items-end pt-1">
                      <span className="text-[11px] tabular-nums" style={{ color: CHROME.textSecondary }} title={formatDateTime(step.at)}>
                        {timeOnly(step.at)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: withAlpha(look.tone, 0.14), color: look.tone }}
                        aria-hidden="true"
                      >
                        <Icon size={12} />
                      </span>
                      {!last && <span className="w-px flex-1" style={{ backgroundColor: '#eceae4' }} />}
                    </div>
                    <div className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
                      <p className="pt-0.5 text-xs leading-relaxed" style={{ color: CHROME.textPrimary }}>{step.text}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px]" style={{ color: CHROME.textMuted }}>
                        <span>{step.module}</span>
                        {step.performedByName && <span>by {step.performedByName}</span>}
                        {step.workflowInstanceId && (
                          <Link
                            href={ROUTES.MONITORING_RUN(step.workflowInstanceId)}
                            className="underline-offset-2 hover:underline"
                            style={{ color: STATUS.info }}
                          >
                            Open run
                          </Link>
                        )}
                        {step.notificationId && canOpenNotifications && (
                          <Link
                            href={ROUTES.MONITORING_DELIVERY(step.notificationId)}
                            className="underline-offset-2 hover:underline"
                            style={{ color: STATUS.info }}
                          >
                            Open notification
                          </Link>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      ) : null}
    </div>
  );
}

/**
 * Everything one tracking number caused, across modules — Admin › Monitoring › Trace.
 *
 * `useSearchParams` needs a Suspense boundary above it in the App Router.
 */
export default function TraceView() {
  return (
    <Suspense fallback={null}>
      <TraceContent traceHref={ROUTES.MONITORING_TRACE} />
    </Suspense>
  );
}
