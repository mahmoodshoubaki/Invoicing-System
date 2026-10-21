'use client';

import { memo, useRef } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { VARIABLE_TYPE } from '@/constants/workflow';
import { writeName } from '@/utils/workflowPlaceholder';
import TokenPicker from './TokenPicker';

const controlClass =
  'rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary';

/** What the value has to parse to, said in the author's words. */
const TYPE_HINT = {
  [VARIABLE_TYPE.NUMBER]: 'a number',
  [VARIABLE_TYPE.BOOLEAN]: 'true or false',
  [VARIABLE_TYPE.DATE]: 'a date',
  [VARIABLE_TYPE.LIST]: 'a list, written as ["a","b"]',
  [VARIABLE_TYPE.TEXT]: 'any text',
  // A person variable holds a user id, but this step takes a username too and
  // turns it into the person's id (2026-10-20) — like the BDM's from EPM.
  [VARIABLE_TYPE.USER]: 'a person — a user id or a username, or a person field such as {{submittedBy}} or {{bdmUsername}}',
};

/**
 * Writes one value into a declared variable.
 *
 * The variable is PICKED, never typed. The server matches the name exactly and
 * case-sensitively, so `Total` against a declared `total` is a save-time
 * refusal (WF-040) for what looks to the author like the right word. A dropdown
 * of what actually exists makes that class of mistake unreachable.
 *
 * The value is a template resolved the same way a condition's value is, so a
 * literal is just a template with no placeholders. Deliberately not an
 * expression language — there is no arithmetic and no concatenation, and the
 * help text says so rather than letting somebody discover it at run time.
 */
function SetVariableEditor({ step, ctx, insideParallelBranch, onChange }) {
  const valueRef = useRef(null);

  const declared = ctx.declaredVariables ?? [];
  const chosen = declared.find((v) => v.name === step.name);
  const missing = Boolean(step.name) && !chosen;
  // A person variable can be set from any field holding a person — the record's,
  // a loop item's (a project found by a query step), or another person variable.
  const personFields = chosen?.type === VARIABLE_TYPE.USER
    ? (ctx.fields ?? []).filter((f) => f.isUser && f.name !== step.name)
    : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="pb-2 text-[11px]" style={{ color: CHROME.textMuted }}>Set</span>

        <div className="min-w-40 flex-1">
          <select
            value={step.name ?? ''}
            onChange={(e) => onChange({ name: e.target.value })}
            aria-label="Variable to set"
            className={`${controlClass} w-full`}
            style={missing ? { borderColor: STATUS.critical } : undefined}
          >
            <option value="">Choose a variable…</option>
            {declared.map((v) => (
              <option key={v.name} value={v.name}>
                {v.label || v.name}
                {v.source === 'trigger' ? ' — from the start form' : ''}
              </option>
            ))}
            {/* A saved step naming a variable that has since been renamed or
                deleted stays visible rather than silently resetting. */}
            {missing && <option value={step.name}>{step.name} — no longer declared</option>}
          </select>
        </div>

        <span className="pb-2 text-[11px]" style={{ color: CHROME.textMuted }}>to</span>

        <div className="min-w-48 flex-[2]">
          <div className="flex items-start gap-1.5">
            <input
              ref={valueRef}
              value={step.value ?? ''}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder={chosen ? TYPE_HINT[chosen.type] ?? 'a value' : 'a value'}
              aria-label="Value to write"
              className={`${controlClass} min-w-0 flex-1 font-mono`}
            />
            <TokenPicker
              fields={ctx.fields}
              inputRef={valueRef}
              value={step.value ?? ''}
              onInsert={(value) => onChange({ value })}
            />
          </div>
        </div>
      </div>

      {declared.length === 0 && (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          No variables declared yet — add one in the Variables panel, or a field on the start form.
        </p>
      )}

      {personFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px]" style={{ color: CHROME.textMuted }}>From a person field</span>
          <select
            value={personFields.some((f) => writeName(f.name) === step.value) ? step.value : ''}
            onChange={(e) => e.target.value && onChange({ value: e.target.value })}
            aria-label="Set from a person field"
            className={`${controlClass} min-w-48`}
          >
            <option value="">Choose a field…</option>
            {personFields.map((f) => (
              <option key={f.name} value={writeName(f.name)}>
                {f.label || f.name}{f.source === 'item' ? ' — loop item' : f.source === 'variable' ? ' — variable' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {chosen && (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          Must end up as <strong>{TYPE_HINT[chosen.type] ?? 'a value'}</strong>. Leave it empty to clear the
          variable — that is a real setting, not a missing one.
        </p>
      )}

      {/*
        Two branches writing the same variable in one pass resolve
        last-writer-wins in cursor order. That is a rule nobody guesses, and the
        symptom — a value that is right most of the time — is miserable to
        debug, so it is stated where the mistake would be made.
      */}
      {insideParallelBranch && (
        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
          <span>
            Inside a parallel block. If another branch writes this same variable in the same pass, the
            last one the engine reaches wins — so do not rely on the order.
          </span>
        </p>
      )}

      <p
        className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
        style={{ backgroundColor: '#fbfaf9', color: CHROME.textSecondary }}
      >
        <Info size={11} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <span>
          One value in, one value out. There is no arithmetic here —{' '}
          <code className="font-mono">{'{{a}} + {{b}}'}</code> is not supported.
        </span>
      </p>
    </div>
  );
}

export default memo(SetVariableEditor);
