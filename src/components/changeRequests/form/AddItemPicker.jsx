'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import Button from '@/components/common/Button';
import { controlClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * Picking an item to change: the approved items not in the request yet. An
 * item with an invoice is refused once its plan is loaded — the picker cannot
 * tell from the list alone.
 *
 * @param {{
 *   form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>,
 *   choices: Array, notApprovedCount: number,
 * }} props
 */
export default function AddItemPicker({ form, choices, notApprovedCount }) {
  const [picked, setPicked] = useState('');
  const busy = form.adding.itemId != null;

  const add = async () => {
    if (!picked) return;
    await form.addItem(picked);
    setPicked('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          aria-label="Item to change"
          disabled={busy || choices.length === 0}
          className={`${controlClass} min-w-0 flex-1 sm:max-w-md`}
        >
          <option value="">{choices.length ? 'Choose an approved item…' : 'No approved item left to add'}</option>
          {choices.map((item) => (
            <option key={item.id} value={item.id}>{item.englishName ?? `Item ${item.id}`}</option>
          ))}
        </select>
        <Button size="sm" variant="outline" icon={Plus} onClick={add} loading={busy} disabled={!picked}>
          Add to the request
        </Button>
      </div>
      {notApprovedCount > 0 && (
        <p className="mt-1 text-[11px]" style={{ color: CHROME.textMuted }}>
          {notApprovedCount} item{notApprovedCount === 1 ? ' is' : 's are'} not approved, so not listed — only approved items can be changed.
        </p>
      )}
      {form.adding.error && <p className="mt-1 text-xs" style={{ color: STATUS.critical }}>{form.adding.error}</p>}
    </div>
  );
}
