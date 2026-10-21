'use client';

import { AlertTriangle, Search } from 'lucide-react';

import Switch from '@/components/ui/Switch';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { LABEL_MAX } from '@/lib/fieldSettingsDraft';

/** Grey text beside a locked switch: why it is locked. */
function Reason({ text }) {
  return <span className="text-[11px] leading-snug" style={{ color: CHROME.textMuted }}>{text}</span>;
}

/**
 * The Workflow fields table's columns (2026-10-13), for the shared Table: what
 * the builder calls a field, whether it shows there, whether it can hold a
 * person a task is given to, and whether a task can fill it. A field's name
 * never changes — saved workflows hold it — so it is shown, not edited.
 *
 * A switch the server locks says why beside it (`cannotBePersonReason`,
 * `cannotFillReason`). `historyWarning` is only a warning: the switch stays
 * open.
 *
 * @param {{
 *   canEdit: boolean, onEdit: (name: string, patch: Object) => void,
 *   changedNames: Set<string>, problemOf: (name: string) => string|null,
 * }} options
 */
export function fieldSettingColumns({ canEdit, onEdit, changedNames, problemOf }) {
  return [
    {
      key: 'label',
      label: 'Field',
      width: '38%',
      sortable: false,
      render: (_, row) => {
        const problem = problemOf(row.name);
        return (
          <div>
            <input
              value={row.label}
              onChange={(e) => onEdit(row.name, { label: e.target.value })}
              disabled={!canEdit}
              maxLength={LABEL_MAX + 20}
              aria-label={`Label of ${row.name}`}
              aria-invalid={Boolean(problem)}
              className={`${controlClass} w-full`}
              style={problem ? { borderColor: STATUS.critical } : undefined}
            />
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <code className="font-mono text-[10px]" style={{ color: CHROME.textMuted }}>{row.name}</code>
              <span className="text-[10px]" style={{ color: CHROME.textMuted }}>· {row.typeKey}</span>
              {row.filterable && (
                <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: CHROME.textMuted }} title="Can be used in a schedule's filter and in Find records">
                  <Search size={9} aria-hidden="true" />
                  searchable
                </span>
              )}
              {changedNames.has(row.name) && (
                <span
                  className="rounded-full px-1.5 py-px text-[10px] font-medium"
                  style={{ backgroundColor: withAlpha(STATUS.info, 0.12), color: STATUS.info }}
                >
                  changed
                </span>
              )}
            </div>
            {problem && <p className="mt-1 text-[11px]" style={{ color: STATUS.critical }}>{problem}</p>}
          </div>
        );
      },
    },
    {
      key: 'isOn',
      label: 'Shown',
      width: '12%',
      sortable: false,
      render: (_, row) => (
        <Switch
          checked={row.isOn}
          onChange={(isOn) => onEdit(row.name, { isOn })}
          disabled={!canEdit}
          label={`Show ${row.label} in the builder`}
          title={row.isOn ? 'Shown in the builder' : 'Hidden from the builder — workflows already using it keep working'}
        />
      ),
    },
    {
      key: 'isUser',
      label: 'A person',
      width: '20%',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 shrink-0"
            checked={row.isUser}
            onChange={(e) => onEdit(row.name, { isUser: e.target.checked })}
            disabled={!canEdit || Boolean(row.cannotBePersonReason)}
            aria-label={`${row.label} holds a person`}
            title="A task can be assigned to the person this field holds"
          />
          {row.cannotBePersonReason && <Reason text={row.cannotBePersonReason} />}
        </div>
      ),
    },
    {
      key: 'fillable',
      label: 'A task can fill it',
      width: '30%',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-start gap-2">
          <Switch
            checked={row.fillable}
            onChange={(fillable) => onEdit(row.name, { fillable })}
            disabled={!canEdit || Boolean(row.cannotFillReason)}
            label={`A task can fill ${row.label}`}
          />
          {row.cannotFillReason ? (
            <Reason text={row.cannotFillReason} />
          ) : row.historyWarning ? (
            <span className="flex items-start gap-1 text-[11px] leading-snug" style={{ color: STATUS.warning }}>
              <AlertTriangle size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
              {row.historyWarning}
            </span>
          ) : null}
        </div>
      ),
    },
  ];
}
