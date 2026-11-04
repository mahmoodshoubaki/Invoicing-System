'use client';

import { useState } from 'react';
import { AlertTriangle, Copy } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { controlClass, labelClass } from '@/components/ui/kit';
import {
  TYPE_CODE_MAX, TYPE_NAME_MAX, copyArabicName, copyCode, copyEnglishName, copyProblems,
} from '@/lib/notificationTypeDuplicate';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass} style={{ color: CHROME.textSecondary }}>{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{error}</p>}
    </div>
  );
}

/**
 * @param {{ type: Object, step: string|null, error: string|null, onClose: () => void, onConfirm: (names: { code: string, englishName: string, arabicName: string }) => void, }} props
 */
export default function DuplicateTypeDialog({ type, step, error, onClose, onConfirm }) {
  const [form, setForm] = useState(() => ({
    code: copyCode(type.code),
    englishName: copyEnglishName(type.englishName),
    arabicName: copyArabicName(type.arabicName),
  }));
  const [touched, setTouched] = useState(false);
  const busy = step !== null;
  const problems = copyProblems(form);
  const shown = (key) => (touched ? problems[key] : null);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: key === 'code' ? e.target.value.toUpperCase() : e.target.value }));

  const confirm = () => {
    setTouched(true);
    if (Object.values(problems).some(Boolean)) return;
    onConfirm(form);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Duplicate ${type.englishName}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button icon={Copy} onClick={confirm} loading={busy}>Duplicate</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          Copies <code className="font-mono">{type.code}</code> with its words on every channel — the live version, or
          else the newest. The original stays as it is.
        </p>

        <Field id="dup-type-code" label="Code" error={shown('code')}>
          <input id="dup-type-code" value={form.code} onChange={set('code')} maxLength={TYPE_CODE_MAX} disabled={busy} className={`${controlClass} w-full font-mono`} />
        </Field>
        <Field id="dup-type-en" label="English name" error={shown('englishName')}>
          <input id="dup-type-en" value={form.englishName} onChange={set('englishName')} maxLength={TYPE_NAME_MAX} disabled={busy} className={`${controlClass} w-full`} />
        </Field>
        <Field id="dup-type-ar" label="Arabic name" error={shown('arabicName')}>
          <input id="dup-type-ar" dir="rtl" value={form.arabicName} onChange={set('arabicName')} maxLength={TYPE_NAME_MAX} disabled={busy} className={`${controlClass} w-full`} />
        </Field>

        <ul className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.warning, 0.08), color: CHROME.textSecondary }}>
          <li className="flex items-start gap-1.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            The copy is paused, and its words are saved as drafts, not published.
          </li>
          <li className="flex items-start gap-1.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            It sends nothing until its words are published and it is resumed.
          </li>
        </ul>

        {step && <p className="text-xs" style={{ color: CHROME.textMuted }}>{step}</p>}
        {error && <p role="alert" className="text-xs" style={{ color: STATUS.critical }}>{error}</p>}
      </div>
    </Modal>
  );
}
