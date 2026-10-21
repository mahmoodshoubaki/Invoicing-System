'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, PauseCircle, Pencil, PlayCircle, Trash2 } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import TypeFormModal from '@/components/notifications/admin/TypeFormModal';
import TypeTabBar from '@/components/notifications/admin/type/TypeTabBar';
import DetailsTab from '@/components/notifications/admin/type/DetailsTab';
import ChannelSwitch from '@/components/notifications/admin/type/ChannelSwitch';
import TemplateWorkbench from '@/components/notifications/admin/type/TemplateWorkbench';
import { CHANNEL_TABS, NO_STATUS } from '@/components/notifications/admin/type/typeTabs';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { usePermission } from '@/hooks/usePermission';
import { useNotificationLookup } from '@/hooks/useNotificationLookup';
import { allow } from '@/constants/workflowPermissions';
import { CHANNEL, NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { ROUTES } from '@/constants/routes';
import { notificationRepository } from '@/repositories/notificationRepository';

/** A warning strip over the tabs. */
function Notice({ icon: Icon, children }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.warning, 0.12), color: CHROME.textSecondary }}>
      <Icon size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
      {children}
    </p>
  );
}

/**
 * One notification type: its details, and its words per channel, in tabs.
 *
 * Reading is `View`. Changing its details or writing words is `Manage`;
 * making a version live, rolling back or turning a channel off is `Publish` —
 * separate, so whoever writes a version is not automatically the one who sends
 * it. Deleting is `Delete`, and never for a standard type.
 */
export default function NotificationTypePage() {
  const { typeId } = useParams();
  const router = useRouter();
  const toast = useToast();
  const { can } = usePermission();
  const canManage = allow(can, NOTIFICATION_PERMISSIONS.MANAGE);
  const canPublish = allow(can, NOTIFICATION_PERMISSIONS.PUBLISH);
  const canDelete = allow(can, NOTIFICATION_PERMISSIONS.DELETE);
  // Sending a test needs Manage Settings; listing the senders to send through needs Manage.
  const canSendTest = canManage && allow(can, NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS);

  const priorities = useNotificationLookup('priorities');
  const languages = useNotificationLookup('languages');

  const [type, setType] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('details');
  const [channel, setChannel] = useState(CHANNEL.EMAIL);
  const [editing, setEditing] = useState(false);
  const [senders, setSenders] = useState(null);
  const [allTypes, setAllTypes] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);

  // What each channel's editor reports — unsaved edits, and problems per tab —
  // for the tab bar and the channel switch.
  const [status, setStatus] = useState({});
  const reportStatus = useCallback((channelKey, next) => {
    setStatus((prev) => {
      const old = prev[channelKey];
      if (old && old.dirty === next.dirty && old.placeholderIssues === next.placeholderIssues && old.bodyIssues === next.bodyIssues) return prev;
      return { ...prev, [channelKey]: next };
    });
  }, []);

  const load = useCallback(async () => {
    try {
      setType(await notificationRepository.getTypeDetails(typeId));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [typeId]);

  useLoadOnChange(load);

  // Senders (to name this type's own, and to test through) and categories (for the form) — fetched once.
  useEffect(() => {
    if (canManage) notificationRepository.getEmailSenders().then(setSenders).catch(() => setSenders(null));
    notificationRepository.getTypes().then(setAllTypes).catch(() => {});
  }, [canManage]);

  const categories = useMemo(() => [...new Set(allTypes.map((t) => t.category).filter(Boolean))].sort(), [allTypes]);

  /** Pause/resume or delete: one at a time, its error shown over the tabs. */
  const run = async (name, action) => {
    setBusy(name);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(null);
    }
  };

  const setPaused = (isPaused) => run('pause', async () => {
    await notificationRepository.setTypePaused(type.notificationTypeId, isPaused);
    toast.success(isPaused ? 'Paused' : 'Resumed', isPaused ? 'Nothing of this type is sent until it is resumed.' : 'It sends again.');
    load();
  });

  // NTF-006 (still live) / NTF-023 (standard) — the message says what to do,
  // so the confirm box closes to show it.
  const remove = () => run('delete', async () => {
    try {
      await notificationRepository.deleteType(type.notificationTypeId);
    } catch (err) {
      setConfirmDelete(false);
      throw err;
    }
    toast.success('Type deleted');
    router.replace(ROUTES.NOTIFICATION_TYPES);
  });

  if (error && !type) return <ErrorNote error={error} onRetry={load} />;
  if (!type) return <Card><Skeleton rows={6} height={48} /></Card>;

  const anyLive = type.channels.some((c) => c.liveVersion != null);

  return (
    <div>
      <PageHeader
        title={type.englishName}
        subtitle={`${type.code} · number ${type.key} — workflows pick it by this number`}
        breadcrumbs={[
          { label: 'Notification types', href: ROUTES.NOTIFICATION_TYPES },
          { label: type.englishName },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={ROUTES.NOTIFICATION_TYPES}>
              <Button variant="ghost" size="sm" icon={ChevronLeft}>Types</Button>
            </Link>
            {canManage && (
              <>
                <Button variant="outline" size="sm" icon={Pencil} onClick={() => setEditing(true)}>Edit details</Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={type.isPaused ? PlayCircle : PauseCircle}
                  onClick={() => setPaused(!type.isPaused)}
                  loading={busy === 'pause'}
                >
                  {type.isPaused ? 'Resume' : 'Pause'}
                </Button>
              </>
            )}
            {canDelete && !type.isSystemType && (
              <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>Delete</Button>
            )}
          </div>
        }
      />

      {actionError && <div className="mb-4"><ErrorNote error={actionError} /></div>}

      {type.isPaused && (
        <Notice icon={PauseCircle}>
          Paused — nothing of this type is sent on any channel until it is resumed. Its words are kept.
        </Notice>
      )}
      {!type.isPaused && !anyLive && (
        <Notice icon={AlertTriangle}>
          This type sends nothing yet: no channel has published words. Write them on the Body tab and publish a version.
        </Notice>
      )}

      <Card padding={false}>
        <TypeTabBar value={tab} onChange={setTab} status={status[channel] ?? NO_STATUS} />

        {tab === 'details' && (
          <DetailsTab
            type={type}
            priority={priorities.byKey[type.priorityKey]}
            senderName={senders?.find((s) => s.emailSenderId === type.emailSenderId)?.name ?? null}
            canManage={canManage}
            onEdit={() => setEditing(true)}
          />
        )}

        {/* The editors stay mounted while hidden, so unsaved edits survive a tab or channel switch. */}
        <div className="p-4" hidden={tab === 'details'}>
          <div className="mb-4">
            <ChannelSwitch value={channel} onChange={setChannel} channels={type.channels} status={status} />
          </div>
          {CHANNEL_TABS.map(({ key, label }) => (
            <div key={key} hidden={channel !== key}>
              <TemplateWorkbench
                typeId={type.notificationTypeId}
                channelKey={key}
                channelLabel={label}
                languages={languages.list}
                priorities={priorities.list}
                canManage={canManage}
                canPublish={canPublish}
                canSendTest={canSendTest}
                senders={canSendTest ? senders : null}
                preferredSenderId={type.emailSenderId ?? null}
                // Only the channel on screen draws a tab; the other keeps its draft, unseen.
                tab={channel === key && tab !== 'details' ? tab : null}
                onStatus={reportStatus}
                onChanged={load}
              />
            </div>
          ))}
        </div>
      </Card>

      {editing && (
        <TypeFormModal
          type={type}
          categories={categories}
          priorities={priorities.list}
          senders={canManage ? senders : null}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); toast.success('Saved'); load(); }}
        />
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete ${type.englishName}?`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Keep it</Button>
            <Button variant="danger" icon={Trash2} onClick={remove} loading={busy === 'delete'}>Delete</Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
          {anyLive
            ? 'It still has live words, so the delete will be refused — turn its channels off first.'
            : 'It disappears from every list. A workflow that still picks it by number is refused when it is next saved.'}
        </p>
      </Modal>
    </div>
  );
}
