'use client';

/** The email senders admin page. Its parts live in components/notifications/admin/senders/. */

import { useCallback, useState } from 'react';
import { AlertTriangle, Mail, Plus } from 'lucide-react';

import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Modal from '@/components/common/Modal';
import PageHeader from '@/components/common/PageHeader';
import ErrorNote from '@/components/ui/ErrorNote';
import Skeleton from '@/components/ui/Skeleton';
import { NOTIFICATION_PERMISSIONS } from '@/constants/notifications';
import { allow } from '@/constants/workflowPermissions';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { useNotificationLookup } from '@/hooks/useNotificationLookup';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import { notificationRepository } from '@/repositories/notificationRepository';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

import { SenderCard } from '@/components/notifications/admin/senders/SenderCard';
import { SenderForm } from '@/components/notifications/admin/senders/SenderForm';
import { TestEmail } from '@/components/notifications/admin/senders/TestEmail';

/**
 * The accounts email goes out through. One is the default; a type can have its
 * own. Reading is `Notifications.Manage`; changing is `Manage Settings`.
 */
export default function EmailSendersPage() {
  const toast = useToast();
  const { can } = usePermission();
  const canChange = allow(can, NOTIFICATION_PERMISSIONS.MANAGE_SETTINGS);

  const providers = useNotificationLookup('emailProviders').byKey;
  const security = useNotificationLookup('smtpSecurityModes');
  const faultReasons = useNotificationLookup('faultReasons').byKey;

  const [senders, setSenders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [form, setForm] = useState(null); // { sender: Object|null }
  const [testing, setTesting] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'delete'|'removeDefault', sender }
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSenders(await notificationRepository.getEmailSenders());
      setLoaded(true);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useLoadOnChange(load);

  const run = async (work, success) => {
    setBusy(true);
    setActionError(null);
    try {
      await work();
      toast.success(success);
      setConfirm(null);
      load();
    } catch (err) {
      setActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const onDefault = useCallback((sender) => {
    if (sender.isDefault) setConfirm({ kind: 'removeDefault', sender });
    else run(() => notificationRepository.setDefaultSender(sender.emailSenderId), `${sender.name} is the default now`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noDefault = loaded && senders.length > 0 && !senders.some((s) => s.isDefault);

  return (
    <div>
      <PageHeader
        title="Email senders"
        subtitle="The accounts email goes out through. Types without their own sender use the default."
        actions={canChange && (
          <Button icon={Plus} onClick={() => setForm({ sender: null })}>Add sender</Button>
        )}
      />

      {actionError && <div className="mb-4"><ErrorNote error={actionError} /></div>}

      {noDefault && (
        <p className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.warning, 0.12), color: CHROME.textSecondary }}>
          <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          There is no default sender, so emails of types without their own sender are not going out — they wait as
          &ldquo;Faulted&rdquo; and go once a default is set.
        </p>
      )}

      {error && !loaded ? (
        <ErrorNote error={error} onRetry={load} />
      ) : !loaded ? (
        <Skeleton rows={3} height={96} />
      ) : senders.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Mail size={24} style={{ color: CHROME.textMuted }} aria-hidden="true" />
            <p className="text-sm font-medium" style={{ color: CHROME.textSecondary }}>No email senders yet</p>
            <p className="text-xs" style={{ color: CHROME.textMuted }}>Until one is added and made the default, no email goes out.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {senders.map((sender) => (
            <SenderCard
              key={sender.emailSenderId}
              sender={sender}
              providers={providers}
              securityModes={security.byKey}
              canChange={canChange}
              onEdit={(s) => setForm({ sender: s })}
              onTest={setTesting}
              onDefault={onDefault}
              onDelete={(s) => setConfirm({ kind: 'delete', sender: s })}
            />
          ))}
        </div>
      )}

      {form && (
        <SenderForm
          sender={form.sender}
          securityModes={security.list}
          onClose={() => setForm(null)}
          onSaved={(message) => { setForm(null); toast.success(message); load(); }}
        />
      )}

      {testing && <TestEmail sender={testing} faultReasons={faultReasons} onClose={() => setTesting(null)} />}

      <Modal
        open={confirm != null}
        onClose={() => !busy && setConfirm(null)}
        title={confirm?.kind === 'delete' ? `Delete ${confirm?.sender.name}?` : `Remove ${confirm?.sender.name} as the default?`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() => (confirm.kind === 'delete'
                ? run(() => notificationRepository.deleteSender(confirm.sender.emailSenderId), 'Sender deleted')
                : run(() => notificationRepository.removeDefaultSender(), 'No default sender now'))}
            >
              {confirm?.kind === 'delete' ? 'Delete' : 'Remove default'}
            </Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
          {confirm?.kind === 'delete'
            ? 'It cannot be deleted while a notification type uses it as its own sender.'
            : 'With no default, every email of a type without its own sender stops going out (it waits as Faulted) until a default is set again.'}
        </p>
      </Modal>
    </div>
  );
}
