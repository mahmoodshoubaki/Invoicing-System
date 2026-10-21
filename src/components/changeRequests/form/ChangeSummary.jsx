'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Scale } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import { boqTotals, movesMoney } from '@/lib/changeRequest/checks';
import { changedItemFields, cycleChangesOf } from '@/lib/changeRequest/itemDraft';
import { changedProjectFields } from '@/lib/changeRequest/projectDraft';
import { selectBillingFrequencies } from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatCurrency, formatDate } from '@/utils';
import ChangeProblemsPanel from './ChangeProblemsPanel';

/** One change, as "Quantity: 10 → 12". */
function ChangeLine({ label, from, to }) {
  return (
    <li className="text-xs" style={{ color: CHROME.textSecondary }}>
      <span style={{ color: CHROME.textMuted }}>{label}: </span>
      <span className="line-through" style={{ color: CHROME.textMuted }}>{from || '—'}</span>
      {' → '}
      <span className="font-medium" style={{ color: CHROME.textPrimary }}>{to || '—'}</span>
    </li>
  );
}

/** "2 moved, 1 added" — a plan's changes, counted. */
function planLine(changes) {
  const counts = ['Moved', 'Added', 'Removed']
    .map((kind) => [kind, changes.filter((c) => c.kind === kind).length])
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => `${n} ${kind.toLowerCase()}`);
  return counts.length ? `Invoicing plan: ${counts.join(', ')}` : null;
}

/**
 * The request in one place, as the approver will read it: every change, the
 * BOQ's items added up against the project value as the request leaves them,
 * and what stops it.
 *
 * @param {{ form: Object, subProjects: Array, boqItems: Array }} props
 */
export default function ChangeSummary({ form, subProjects, boqItems }) {
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const totals = boqTotals(form.draft, { subProjects, allItems: boqItems });
  const projectChanges = changedProjectFields(subProjects, form.projectEdits);
  const counts = movesMoney(form.draft, projectChanges);
  const over = totals.projectValue > 0 && totals.itemsTotal > totals.projectValue;

  const show = (key, value) => {
    if (key === 'projectValue' || key === 'unitCost') return formatCurrency(Number(value) || 0, currency);
    if (key.toLowerCase().includes('date')) return formatDate(value);
    if (key === 'billingFrequencyId') return frequencies.find((f) => String(f.id) === String(value))?.label ?? value;
    return value;
  };
  const general = form.shownProblems.general;
  const itemNames = useMemo(() => form.items.map((i) => i.name), [form.items]);

  return (
    <FormSection title="Summary" subtitle="What the approver will be asked to accept" icon={Scale}>
      <div
        className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl px-4 py-3 text-xs"
        style={{ backgroundColor: over && counts ? withAlpha(STATUS.critical, 0.07) : '#f6f5f3' }}
      >
        <span>
          <span style={{ color: CHROME.textMuted }}>Items add up to </span>
          <strong style={{ color: CHROME.textPrimary }}>{formatCurrency(totals.itemsTotal, currency)}</strong>
        </span>
        <span>
          <span style={{ color: CHROME.textMuted }}>Project value </span>
          <strong style={{ color: CHROME.textPrimary }}>{formatCurrency(totals.projectValue, currency)}</strong>
        </span>
        <span style={{ color: over ? (counts ? STATUS.critical : STATUS.warning) : STATUS.good }}>
          {over
            ? `Items exceed the project value by ${formatCurrency(totals.itemsTotal - totals.projectValue, currency)}`
            : `${formatCurrency(totals.projectValue - totals.itemsTotal, currency)} of the project value not yet allocated to BOQ items`}
        </span>
        {over && !counts && (
          <span className="basis-full" style={{ color: CHROME.textMuted }}>
            Already over — this only stops a request that changes a quantity, a unit cost or a project value.
          </span>
        )}
      </div>

      {projectChanges.length === 0 && form.items.length === 0 ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>No changes yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {projectChanges.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Project</p>
              <ul className="flex flex-col gap-0.5">
                {projectChanges.map((c) => (
                  <ChangeLine
                    key={`${c.uid}:${c.key}`}
                    label={subProjects.length > 1 ? `${c.name} — ${c.label}` : c.label}
                    from={show(c.key, c.from)}
                    to={show(c.key, c.to)}
                  />
                ))}
              </ul>
            </div>
          )}
          {form.items.map((item) => {
            const fields = changedItemFields(item);
            const plan = planLine(cycleChangesOf(item));
            return (
              <div key={item.itemId}>
                <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{item.name}</p>
                <ul className="flex flex-col gap-0.5">
                  {fields.map((c) => <ChangeLine key={c.key} label={c.label} from={show(c.key, c.from)} to={show(c.key, c.to)} />)}
                  {plan && <li className="text-xs" style={{ color: CHROME.textSecondary }}>{plan}</li>}
                  {fields.length === 0 && !plan && (
                    <li className="text-xs" style={{ color: CHROME.textMuted }}>Nothing changed yet</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <ChangeProblemsPanel messages={general} itemNames={itemNames} />
    </FormSection>
  );
}
