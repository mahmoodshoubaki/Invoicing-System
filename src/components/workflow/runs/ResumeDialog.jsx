'use client';

import { useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { valueProblem, variableChangeErrors, variableChanges } from '@/lib/runVariables';
import RunVariablesEditor from './resume/RunVariablesEditor';
import { useRunVariables } from './resume/useRunVariables';

/** The object without one key — the same object when it has none. */
function withoutKey(object, key) {
  if (!(key in object)) return object;
  const next = { ...object };
  delete next[key];
  return next;
}

const controlClass =
  'w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

/**
 * Whether the loop guard is what stopped this run.
 *
 * It matters because a plain resume does not fix it: the lifetime step count is
 * untouched, so the run stands up, walks one step and faults again. The reason
 * text is the only signal — there is no separate flag for it.
 */
export function stoppedByLoopGuard(instance) {
  return /loop|step count|steps in one run|life of this run|too many steps/i.test(
    instance?.failureReason ?? ''
  );
}

/**
 * Putting a faulted run back on its feet.
 *
 * `resetStepCount` is deliberately a SECOND decision inside this dialog rather
 * than a second button beside Resume: it only means anything for a loop-guard
 * fault, and the count is what stops a genuinely runaway workflow — so it is
 * off unless somebody says otherwise, and the run's history records the number
 * it was at when they did.
 *
 * Its values can be corrected first (2026-10-21) — "Edit and resume": the
 * person who has left, the date that was never set. Only what changed is sent,
 * and the run's history records each change. `onConfirm` resolves to
 * `{ errors }` when the server refused a value (WF-058) — nothing was saved and
 * the run did not move — so each is shown under its value.
 *
 * Mounted per opening, so its values are read fresh each time.
 */
export default function ResumeDialog({ instance, detail, loadingDetail, open, busy, onClose, onConfirm }) {
  const [notes, setNotes] = useState('');
  const [resetStepCount, setResetStepCount] = useState(false);
  const vars = useRunVariables(instance?.instanceId);
  const [edits, setEdits] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [otherErrors, setOtherErrors] = useState([]);
  const [checked, setChecked] = useState(false);

  const changes = variableChanges(vars.rows, edits);
  const changeCount = Object.keys(changes).length;
  const badValues = vars.rows.some((r) => r.name in changes && valueProblem(r, edits[r.name]));

  // An edit answers the server's complaint about that value.
  const edit = (name, text) => {
    setEdits((prev) => ({ ...prev, [name]: text }));
    setServerErrors((prev) => withoutKey(prev, name));
  };
  const undo = (name) => {
    setEdits((prev) => withoutKey(prev, name));
    setServerErrors((prev) => withoutKey(prev, name));
  };

  const confirm = async () => {
    setChecked(true);
    if (badValues) return;
    setOtherErrors([]);
    const outcome = await onConfirm({ notes, resetStepCount, variableChanges: changes });
    if (outcome?.errors) {
      const split = variableChangeErrors(outcome.errors);
      setServerErrors(split.byName);
      setOtherErrors(split.other);
    }
  };

  /*
   * The reason comes from the FULL run, not the list row.
   *
   * `GetInstances` is not documented as carrying `failureReason`, and that
   * string is the only thing that says whether the loop guard stopped this run
   * — so deciding off a list row would mean offering the reset blind, or never
   * offering it at all. The caller loads the run before this opens.
   */
  const reason = detail?.failureReason ?? instance?.failureReason ?? null;
  const looping = stoppedByLoopGuard({ failureReason: reason });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reason ? 'Put this run back on its feet' : 'Start this run again'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button icon={RotateCcw} loading={busy} onClick={confirm}>
            {changeCount > 0 ? `Save ${changeCount} change${changeCount === 1 ? '' : 's'} and resume` : 'Resume'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          {instance?.definitionCode} · v{instance?.definitionVersion}
          {instance?.currentStageTitle && ` · ${instance.currentStageTitle}`}
        </p>

        {loadingDetail ? (
          <div className="flex justify-center py-3"><LoadingSpinner /></div>
        ) : reason ? (
          <p
            className="rounded-md px-2 py-1.5 text-[11px] leading-snug"
            style={{ backgroundColor: withAlpha(STATUS.critical, 0.1), color: CHROME.textSecondary }}
          >
            {/* Written to be read by a person — shown exactly as it arrived. */}
            {reason}
          </p>
        ) : null}

        {/*
          Two different runs arrive here since 2026-09-13 and the sentence has
          to fit both: one that GAVE UP, and one somebody stopped on purpose.
          Telling a person who paused a run to "fix whatever it was waiting for"
          would be nonsense — nothing went wrong with it.

          `reason` is the discriminator, and it is reliable: only a faulted run
          has a `failureReason`, because a pause is not a failure.
        */}
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          {reason
            ? 'This clears the retry count so the failed step gets its full allowance again, and moves the run on. Fix whatever it was waiting for first.'
            : 'This picks the run up exactly where it stopped and carries on.'}
        </p>

        <div>
          <p className="text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            Its values
            <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>
              — change one first if the step stopped on it; each change is kept in the run&rsquo;s history
            </span>
          </p>
          <p className="mb-1.5 text-[10px]" style={{ color: CHROME.textMuted }}>
            Empty a box to clear its value. A person is picked from the directory, by name or username.
          </p>
          <RunVariablesEditor
            vars={vars}
            edits={edits}
            onEdit={edit}
            onUndo={undo}
            serverErrors={serverErrors}
            disabled={busy}
          />
          {checked && badValues && (
            <p className="mt-1.5 text-[11px]" style={{ color: STATUS.critical }}>Fix the values marked in red first.</p>
          )}
          {otherErrors.map((message) => (
            <p key={message} className="mt-1.5 text-[11px]" style={{ color: STATUS.critical }}>{message}</p>
          ))}
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            Note
            <span className="ml-1 font-normal" style={{ color: CHROME.textMuted }}>
              — optional, kept in the run&rsquo;s history
            </span>
          </p>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payments API is back up"
            aria-label="Note"
            className={controlClass}
          />
        </div>

        {/*
          Only offered when the loop guard is what stopped it. Anywhere else the
          checkbox would be a switch with no effect, which is worse than absent.
        */}
        {looping && (
          <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor: withAlpha(STATUS.warning, 0.1) }}>
            <p className="mb-1.5 flex items-start gap-1.5 text-[11px] leading-snug" style={{ color: CHROME.textSecondary }}>
              <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
              <span>
                This run was stopped for walking too many steps. Resuming alone will not help — it
                will take one step and stop again.
              </span>
            </p>
            <label className="flex items-start gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={resetStepCount}
                onChange={(e) => setResetStepCount(e.target.checked)}
              />
              <span>
                Start its step count again. <strong>Raise the step ceiling first</strong> — in the
                workflow engine admin page — if the workflow really is this long; resetting under the
                same ceiling just buys the same steps over again. The number it was at is written to
                the run&rsquo;s history.
              </span>
            </label>
          </div>
        )}
      </div>
    </Modal>
  );
}
