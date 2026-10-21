'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import ErrorNote from '@/components/ui/ErrorNote';
import TestEmailResult from '@/components/notifications/admin/TestEmailResult';
import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationLookup } from '@/hooks/useNotificationLookup';
import { notificationRepository } from '@/repositories/notificationRepository';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The type's own sender when it has one, else the default, else the first. */
function startingSender(senders, preferredSenderId) {
  const pick = senders.find((s) => s.emailSenderId === preferredSenderId)
    ?? senders.find((s) => s.isDefault)
    ?? senders[0];
  return pick?.emailSenderId ?? '';
}

/**
 * Sends one saved email version, filled in with the editor's sample values, to
 * one address now. Unlike the senders page's check email, the backend keeps
 * this one in the monitor — marked as a test, with its opens and clicks — and
 * the result links to it.
 *
 * @param {{
 *   version: { templateId: string, version: number },
 *   senders: Array, preferredSenderId: string|null,
 *   sampleValues: Object|null, onClose: () => void,
 * }} props
 */
export default function TemplateTestEmail({ version, senders, preferredSenderId, sampleValues, onClose }) {
  const { user } = useAuth();
  const faultReasons = useNotificationLookup('faultReasons').byKey;
  const [to, setTo] = useState(user?.email ?? '');
  const [senderId, setSenderId] = useState(() => startingSender(senders, preferredSenderId));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sampleCount = Object.keys(sampleValues ?? {}).length;

  const send = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await notificationRepository.sendTestEmail({
        emailSenderId: senderId,
        toAddress: to.trim(),
        templateId: version.templateId,
        sampleValues,
      }));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Send version ${version.version} as a test`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button icon={Send} onClick={send} loading={busy} disabled={!EMAIL.test(to.trim()) || !senderId}>
            Send test
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
          Version {version.version}, filled in with{' '}
          {sampleCount > 0
            ? `the ${sampleCount} sample value${sampleCount === 1 ? '' : 's'} from the preview`
            : 'each value’s default (the preview has no sample values)'}
          , goes to this address now. The monitor keeps it, marked Test, with its opens and clicks.
        </p>
        <label className="block">
          <span className={labelClass} style={{ color: CHROME.textSecondary }}>Send it to</span>
          <input type="email" value={to} onChange={(e) => setTo(e.target.value)} className={`${controlClass} w-full`} placeholder="me@example.com" />
        </label>
        <label className="block">
          <span className={labelClass} style={{ color: CHROME.textSecondary }}>Send it through</span>
          <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className={`${controlClass} w-full`}>
            {senders.map((s) => (
              <option key={s.emailSenderId} value={s.emailSenderId}>
                {`${s.name} — ${s.fromAddress}${s.emailSenderId === preferredSenderId ? ' (this type’s sender)' : s.isDefault ? ' (default)' : ''}`}
              </option>
            ))}
          </select>
        </label>
        <TestEmailResult result={result} faultReasons={faultReasons} />
        <ErrorNote error={error} compact />
      </div>
    </Modal>
  );
}
