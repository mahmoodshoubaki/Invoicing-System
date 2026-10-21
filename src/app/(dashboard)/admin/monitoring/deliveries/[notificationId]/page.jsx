'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Archive, Bell, ChevronLeft, Fingerprint, GitBranch, Lightbulb, Mail, PencilLine, RotateCcw,
} from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import LookupBadge from '@/components/ui/LookupBadge';
import JsonBlock from '@/components/ui/JsonBlock';
import TestBadge from '@/components/notifications/admin/TestBadge';
import EmailHeader from '@/components/monitoring/deliveries/EmailHeader';
import ResentAsTable from '@/components/monitoring/deliveries/ResentAsTable';
import ResendDialog from '@/components/monitoring/deliveries/resend/ResendDialog';
import PillTabs from '@/components/ui/PillTabs';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { useNotificationLookup } from '@/hooks/useNotificationLookup';
import { CHANNEL } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';
import { notificationRepository } from '@/repositories/notificationRepository';

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>{label}</p>
      <div className="mt-0.5 break-words text-xs" style={{ color: CHROME.textPrimary }}>{children}</div>
    </div>
  );
}

/** One moment in a delivery's life, shown only if it happened. */
function Moment({ label, value, approx = false }) {
  if (!value) return null;
  return (
    <span className="whitespace-nowrap">
      <span style={{ color: CHROME.textMuted }}>{label} </span>
      {formatDateTime(value)}{approx ? ' (approx.)' : ''}
    </span>
  );
}

/** The text as it went out: the combined message, or each language. */
const SentText = memo(function SentText({ delivery }) {
  const [view, setView] = useState('sent');
  const text = view === 'en'
    ? { subject: delivery.englishSubject, body: delivery.englishBody, dir: 'ltr' }
    : view === 'ar'
      ? { subject: delivery.arabicSubject, body: delivery.arabicBody, dir: 'rtl' }
      : { subject: delivery.subject, body: delivery.body, dir: 'auto' };

  return (
    <div>
      <div className="mb-2">
        <PillTabs
          tabs={[{ key: 'sent', label: 'As sent' }, { key: 'en', label: 'English' }, { key: 'ar', label: 'Arabic' }]}
          value={view}
          onChange={setView}
        />
      </div>
      <p dir={text.dir} className="text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{text.subject || '—'}</p>
      {delivery.isHtml ? (
        // Sandboxed with nothing allowed: shows what was sent, runs nothing.
        <iframe title="Sent email" sandbox="" srcDoc={text.body} className="mt-2 h-72 w-full rounded-lg border border-[#eceae4] bg-white" />
      ) : (
        <p dir={text.dir} className="mt-1 whitespace-pre-line text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>{text.body || '—'}</p>
      )}
    </div>
  );
});

/**
 * One notification, in full — what it was, who it was for, and what happened
 * on each channel. `Notifications.ManageSettings`.
 */
export default function NotificationDetailsPage() {
  const { notificationId } = useParams();
  const router = useRouter();
  const toast = useToast();
  const statuses = useNotificationLookup('deliveryStatuses');

  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [resending, setResending] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetails(await notificationRepository.getNotificationDetails(notificationId));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [notificationId]);

  useLoadOnChange(load);

  const requeue = async (deliveryIds) => {
    setBusy(deliveryIds ? `requeue:${deliveryIds[0]}` : 'requeue');
    setActionError(null);
    try {
      const done = await notificationRepository.requeue(deliveryIds ? { deliveryIds } : { notificationId });
      toast.success(done.length ? `${done.length} sent again` : 'Nothing to send again', done.length ? 'Same text, every try back.' : 'None of its deliveries is stopped.');
      load();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(null);
    }
  };

  const archive = async () => {
    setBusy('archive');
    setActionError(null);
    try {
      const done = await notificationRepository.archive([notificationId]);
      toast.success(done.length ? 'Archived' : 'Not archived', done.length ? 'It can still be opened, but not sent again.' : 'It is still being sent, or was already archived.');
      load();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(null);
    }
  };

  if (error && !details) return <ErrorNote error={error} onRetry={load} />;
  if (!details) return <Card><Skeleton rows={6} height={52} /></Card>;

  const anyRequeueable = details.deliveries.some((d) => d.canBeRequeued);

  return (
    <div>
      <PageHeader
        title={details.isTest
          ? <span className="inline-flex flex-wrap items-center gap-2">{details.typeName} <TestBadge size="md" /></span>
          : details.typeName}
        subtitle={`To ${details.recipientName ?? details.recipientEmail ?? 'someone'} · ${formatDateTime(details.createdOn)}`}
        breadcrumbs={[{ label: 'Delivery monitor', href: ROUTES.MONITORING_DELIVERIES }, { label: details.typeName }]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={ROUTES.MONITORING_DELIVERIES}><Button variant="ghost" size="sm" icon={ChevronLeft}>Monitor</Button></Link>
            {!details.isArchived && (
              <>
                <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => requeue(null)} loading={busy === 'requeue'} disabled={!anyRequeueable || Boolean(busy)}>
                  Send again
                </Button>
                <Button size="sm" variant="outline" icon={PencilLine} onClick={() => setResending(true)} disabled={Boolean(busy)}>
                  Resend with edits
                </Button>
              </>
            )}
            {details.canBeArchived && (
              <Button size="sm" variant="ghost" icon={Archive} onClick={archive} loading={busy === 'archive'} disabled={Boolean(busy)}>Archive</Button>
            )}
          </div>
        }
      />

      {actionError && <div className="mb-4"><ErrorNote error={actionError} /></div>}

      {details.isArchived && (
        <p className="mb-4 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: '#f6f5f3', color: CHROME.textSecondary }}>
          Archived {formatDateTime(details.archivedOn)} — it can be read, but not sent again.
        </p>
      )}
      {details.isTest && (
        <p className="mb-4 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: '#f6f5f3', color: CHROME.textSecondary }}>
          A test, sent from the template editor with sample values — not something the system sent. Its opens and
          clicks are still recorded.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {details.deliveries.map((d) => {
            const status = statuses.byKey[d.statusKey];
            const email = d.channelKey === CHANNEL.EMAIL;
            return (
              <Card key={d.deliveryId}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>
                    {email ? <Mail size={14} aria-hidden="true" /> : <Bell size={14} aria-hidden="true" />}
                    {d.channel}
                    <LookupBadge label={d.status || status?.value || '—'} colorHex={status?.colorHex} title={status?.description ?? undefined} size="sm" />
                  </p>
                  {d.canBeRequeued && !details.isArchived && (
                    <Button size="sm" variant="outline" icon={RotateCcw} onClick={() => requeue([d.deliveryId])} loading={busy === `requeue:${d.deliveryId}`} disabled={Boolean(busy)}>
                      Send again
                    </Button>
                  )}
                </div>

                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
                  <span><span style={{ color: CHROME.textMuted }}>Priority </span>{d.priority || '—'}</span>
                  {d.maxRetries > 0 && <span><span style={{ color: CHROME.textMuted }}>Tries </span>{d.retryCount} of {d.maxRetries}</span>}
                  {d.emailSenderName && <span><span style={{ color: CHROME.textMuted }}>Through </span>{d.emailSenderName}</span>}
                  <span><span style={{ color: CHROME.textMuted }}>Words </span>version {d.templateVersion}</span>
                </p>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
                  <Moment label="Sent" value={d.sentAt} />
                  <Moment label="Delivered" value={d.deliveredAt} />
                  <Moment label="Failed" value={d.failedAt} />
                  <Moment label="Next try" value={d.nextRetryAt} />
                  <Moment label="Seen" value={d.seenAt} />
                  <Moment label="Read" value={d.readAt} />
                  <Moment label="Opened" value={d.openedAt} approx />
                  <Moment label="Clicked" value={d.clickedAt} approx />
                </p>

                {(d.errorMessage || d.faultReason) && (
                  <div className="mt-3 rounded-lg px-3 py-2.5" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}>
                    {d.faultReason && <p className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{d.faultReason}</p>}
                    {d.errorMessage && <p className="mt-0.5 font-mono text-[11px]" style={{ color: CHROME.textSecondary }}>{d.errorMessage}</p>}
                    {d.whatToFix && (
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed" style={{ color: CHROME.textSecondary }}>
                        <Lightbulb size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
                        {d.whatToFix}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-[#f1f0ee] pt-3">
                  <SentText delivery={d} />
                </div>
              </Card>
            );
          })}

          {details.resentAs.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Resent as</p>
              <ResentAsTable copies={details.resentAs} statuses={statuses} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-3">
              <Fact label="Type">{details.typeName} <code className="font-mono text-[11px]" style={{ color: CHROME.textMuted }}>{details.typeCode} · {details.typeKey}</code></Fact>
              {/* The one person this copy went to — the email itself may have named a whole group. */}
              <Fact label="Delivered to">
                {details.recipientName ?? '—'}
                {details.recipientEmail && <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>{details.recipientEmail}</span>}
              </Fact>
              <EmailHeader toEmail={details.toEmail} ccEmail={details.ccEmail} recipientEmail={details.recipientEmail} />
              <Fact label="Made by">{details.createdByName ?? 'The system'}</Fact>
              {details.actionUrl && (
                <Fact label="Link">
                  <a href={details.actionUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-[11px] underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                    {details.actionUrl}
                  </a>
                </Fact>
              )}
              {details.workflowInstanceId && (
                <Fact label="Sent by a workflow">
                  <Link href={ROUTES.MONITORING_RUN(details.workflowInstanceId)} className="inline-flex items-center gap-1 underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                    <GitBranch size={11} aria-hidden="true" /> Open the run
                  </Link>
                </Fact>
              )}
              {details.correlationId && (
                <Fact label="Tracking number">
                  <Link href={ROUTES.MONITORING_TRACE(details.correlationId)} className="inline-flex items-center gap-1 font-mono text-[11px] underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                    <Fingerprint size={11} aria-hidden="true" /> {details.correlationId}
                  </Link>
                </Fact>
              )}
              {details.resentFromNotificationId && (
                <Fact label="Resent from">
                  <Link href={ROUTES.MONITORING_DELIVERY(details.resentFromNotificationId)} className="underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                    the original notification
                  </Link>
                </Fact>
              )}
              {details.resentAs.length === 0 && details.resentAsNotificationIds.length > 0 && (
                <Fact label="Resent as">
                  <span className="flex flex-col gap-0.5">
                    {details.resentAsNotificationIds.map((id, i) => (
                      <Link key={id} href={ROUTES.MONITORING_DELIVERY(id)} className="underline-offset-2 hover:underline" style={{ color: STATUS.info }}>
                        resend {i + 1}
                      </Link>
                    ))}
                  </span>
                </Fact>
              )}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Values it was made with</p>
            <JsonBlock value={details.valuesJson} />
          </Card>
        </div>
      </div>

      {resending && (
        <ResendDialog
          details={details}
          onClose={() => setResending(false)}
          onDone={({ notificationId: firstId, notificationIds }) => {
            setResending(false);
            // One copy: open it. Several: stay here, where "Resent as" lists them all.
            if (notificationIds.length > 1) {
              toast.success(`Sent as ${notificationIds.length} new notifications`, 'One for each person — listed under Resent as.');
              load();
            } else {
              toast.success('Sent as a new notification');
              if (firstId) router.push(ROUTES.MONITORING_DELIVERY(firstId));
              else load();
            }
          }}
        />
      )}
    </div>
  );
}
