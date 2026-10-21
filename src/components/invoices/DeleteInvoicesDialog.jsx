'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { invoiceRepository } from '@/repositories/invoiceRepository';

/**
 * Deleting one or several invoices, with the consequences said first.
 *
 * All or nothing on the server: if any one cannot go, none does and the
 * message names each — so a refusal is shown inside the dialog, beside the
 * list it is about, rather than in a toast that disappears.
 *
 * @param {{
 *   open: boolean,
 *   invoices: Array<{ id: string, invoiceNumber?: string }>,
 *   onClose: () => void,
 *   onDeleted: (deletedIds: string[]) => void,
 * }} props
 */
export default function DeleteInvoicesDialog({ open, invoices, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const count = invoices.length;
  const names = invoices.map((i) => i.invoiceNumber || 'an invoice with no number yet');

  const close = () => {
    if (busy) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const deleted = await invoiceRepository.deleteInvoices(invoices.map((i) => i.id));
      onDeleted(deleted);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={count === 1 ? 'Delete this invoice?' : `Delete ${count} invoices?`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={busy}>Keep {count === 1 ? 'it' : 'them'}</Button>
          <Button variant="danger" icon={Trash2} onClick={confirm} loading={busy} disabled={count === 0}>
            Delete
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <ul className="flex flex-wrap gap-1.5">
          {names.slice(0, 12).map((name, i) => (
            <li
              // Numbers can repeat across projects; position keeps the key unique.
              key={`${name}-${i}`}
              className="rounded-md px-2 py-0.5 font-mono text-[11px]"
              style={{ backgroundColor: '#f6f5f3', color: CHROME.textPrimary }}
            >
              {name}
            </li>
          ))}
          {names.length > 12 && (
            <li className="px-1 text-[11px]" style={{ color: CHROME.textMuted }}>and {names.length - 12} more</li>
          )}
        </ul>

        <p
          className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
          style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          <span>
            {count === 1 ? 'It disappears' : 'They disappear'} from every list and screen, and any workflow
            running on {count === 1 ? 'it' : 'them'} is cancelled. An In Progress invoice also stops blocking
            edits to the BOQ items it bills.
          </span>
        </p>

        <ErrorNote error={error} compact />
      </div>
    </Modal>
  );
}
