'use client';

import { useState } from 'react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { PRIORITY } from '@/constants/notifications';
import { notificationRepository } from '@/repositories/notificationRepository';
import CategoryField from './CategoryField';

const CODE_PATTERN = /^[A-Z0-9_]+$/;

/** The documented priority keys, for when the lookup cannot be read. */
const FALLBACK_PRIORITIES = [
  { key: PRIORITY.LOW, value: 'Low' },
  { key: PRIORITY.NORMAL, value: 'Normal' },
  { key: PRIORITY.HIGH, value: 'High' },
  { key: PRIORITY.URGENT, value: 'Urgent' },
  { key: PRIORITY.CRITICAL, value: 'Critical' },
];

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className={labelClass} style={{ color: CHROME.textSecondary }}>
        {label}
        {hint && <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px]" style={{ color: STATUS.critical }}>{error}</span>}
    </label>
  );
}

/**
 * Adding or changing a notification type — what it is called, how loud it is,
 * where its link points and which sender its emails use. Its WORDS are edited
 * per channel on the type's own page.
 *
 * @param {{
 *   type: Object|null,  the details of the one being edited, or null to add
 *   categories: string[], priorities: Array, senders: Array|null,
 *   onClose: () => void, onSaved: (result: { notificationTypeId: string }) => void,
 * }} props
 */
export default function TypeFormModal({ type, categories, priorities, senders, onClose, onSaved }) {
  const editing = Boolean(type);
  const [form, setForm] = useState(() => ({
    code: type?.code ?? '',
    englishName: type?.englishName ?? '',
    arabicName: type?.arabicName ?? '',
    description: type?.description ?? '',
    category: type?.category ?? '',
    actionUrlPattern: type?.actionUrlPattern ?? '',
    priorityKey: type?.priorityKey ?? PRIORITY.NORMAL,
    emailSenderId: type?.emailSenderId ?? '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  // Any edit clears a refusal that was about the previous values.
  const set = (patch) => {
    setError(null);
    setForm((prev) => ({ ...prev, ...patch }));
  };

  // The server's own limits, checked as they are typed.
  const problems = {
    code: !form.code.trim() ? 'Needed.'
      : form.code.length > 20 ? 'At most 20 characters.'
        : !CODE_PATTERN.test(form.code) ? 'Capital letters, digits and _ only.' : null,
    englishName: !form.englishName.trim() ? 'Needed.' : form.englishName.length > 100 ? 'At most 100 characters.' : null,
    arabicName: !form.arabicName.trim() ? 'Needed.' : form.arabicName.length > 100 ? 'At most 100 characters.' : null,
    description: form.description.length > 500 ? 'At most 500 characters.' : null,
    category: !form.category.trim() ? 'Needed.' : form.category.length > 50 ? 'At most 50 characters.' : null,
    actionUrlPattern: form.actionUrlPattern.length > 1000 ? 'At most 1000 characters.' : null,
  };
  const invalid = Object.values(problems).some(Boolean);
  const show = (key) => (touched ? problems[key] : null);

  const save = async () => {
    setTouched(true);
    if (invalid) return;
    setBusy(true);
    const fields = {
      code: form.code.trim(),
      englishName: form.englishName.trim(),
      arabicName: form.arabicName.trim(),
      description: form.description.trim() || null,
      category: form.category.trim(),
      actionUrlPattern: form.actionUrlPattern.trim() || null,
      priorityKey: Number(form.priorityKey),
      emailSenderId: form.emailSenderId || null,
    };
    try {
      if (editing) {
        await notificationRepository.updateType(type.notificationTypeId, fields);
        onSaved({ notificationTypeId: type.notificationTypeId });
      } else {
        onSaved(await notificationRepository.addType(fields));
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const priorityOptions = priorities.length ? priorities : FALLBACK_PRIORITIES;

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={editing ? `Edit ${type.englishName}` : 'New notification type'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy}>{editing ? 'Save' : 'Add type'}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Code" hint="— like INV_OVERDUE" error={show('code')}>
          <input
            value={form.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
            maxLength={20}
            className={`${controlClass} w-full font-mono`}
            placeholder="INV_OVERDUE"
          />
        </Field>
        <Field label="Category" hint="— groups types in lists" error={show('category')}>
          <CategoryField value={form.category} categories={categories} onChange={(category) => set({ category })} />
        </Field>
        <Field label="English name" error={show('englishName')}>
          <input value={form.englishName} onChange={(e) => set({ englishName: e.target.value })} maxLength={100} className={`${controlClass} w-full`} placeholder="Invoice overdue" />
        </Field>
        <Field label="Arabic name" error={show('arabicName')}>
          <input dir="rtl" value={form.arabicName} onChange={(e) => set({ arabicName: e.target.value })} maxLength={100} className={`${controlClass} w-full`} placeholder="فاتورة متأخرة" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" hint="— optional, for admins" error={show('description')}>
            <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={2} maxLength={500} className={`${controlClass} w-full resize-y`} />
          </Field>
        </div>
        <Field label="Priority">
          <select value={form.priorityKey} onChange={(e) => set({ priorityKey: Number(e.target.value) })} className={`${controlClass} w-full`}>
            {priorityOptions.map((p) => <option key={p.key} value={p.key}>{p.value}</option>)}
          </select>
        </Field>
        <Field label="Email sender" hint="— empty uses the default">
          {senders ? (
            <select value={form.emailSenderId} onChange={(e) => set({ emailSenderId: e.target.value })} className={`${controlClass} w-full`}>
              <option value="">Default sender</option>
              {senders.map((s) => <option key={s.emailSenderId} value={s.emailSenderId}>{s.name}{s.isDefault ? ' (default)' : ''}</option>)}
            </select>
          ) : (
            <p className="py-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
              {form.emailSenderId ? 'Uses its own sender.' : 'Uses the default sender.'} Seeing the senders needs the Manage permission.
            </p>
          )}
        </Field>
        <div className="sm:col-span-2">
          <Field label="Link" hint="— where a click on the notification goes" error={show('actionUrlPattern')}>
            <input
              value={form.actionUrlPattern}
              onChange={(e) => set({ actionUrlPattern: e.target.value })}
              maxLength={1000}
              className={`${controlClass} w-full font-mono`}
              placeholder="/invoices/{{ InvoiceId }}"
            />
          </Field>
          <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
            A path like <code className="font-mono">/workflow/tasks</code> is put after this app&rsquo;s address; a full
            https:// address is used as it is. Values in <code className="font-mono">{'{{ }}'}</code> are filled in per
            notification and escaped, so a space or slash stays part of the value.
          </p>
        </div>
      </div>
      <div className="mt-3"><ErrorNote error={error} compact /></div>
    </Modal>
  );
}
