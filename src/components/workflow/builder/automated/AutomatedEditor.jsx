'use client';

/** An automated step: the action it calls, how it retries, and the inputs it sends. */

import { memo, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { AUTOMATED_MODE, AUTOMATED_MODE_INFO, DEFAULT_AUTOMATED_MODE, HTTP_CALL_ACTION } from '@/constants/workflow';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

import { AddressInput } from './AddressInput';
import { DescribedInput } from './DescribedInput';
import { HeaderRows } from './HeaderRows';
import { controlClass, Label } from './shared';
import { SimpleInputs } from './SimpleInputs';

/**
 * An `automated` step: pick an action, fill in what that action takes.
 *
 * One palette entry, one step type, one shape on the wire. `action` is a key
 * the engine resolves at run time, so a second action arriving later is another
 * row in this dropdown and its own set of boxes — the step, the save format and
 * the failure modes do not change. That is why the dropdown is here while it
 * still holds a single option.
 */
function AutomatedEditor({ step, actions, approvedHosts, fields, insideParallelBranch, onChange }) {
  const isHttp = step.action === HTTP_CALL_ACTION;
  const chosen = actions.find((a) => a.key === step.action);
  const inputs = step.inputs ?? {};

  // A step that says nothing takes the engine's default, so the picker has to
  // show that rather than showing nothing selected.
  const current = step.mode ?? DEFAULT_AUTOMATED_MODE;

  /*
   * The boxes belong to the action, so switching actions clears the values and
   * redraws from the newly selected one — an input named the same thing in two
   * actions does not mean the same thing.
   *
   * A body is ignored on GET, so it and its content type are not drawn there.
   * That is the only input this component knows anything about by name; every
   * other one is whatever the catalog says.
   */
  const described = useMemo(() => {
    const all = chosen?.inputs ?? [];
    if (!isHttp) return all;
    const method = (inputs.method ?? 'GET').toUpperCase();
    return method === 'GET' ? all.filter((i) => i.name !== 'body' && i.name !== 'contentType') : all;
  }, [chosen, isHttp, inputs.method]);

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <Label>Action</Label>
        <select
          value={step.action ?? ''}
          onChange={(e) => onChange({ action: e.target.value, inputs: {} })}
          className={`${controlClass} w-full`}
        >
          <option value="">Choose an action…</option>
          {actions.map((a) => (
            <option key={a.key} value={a.key}>{a.label}</option>
          ))}
          {/* A saved step calling something the catalog no longer offers stays
              visible rather than silently resetting to nothing. */}
          {step.action && !chosen && (
            <option value={step.action}>{step.action} — no longer available</option>
          )}
        </select>

        {actions.length === 0 && (
          <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
            No actions available. This needs the workflow catalog, which not every role can read.
          </p>
        )}
      </div>

      {chosen?.description && (
        <p className="text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
          {chosen.description}
        </p>
      )}

      {described.length > 0 && (
        <div className="flex flex-col gap-3">
          {described.map((input) =>
            isHttp && input.name === 'url' ? (
              <AddressInput
                key={input.name}
                input={input}
                value={inputs.url}
                fields={fields}
                approvedHosts={approvedHosts}
                onChange={(value) => onChange({ inputs: { ...inputs, url: value } })}
              />
            ) : (
              <DescribedInput
                key={input.name}
                input={input}
                fields={fields}
                value={inputs[input.name]}
                onChange={(value) => onChange({ inputs: { ...inputs, [input.name]: value } })}
              />
            )
          )}
        </div>
      )}

      {/* An action that describes nothing gets the free-text pairs, which is the
          only thing offerable when the shape is unknown. */}
      {step.action && (chosen?.inputs?.length ?? 0) === 0 && (
        <SimpleInputs inputs={inputs} fields={fields} onChange={(next) => onChange({ inputs: next })} />
      )}

      {/* Headers are never in a declared `inputs` — the author names them — so
          they are drawn alongside whatever the catalog described. */}
      {isHttp && (
        <HeaderRows inputs={inputs} fields={fields} onInputsChange={(next) => onChange({ inputs: next })} />
      )}

      <div>
        <Label>If it fails</Label>
        <div className="flex flex-col gap-1">
          {Object.values(AUTOMATED_MODE).map((mode) => {
            const info = AUTOMATED_MODE_INFO[mode];
            const selected = current === mode;
            // A run holds ONE retry slot, so two branches cannot each park on
            // it. Offering the mode here would be offering a save that fails.
            const blocked = insideParallelBranch && mode === AUTOMATED_MODE.QUEUE_AND_RETRY;

            return (
              <button
                key={mode}
                type="button"
                disabled={blocked}
                onClick={() => onChange({ mode })}
                aria-pressed={selected}
                title={blocked ? 'A run has one retry slot, so this cannot go inside a parallel branch.' : undefined}
                className="rounded-lg border p-2 text-left transition-colors disabled:cursor-not-allowed"
                style={{
                  borderColor: selected ? CHROME.textPrimary : '#f1f0ee',
                  backgroundColor: selected ? '#fbfaf9' : 'transparent',
                  opacity: blocked ? 0.45 : 1,
                }}
              >
                <span className="block text-[11px] font-semibold" style={{ color: CHROME.textPrimary }}>
                  {info.label}
                  {mode === DEFAULT_AUTOMATED_MODE && !blocked && (
                    <span
                      className="ml-1.5 rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: withAlpha(STATUS.good, 0.15), color: STATUS.good }}
                    >
                      default
                    </span>
                  )}
                  {blocked && (
                    <span
                      className="ml-1.5 rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: withAlpha(STATUS.warning, 0.15), color: STATUS.warning }}
                    >
                      not in a branch
                    </span>
                  )}
                </span>
                <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>
                  {info.hint}
                </span>
              </button>
            );
          })}
        </div>

        {/*
          The distinction authors get wrong. The first two look different and
          behave the same in the way that matters — the run stops on the failed
          step either way. Only the third walks past work that did not happen.
        */}
        {current === AUTOMATED_MODE.CONTINUE_REGARDLESS && (
          <p
            className="mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
            style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
          >
            <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            <span>
              This is the only mode that carries on after a failure. Later steps will run as though
              this one worked. The other two both stop here — they differ only in whether the engine
              comes back on its own or waits for a person.
            </span>
          </p>
        )}

        {/* Where the failure actually shows up. Not on save — the definition is
            fine; it is the call that fails, later, to somebody else. */}
        {isHttp && (
          <p className="mt-2 text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>
            A call that fails does not stop this from saving. It shows up as a faulted run on the
            monitoring page, with the reason naming an unapproved host, a non-2xx reply, or a
            missing credential.
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(AutomatedEditor);
