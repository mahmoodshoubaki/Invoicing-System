'use client';

/** Adding or changing an email sender — SMTP or Amazon SES. */

import { useState } from 'react';

import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass } from '@/components/ui/kit';
import { EMAIL_PROVIDER } from '@/constants/notifications';
import { notificationRepository } from '@/repositories/notificationRepository';
import { CHROME } from '@/theme/vizPalette';

import { BLANK_SES, BLANK_SMTP, Field } from './senderShared';
import SesFields from './SesFields';
import SmtpFields from './SmtpFields';

/**
 * Adding or changing a sender. Passwords and secret keys are never shown and
 * never kept between saves, so the form asks for them every time — an empty
 * box with a hint, not a row of dots pretending to hold something.
 */
export function SenderForm({ sender, securityModes, onClose, onSaved }) {
  const editing = Boolean(sender);
  const [provider, setProvider] = useState(sender?.providerKey ?? EMAIL_PROVIDER.SMTP);
  const [form, setForm] = useState(() => {
    if (!sender) return provider === EMAIL_PROVIDER.SES ? BLANK_SES : BLANK_SMTP;
    const common = { name: sender.name, fromAddress: sender.fromAddress, fromName: sender.fromName };
    return sender.providerKey === EMAIL_PROVIDER.SES
      ? { ...BLANK_SES, ...common, region: sender.ses?.region ?? '', accessKeyId: sender.ses?.accessKeyId ?? '', configurationSet: sender.ses?.configurationSet ?? '' }
      : { ...BLANK_SMTP, ...common, host: sender.smtp?.host ?? '', port: sender.smtp?.port ?? 587, securityKey: sender.smtp?.securityKey ?? 4, userName: sender.smtp?.userName ?? '' };
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const smtp = provider === EMAIL_PROVIDER.SMTP;

  const switchProvider = (next) => {
    setProvider(next);
    const common = { name: form.name, fromAddress: form.fromAddress, fromName: form.fromName };
    setForm({ ...(next === EMAIL_PROVIDER.SES ? BLANK_SES : BLANK_SMTP), ...common });
  };

  // What the server would refuse, said before the click.
  const missing = [
    !form.name.trim() && 'a name',
    !form.fromAddress.trim() && 'a from address',
    smtp && !form.host.trim() && 'a host',
    smtp && !(Number(form.port) > 0) && 'a port',
    smtp && form.userName.trim() && !form.password && 'the password (it is never kept)',
    !smtp && !form.region.trim() && 'a region',
    !smtp && !form.accessKeyId.trim() && 'an access key id',
    !smtp && !form.secretAccessKey && 'the secret access key (it is never kept)',
  ].filter(Boolean);

  const save = async () => {
    setBusy(true);
    setError(null);
    const fields = smtp
      ? {
          name: form.name.trim(), fromAddress: form.fromAddress.trim(), fromName: form.fromName.trim(),
          host: form.host.trim(), port: Number(form.port), securityKey: Number(form.securityKey),
          userName: form.userName.trim() || null, password: form.password || null,
        }
      : {
          name: form.name.trim(), fromAddress: form.fromAddress.trim(), fromName: form.fromName.trim(),
          region: form.region.trim(), accessKeyId: form.accessKeyId.trim(), secretAccessKey: form.secretAccessKey,
          configurationSet: form.configurationSet.trim() || null,
        };
    try {
      if (editing) {
        await (smtp
          ? notificationRepository.updateSmtpSender(sender.emailSenderId, fields)
          : notificationRepository.updateSesSender(sender.emailSenderId, fields));
      } else {
        await (smtp ? notificationRepository.addSmtpSender(fields) : notificationRepository.addSesSender(fields));
      }
      onSaved(editing ? 'Sender saved' : 'Sender added');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={editing ? `Edit ${sender.name}` : 'Add an email sender'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy} disabled={missing.length > 0}>{editing ? 'Save' : 'Add sender'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {!editing && (
          <div className="flex gap-1.5">
            {[{ key: EMAIL_PROVIDER.SMTP, label: 'SMTP' }, { key: EMAIL_PROVIDER.SES, label: 'Amazon SES' }].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => switchProvider(p.key)}
                aria-pressed={provider === p.key}
                className="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  borderColor: provider === p.key ? CHROME.textPrimary : '#eceae4',
                  backgroundColor: provider === p.key ? '#fbfaf9' : 'transparent',
                  color: CHROME.textPrimary,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <Field label="Name" hint="— how admins tell senders apart">
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={`${controlClass} w-full`} placeholder="Office 365" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="From address">
            <input type="email" value={form.fromAddress} onChange={(e) => set({ fromAddress: e.target.value })} className={`${controlClass} w-full`} placeholder="noreply@example.com" />
          </Field>
          <Field label="From name">
            <input value={form.fromName} onChange={(e) => set({ fromName: e.target.value })} className={`${controlClass} w-full`} placeholder="Invoicing" />
          </Field>
        </div>

        {smtp
          ? <SmtpFields form={form} set={set} editing={editing} securityModes={securityModes} />
          : <SesFields form={form} set={set} editing={editing} />}

        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          Passwords and secret keys are stored encrypted and never shown again, so they are asked for on every
          save. Saving also sends this sender&rsquo;s stuck (faulted) emails again.
        </p>
        {missing.length > 0 && (
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Still needed: {missing.join(', ')}.</p>
        )}
        <ErrorNote error={error} compact />
      </div>
    </Modal>
  );
}
