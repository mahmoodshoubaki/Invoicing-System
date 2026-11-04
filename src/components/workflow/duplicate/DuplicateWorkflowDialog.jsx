'use client';

import { useState } from 'react';
import { AlertTriangle, Copy } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { WORKFLOW_NAME_MAX, copyName } from '@/lib/workflowDuplicate';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * Names the copy of a workflow and says what a copy is: a draft until it is
 * published, on the same trigger as the original.
 *
 * @param {{
 *   workflow: Object, version: number|null, busy: boolean, error: string|null,
 *   onClose: () => void, onConfirm: (name: string) => void,
 * }} props
 */
export default function DuplicateWorkflowDialog({ workflow, version, busy, error, onClose, onConfirm }) {
  const [name, setName] = useState(() => copyName(workflow.name));
  const trimmed = name.trim();

  return (
    <Modal
      open
      onClose={onClose}
      title={`Duplicate ${workflow.name}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button icon={Copy} onClick={() => onConfirm(trimmed)} loading={busy} disabled={!trimmed}>
            Duplicate
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          {version != null
            ? `Copies version ${version} of ${workflow.code}.`
            : `Copies ${workflow.code} — its draft, or else its live version, or else its newest.`}
          {' '}The original stays as it is.
        </p>

        <div>
          <label htmlFor="duplicate-name" className="mb-1 block text-xs font-medium" style={{ color: CHROME.textSecondary }}>
            Name of the copy
          </label>
          <input
            id="duplicate-name"
            autoFocus
            value={name}
            maxLength={WORKFLOW_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-[#e4e2e2] bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <ul className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: withAlpha(STATUS.warning, 0.08), color: CHROME.textSecondary }}>
          <li className="flex items-start gap-1.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            The copy is a draft. It cannot run until it is published.
          </li>
          <li className="flex items-start gap-1.5">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            It starts on the same trigger. If both are live, both start on the same event — change the
            copy&rsquo;s trigger, or turn one off, before making it live.
          </li>
        </ul>

        {error && <p role="alert" className="text-xs" style={{ color: STATUS.critical }}>{error}</p>}
      </div>
    </Modal>
  );
}
