'use client';

import { memo } from 'react';
import { AlertTriangle, Link2, Trash2 } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { controlClass, Label, Note } from './containers/shared';

/** Adds a field, and the fields it has to be asked with that are not asked for yet. */
function withPartners(asked, name, catalog) {
  const next = [...asked, { name, required: true }];
  for (const partner of catalog.find((f) => f.name === name)?.mustBeAskedWith ?? []) {
    if (!next.some((a) => a.name === partner)) next.push({ name: partner, required: true });
  }
  return next;
}

/**
 * What a human task's holder fills in on the record (2026-10-11) — the task's
 * Fields tab. Think of a shared file: everyone can read the record, but only
 * whoever holds the task writes, and only in the boxes named here.
 *
 * Offered: the record's fields a task can fill, from Workflow fields (an admin
 * page, 2026-10-13) — an invoicing plan included, which conditions never see.
 * Some go together: a BOQ item's billing frequency or expected date brings its
 * invoicing plan along, added here the moment either is picked.
 *
 * A field asked for here that is no longer on the list — switched Off — keeps
 * working, so it is shown by its name and nothing more.
 *
 * @param {{ step: Object, fields: Array, taskFields: Array|null, onChange: (patch: Object) => void }} props
 */
function TaskFieldsPanel({ step, fields, taskFields, onChange }) {
  const asked = step.fields ?? [];
  const outcomes = step.outcomes ?? [];
  const catalog = taskFields ?? (fields ?? []).filter((f) => (f.source ?? 'record') === 'record');
  const fillable = catalog.filter((f) => f.fillable);
  const unused = fillable.filter((f) => !asked.some((a) => a.name === f.name));
  // Marked on a hand-started workflow's record fields: a run on several records
  // has no single one to save to (WF-056).
  const manyRecordsPossible = (fields ?? []).some((f) => f.emptyOnManyTargets);

  const setFields = (next) => onChange({ fields: next });
  const patchField = (index, patch) => setFields(asked.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  const setSaves = (index, requiresFields) =>
    onChange({ outcomes: outcomes.map((o, i) => (i === index ? { ...o, requiresFields } : o)) });
  const labelOf = (name) => catalog.find((f) => f.name === name)?.label ?? name;

  if (catalog.length === 0 && asked.length === 0) {
    return (
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        This workflow tracks no record, or its fields have not loaded — so there is nothing for a task to fill.
      </p>
    );
  }

  const nobodySaves = asked.length > 0 && !outcomes.some((o) => o.requiresFields);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] leading-relaxed" style={{ color: CHROME.textMuted }}>
        What whoever holds this task fills in. Everyone who can see the record sees these; only the task&rsquo;s holder
        can change them, and only with a button that saves them.
      </p>

      <div>
        <Label>Fields to fill</Label>
        {asked.length === 0 ? (
          // Pointing at the dropdown below: "None" on its own read as "none can be added".
          <p className="rounded-md border border-dashed px-2.5 py-2 text-[11px]" style={{ borderColor: '#e1e0d9', color: CHROME.textMuted }}>
            {unused.length > 0
              ? 'No fields yet — pick one below to have whoever holds this task fill it in.'
              : 'None, and this record has no fields a task can fill.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5" data-motion>
            {asked.map((entry, index) => {
              const field = catalog.find((f) => f.name === entry.name);
              const cannotFill = field && !field.fillable;
              // The fields this one has to be asked with, and the ones that need it.
              const partners = field?.mustBeAskedWith ?? [];
              const missing = partners.filter((p) => !asked.some((a) => a.name === p));
              const neededBy = asked
                .map((a) => catalog.find((f) => f.name === a.name))
                .filter((f) => f?.mustBeAskedWith?.includes(entry.name))
                .map((f) => f.label);
              return (
                <li
                  key={`${entry.name}-${index}`}
                  className="flex items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5"
                  style={{ borderColor: cannotFill || missing.length ? withAlpha(STATUS.critical, 0.4) : '#f1f0ee' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" style={{ color: CHROME.textPrimary }}>
                      {field?.label ?? entry.name}
                    </p>
                    <p className="truncate font-mono text-[10px]" style={{ color: cannotFill || missing.length ? STATUS.critical : CHROME.textMuted }}>
                      {entry.name}
                      {!field ? ' — not on the field list now; it still works' : ''}
                      {cannotFill ? ' — a task cannot fill this one' : ''}
                      {missing.length ? ` — needs ${missing.map(labelOf).join(', ')} too` : ''}
                    </p>
                    {neededBy.length > 0 && (
                      <p className="flex items-center gap-1 truncate text-[10px]" style={{ color: CHROME.textMuted }}>
                        <Link2 size={10} aria-hidden="true" />
                        asked with {neededBy.join(', ')}
                      </p>
                    )}
                  </div>
                  <label className="flex shrink-0 items-center gap-1 text-[11px]" style={{ color: CHROME.textSecondary }}>
                    <input
                      type="checkbox"
                      checked={entry.required === true}
                      onChange={(e) => patchField(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => setFields(asked.filter((_, i) => i !== index))}
                    aria-label={`Stop asking for ${field?.label ?? entry.name}`}
                    title="Remove"
                    className="shrink-0 rounded-md p-1 transition-colors hover:bg-[#f1f0ee]"
                    style={{ color: CHROME.textMuted }}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {unused.length > 0 && (
          <select
            value=""
            onChange={(e) => e.target.value && setFields(withPartners(asked, e.target.value, catalog))}
            aria-label="Add a field to fill"
            className={`${controlClass} mt-1.5 w-full`}
          >
            <option value="">Add a field to fill…</option>
            {unused.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
                {f.mustBeAskedWith?.length ? ` (with ${f.mustBeAskedWith.map(labelOf).join(', ')})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {asked.length > 0 && (
        <div>
          <Label hint="— the required fields must be filled to press these">Saved when they press</Label>
          {outcomes.length === 0 ? (
            <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Add buttons on the Task tab first.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {outcomes.map((outcome, index) => (
                <label key={outcome.key || index} className="flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={outcome.requiresFields === true}
                    onChange={(e) => setSaves(index, e.target.checked)}
                  />
                  {outcome.label || outcome.key || 'Unnamed button'}
                  {!outcome.requiresFields && (
                    <span style={{ color: CHROME.textMuted }}>— saves nothing</span>
                  )}
                </label>
              ))}
            </div>
          )}
          {nobodySaves && outcomes.length > 0 && (
            <p
              className="mt-2 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]"
              style={{ backgroundColor: withAlpha(STATUS.critical, 0.08), color: STATUS.critical }}
            >
              <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
              No button saves these fields, so nothing typed would ever be kept. Tick at least one.
            </p>
          )}
        </div>
      )}

      {asked.length > 0 && manyRecordsPossible && (
        <Note tone={STATUS.warning} icon={AlertTriangle}>
          This workflow is started by hand, so a run can be about several records — and then there is no single one to
          save to, and its buttons that save fields are refused. Start runs of it on one record at a time.
        </Note>
      )}
    </div>
  );
}

export default memo(TaskFieldsPanel);
