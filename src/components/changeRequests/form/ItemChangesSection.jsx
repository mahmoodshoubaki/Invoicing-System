'use client';

import { useMemo } from 'react';
import { LayoutList, Plus } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import Button from '@/components/common/Button';
import { canTakeOut } from '@/lib/changeRequest/taskFields';
import { itemBlocker } from '@/lib/changeRequest/eligibility';
import { CHROME } from '@/theme/vizPalette';
import AddItemPicker from './AddItemPicker';
import ItemChangeCard from './ItemChangeCard';
import NewItemCard from './NewItemCard';

/**
 * The BOQ changes of a request: approved items it changes, picked from the
 * BOQ, and new items it adds. Each in its own card.
 *
 * @param {{
 *   form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>,
 *   boqItems: Array, statusNameOf: (statusId) => string|null,
 * }} props
 */
export default function ItemChangesSection({ form, boqItems, statusNameOf }) {
  const inRequest = useMemo(() => new Set(form.items.map((d) => String(d.itemId))), [form.items]);
  const choices = useMemo(() => boqItems
    .filter((item) => !inRequest.has(String(item.id)))
    .sort((a, b) => String(a.englishName ?? '').localeCompare(String(b.englishName ?? '')))
    .map((item) => ({ item, blocker: itemBlocker(item, statusNameOf(item.statusId)) })),
  [boqItems, inRequest, statusNameOf]);
  const canPickItems = form.asks.fieldChanges || form.asks.cycleChanges;
  const canAddNew = form.asks.newItems;
  const empty = form.items.length === 0 && form.newItems.length === 0;

  return (
    <FormSection
      title="BOQ Changes"
      subtitle="Change approved items without an invoice, or add new items"
      icon={LayoutList}
    >
      <div className="flex flex-wrap items-start gap-2">
        {canPickItems && <div className="min-w-0 flex-1"><AddItemPicker form={form} choices={choices} /></div>}
        {canAddNew && (
          <Button size="sm" variant="outline" icon={Plus} onClick={form.addNewItem}>Add new BOQ item</Button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {empty && (
          <p className="rounded-xl border border-dashed border-[#e1e0d9] px-4 py-6 text-center text-xs" style={{ color: CHROME.textMuted }}>
            No BOQ changes in this request. A request can change only the contract dates, too.
          </p>
        )}
        {form.items.map((draft) => (
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
        {form.newItems.map((draft) => (
          <NewItemCard
            key={draft.key}
            draft={draft}
            problems={form.shownProblems.newItems[draft.key] ?? null}
            plan={form.newItemPlans[draft.key]}
            window={form.window}
            locked={!canAddNew}
            onField={form.setNewItemField}
            onCycles={form.setNewItemCycles}
            onRemove={form.removeNewItem}
            revealToken={form.refusedCount}
          />
        ))}
      </div>
    </FormSection>
  );
}
