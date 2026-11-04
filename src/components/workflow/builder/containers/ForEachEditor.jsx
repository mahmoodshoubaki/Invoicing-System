'use client';

import { memo, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

import { PICKED_TARGETS_LIST, TARGET_TYPE, TARGET_TYPE_LABELS } from '@/constants/workflow';
import { ITEM_TARGET_ID } from '@/lib/workflowBuilderState';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { slugify } from '@/utils/slug';

import { loopItemFields } from './loopContext';
import { controlClass, EMPTY_LISTS, Note } from './shared';

function defaultItemName(list) {
  const label = TARGET_TYPE_LABELS[list?.targetTypeKey];
  const base = slugify(label ?? '').replace(/-/g, '');
  return base && base !== 'none' ? base : 'item';
}

export const ForEachEditor = memo(function ForEachEditor({ step, ctx, onChange }) {
  const lists = ctx.lists ?? EMPTY_LISTS;
  const list = lists.find((l) => l.name === step.source);

  const bound = useMemo(() => loopItemFields(step, ctx), [step, ctx]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <span className="pb-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>For each</span>

        <div className="w-32">
          <input
            value={step.itemName ?? ''}
            onChange={(e) => onChange({ itemName: slugify(e.target.value).replace(/-/g, '') })}
            placeholder={defaultItemName(list)}
            aria-label="Name for one item"
            title="What the steps below call one item — used as invoice.totalAmount and so on."
            className={`${controlClass} w-full font-mono`}
          />
        </div>

        <span className="pb-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>in</span>

        <div className="min-w-40 flex-1">
          <select
            value={step.source ?? ''}
            onChange={(e) => {
              const next = lists.find((l) => l.name === e.target.value);
              onChange({
                source: e.target.value,
                ...(step.itemName ? {} : { itemName: defaultItemName(next) }),
              });
            }}
            aria-label="List to walk"
            className={`${controlClass} w-full`}
          >
            <option value="">Choose a list…</option>
            {lists.map((l) => (
              <option key={l.name} value={l.name}>{l.label}</option>
            ))}
            {step.source && !lists.some((l) => l.name === step.source) && (
              <option value={step.source}>{step.source} — no longer available</option>
            )}
          </select>
        </div>
      </div>

      {lists.length === 0 && (
        <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
          No lists yet — add a Find records step, or a list variable.
        </p>
      )}

      {step.source === PICKED_TARGETS_LIST && (
        <Note>
          One item per record the run was started on, each with that record&rsquo;s fields. This is
          how a run started on several records checks each of them — at the top level their fields
          read empty.
        </Note>
      )}

      {bound.length > 0 && (
        <div className="rounded-lg border border-[#f1f0ee] bg-[#fbfaf9] p-2.5">
          <p className="mb-1.5 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            Each one carries
          </p>
          <div className="flex flex-wrap gap-1">
            {bound.map((f) => (
              <code
                key={f.name}
                className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]"
                style={{ border: '1px solid #e6e4dd', color: CHROME.textSecondary }}
                title={`Use as {{${f.name}}} in a step input, or pick it in a condition below.`}
              >
                {f.name}
              </code>
            ))}
          </div>
          <p className="mt-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
            Conditions inside the loop can compare these directly, and a step input can write{' '}
            <code className="font-mono">{`{{${step.itemName || 'item'}.${ITEM_TARGET_ID}}}`}</code>
            {list?.targetTypeKey === TARGET_TYPE.PROJECT ? ' — for a project, its project code.' : '.'}
          </p>
        </div>
      )}

      {step.source && bound.length === 0 && (
        <Note>
          {list?.targetTypeKey == null
            ? 'This list is filled by whoever starts the run, so what is in an item is not known here.'
            : 'Still loading what an item contains…'}
        </Note>
      )}

      <Note tone={STATUS.warning} icon={AlertTriangle}>
        Automated actions in here act on the <strong>run&rsquo;s own target</strong>, not on{' '}
        <code className="font-mono">{step.itemName || 'item'}</code>. Setting a status per item will
        not work yet. An API call can, using{' '}
        <code className="font-mono">{`{{${step.itemName || 'item'}.${ITEM_TARGET_ID}}}`}</code>.
      </Note>
    </div>
  );
});
