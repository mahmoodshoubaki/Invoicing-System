'use client';

import { useMemo } from 'react';
import { LayoutList } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import { BOQ_STATUS } from '@/constants/statuses';
import { canTakeOut } from '@/lib/changeRequest/taskFields';
import { CHROME } from '@/theme/vizPalette';
import AddItemPicker from './AddItemPicker';
import ItemChangeCard from './ItemChangeCard';

/**
 * The items a change request changes — picked from the approved ones, each in
 * its own card. New items are never part of a request: they are added the
 * usual way once it is approved. From the moment a request is created its
 * items are frozen until it is decided.
 *
 * @param {{
 *   form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>,
 *   boqItems: Array, statusNameOf: (statusId) => string|null,
 * }} props
 */
export default function ItemChangesSection({ form, boqItems, statusNameOf }) {
  const inRequest = useMemo(() => new Set(form.items.map((d) => String(d.itemId))), [form.items]);
  const approved = boqItems.filter((item) => statusNameOf(item.statusId) === BOQ_STATUS.APPROVED);
  const choices = approved
    .filter((item) => !inRequest.has(String(item.id)))
    .sort((a, b) => String(a.englishName ?? '').localeCompare(String(b.englishName ?? '')));

  return (
    <FormSection
      title="Item changes"
      subtitle="Approved items without an invoice. New items are added the usual way once the request is approved"
      icon={LayoutList}
    >
      <AddItemPicker form={form} choices={choices} notApprovedCount={boqItems.length - approved.length} />

      <div className="mt-4 flex flex-col gap-4">
        {form.items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#e1e0d9] px-4 py-6 text-center text-xs" style={{ color: CHROME.textMuted }}>
            No items in this request. A request can change only the project, too.
          </p>
        ) : form.items.map((draft) => (
          <ItemChangeCard
            key={draft.itemId}
            draft={draft}
            problems={form.shownProblems.items[draft.itemId] ?? null}
            plan={form.plans[draft.itemId]}
            window={form.window}
            onField={form.setItemField}
            onCycles={form.setItemCycles}
            onRemove={form.removeItem}
            revealToken={form.refusedCount}
            lockFields={!form.asks.fieldChanges}
            lockPlan={!form.asks.cycleChanges}
            canRemove={canTakeOut(draft, form.asks)}
          />
        ))}
      </div>
    </FormSection>
  );
}
