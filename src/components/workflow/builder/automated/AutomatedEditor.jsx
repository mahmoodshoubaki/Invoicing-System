'use client';

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

function AutomatedEditor({ step, actions, approvedHosts, fields, insideParallelBranch, onChange }) {
  const isHttp = step.action === HTTP_CALL_ACTION;
  const chosen = actions.find((a) => a.key === step.action);
  const inputs = step.inputs ?? {};

  const current = step.mode ?? DEFAULT_AUTOMATED_MODE;

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

      {step.action && (chosen?.inputs?.length ?? 0) === 0 && (
        <SimpleInputs inputs={inputs} fields={fields} onChange={(next) => onChange({ inputs: next })} />
      )}

      {isHttp && (
        <HeaderRows inputs={inputs} fields={fields} onInputsChange={(next) => onChange({ inputs: next })} />
      )}

      <div>
        <Label>If it fails</Label>
        <div className="flex flex-col gap-1">
          {Object.values(AUTOMATED_MODE).map((mode) => {
            const info = AUTOMATED_MODE_INFO[mode];
            const selected = current === mode;
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
