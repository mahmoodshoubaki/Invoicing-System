'use client';

import { memo } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { PICKED_TARGETS_LIST, VARIABLE_TYPE, VARIABLE_TYPE_LABELS } from '@/constants/workflow';
import { createVariable } from '@/models/workflow';
import { defaultValueErrors, emptyForType } from '@/lib/workflowBuilderState';
import { slugify } from '@/utils/slug';
import UserPicker from './UserPicker';

const TYPE_OPTIONS = Object.values(VARIABLE_TYPE);

const NO_IDS = [];

const DefaultValueRow = memo(function DefaultValueRow({ variable, resolvedById, onChange }) {
  const problems = defaultValueErrors(variable);
  const empty = emptyForType(variable.type);
  const person = variable.type === VARIABLE_TYPE.USER;

  return (
    <div className="mt-1.5">
      <div className={`flex gap-2 ${person ? 'items-start' : 'items-center'}`}>
        <span className={`shrink-0 text-[11px] ${person ? 'pt-1.5' : ''}`} style={{ color: CHROME.textMuted }}>
          Starts as
        </span>
        {person ? (
          <div className="min-w-0 flex-1">
            <UserPicker
              single
              selectedIds={variable.defaultValue ? [variable.defaultValue] : NO_IDS}
              resolvedById={resolvedById}
              onChange={(ids) => onChange(ids[0] ?? null)}
              placeholder="Nobody — or search for a person…"
            />
          </div>
        ) : (
          <input
            value={variable.defaultValue ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
            placeholder={empty}
            aria-label="Default value"
            className="min-w-0 flex-1 rounded-md border px-2 py-1 font-mono text-xs outline-none focus:border-primary"
            style={{ borderColor: problems.length > 0 ? STATUS.critical : '#e5e7eb' }}
          />
        )}
      </div>
      {problems.length > 0 && (
        <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>
          {problems[0].replace(/^"[^"]*" /, '')}
        </p>
      )}
    </div>
  );
});

function VariablesPanel({ variables, dispatch, actions, resolvedById }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
          Variables
        </p>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: actions.ADD_VARIABLE,
              variable: createVariable({ name: '', type: VARIABLE_TYPE.TEXT }),
            })
          }
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-[#f1f0ee]"
          style={{ color: CHROME.textSecondary }}
        >
          <Plus size={12} aria-hidden="true" />
          Add
        </button>
      </div>

      {variables.length === 0 ? (
        <p className="rounded-lg bg-[#fbfaf9] px-3 py-2.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          None. Add one to collect a value when a run starts, or to hold something its conditions read.
        </p>
      ) : (
        <ul className="flex flex-col gap-2" data-motion>
          {variables.map((variable, index) => (
            <li key={index} className="rounded-lg border border-[#f1f0ee] p-2.5">
              <div className="flex items-center gap-2">
                <input
                  value={variable.name}
                  onChange={(e) =>
                    dispatch({
                      type: actions.UPDATE_VARIABLE,
                      index,
                      patch: { name: slugify(e.target.value).replace(/-/g, '') },
                    })
                  }
                  placeholder="name"
                  aria-label="Variable name"
                  className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 font-mono text-xs outline-none focus:border-primary"
                />

                <select
                  value={variable.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    const crossesPerson = (type === VARIABLE_TYPE.USER) !== (variable.type === VARIABLE_TYPE.USER);
                    dispatch({
                      type: actions.UPDATE_VARIABLE,
                      index,
                      patch: crossesPerson ? { type, defaultValue: null } : { type },
                    });
                  }}
                  aria-label="Variable type"
                  className="shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{VARIABLE_TYPE_LABELS[t] ?? t}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => dispatch({ type: actions.REMOVE_VARIABLE, index })}
                  aria-label="Remove variable"
                  className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-[#f1f0ee]"
                  style={{ color: STATUS.critical }}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>

              {variable.name === PICKED_TARGETS_LIST && (
                <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>
                  &ldquo;{PICKED_TARGETS_LIST}&rdquo; is filled in by the engine with the records a run was
                  started on. Pick another name.
                </p>
              )}

              <div className="mt-1.5 flex items-center gap-2">
                <input
                  value={variable.label ?? ''}
                  onChange={(e) => dispatch({ type: actions.UPDATE_VARIABLE, index, patch: { label: e.target.value } })}
                  placeholder="Label shown to people"
                  aria-label="Variable label"
                  className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary"
                />
                <label className="flex shrink-0 items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
                  <input
                    type="checkbox"
                    checked={variable.required === true}
                    onChange={(e) => dispatch({ type: actions.UPDATE_VARIABLE, index, patch: { required: e.target.checked } })}
                  />
                  Required
                </label>
              </div>

              <DefaultValueRow
                variable={variable}
                resolvedById={resolvedById}
                onChange={(defaultValue) =>
                  dispatch({ type: actions.UPDATE_VARIABLE, index, patch: { defaultValue } })
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default memo(VariablesPanel);
