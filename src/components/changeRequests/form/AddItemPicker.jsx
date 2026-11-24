'use client';

import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Button from '@/components/common/Button';
import { controlClass } from '@/components/ui/kit';
import { STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>, choices: Array<{ item: Object, blocker: { reason: string, short: string }|null }>, }} props
 */
export default function AddItemPicker({ form, choices }) {
  const t = useTranslations('changeRequests.form');
  const nameOf = (item) => item.englishName ?? t('itemFallback', { id: item.id });
  const [picked, setPicked] = useState('');
  const busy = form.adding.itemId != null;
  const open = choices.filter((c) => !c.blocker);
  const closed = choices.filter((c) => c.blocker);
  const chosen = choices.find((c) => String(c.item.id) === picked) ?? null;
  const blocker = chosen?.blocker ?? null;

  const add = async () => {
    if (!picked || blocker) return;
    await form.addItem(picked);
    setPicked('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          aria-label={t('itemToChange')}
          disabled={busy || choices.length === 0}
          className={`${controlClass} min-w-0 flex-1 sm:max-w-md`}
        >
          <option value="">{choices.length ? t('chooseItem') : t('noItemLeft')}</option>
          {open.map(({ item }) => <option key={item.id} value={item.id}>{nameOf(item)}</option>)}
          {closed.length > 0 && (
            <optgroup label={t('cantBeChanged')}>
              {closed.map(({ item, blocker: b }) => (
                <option key={item.id} value={item.id}>{nameOf(item)} — {b.short}</option>
              ))}
            </optgroup>
          )}
        </select>
        <Button size="sm" variant="outline" icon={Plus} onClick={add} loading={busy} disabled={!picked || Boolean(blocker)}>
          {t('addToRequest')}
        </Button>
      </div>
      {blocker && (
        <p
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-xs"
          style={{ backgroundColor: withAlpha(STATUS.critical, 0.07), color: STATUS.critical }}
        >
          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('cantChange', { name: nameOf(chosen.item), reason: blocker.reason })}
        </p>
      )}
      {form.adding.error && <p className="mt-1 text-xs" style={{ color: STATUS.critical }}>{form.adding.error}</p>}
    </div>
  );
}
