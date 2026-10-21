'use client';

/** Sending a sender's short check email. */

import { useState } from 'react';
import { Send } from 'lucide-react';

import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import TestEmailResult from '@/components/notifications/admin/TestEmailResult';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass } from '@/components/ui/kit';
import { useAuth } from '@/hooks/useAuth';
import { notificationRepository } from '@/repositories/notificationRepository';

import { Field } from './senderShared';

/** Sends a short check email now — or a template version, filled in. */
export function TestEmail({ sender, faultReasons, onClose }) {
  const { user } = useAuth();
  const [to, setTo] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await notificationRepository.sendTestEmail({ emailSenderId: sender.emailSenderId, toAddress: to.trim() }));
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
      title={`Test ${sender.name}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button icon={Send} onClick={send} loading={busy} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())}>Send test</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Send it to">
          <input type="email" value={to} onChange={(e) => setTo(e.target.value)} className={`${controlClass} w-full`} placeholder="me@example.com" />
        </Field>
        {/* This short check email is not kept, so it has no monitor link. */}
        <TestEmailResult result={result} faultReasons={faultReasons} />
        <ErrorNote error={error} compact />
      </div>
    </Modal>
  );
}
