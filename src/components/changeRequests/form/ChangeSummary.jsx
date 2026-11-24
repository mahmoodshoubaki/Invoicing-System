'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import FormSection from '@/components/common/FormSection';
import { boqTotals } from '@/lib/changeRequest/checks';
import { changedItemFields, cycleChangesOf } from '@/lib/changeRequest/itemDraft';
import { changedProjectFields } from '@/lib/changeRequest/projectDraft';
import { newItemTotal } from '@/lib/changeRequest/newItemDraft';
import { typesText } from '@/lib/changeRequest/typesDraft';
import {
  selectBillingFrequencies, selectChangeRequestProjectEffectsMap, selectChangeRequestTypesMap,
} from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils';
import ChangeProblemsPanel from './ChangeProblemsPanel';

function ChangeLine({ label, from, to }) {
  const { rtl } = useLocaleFormat();
  return (
    <li className="text-xs" style={{ color: CHROME.textSecondary }}>
      <span style={{ color: CHROME.textMuted }}>{label}: </span>
      <span className="line-through" style={{ color: CHROME.textMuted }}>{from || '—'}</span>
      {rtl ? ' ← ' : ' → '}
      <span className="font-medium" style={{ color: CHROME.textPrimary }}>{to || '—'}</span>
    </li>
  );
}

function planLine(changes, t) {
  const counts = ['Moved', 'Added', 'Removed']
    .map((kind) => [kind, changes.filter((c) => c.kind === kind).length])
    .filter(([, n]) => n > 0)
    .map(([kind, n]) => t(`plan.${kind}`, { count: n }));
  return counts.length ? t('plan.line', { counts: counts.join(t('plan.separator')) }) : null;
}

/**
 * @param {{ form: Object, subProjects: Array, boqItems: Array }} props
 */
export default function ChangeSummary({ form, subProjects, boqItems }) {
  const t = useTranslations('changeRequests.summary');
  const tf = useTranslations('changeRequests.fields');
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
  const currency = useSelector((s) => s.ui.currency);
  const frequencies = useSelector(selectBillingFrequencies);
  const totals = boqTotals(form.draft, { subProjects, allItems: boqItems });
  const projectChanges = changedProjectFields(subProjects, form.projectEdits);
  const over = totals.projectValue > 0 && totals.itemsTotal > totals.projectValue;

  const show = (key, value) => {
    if (key === 'projectValue' || key === 'unitCost') return formatCurrency(Number(value) || 0, currency);
    if (key.toLowerCase().includes('date')) return format.date(value);
    if (key === 'billingFrequencyId') {
      const name = frequencies.find((f) => String(f.id) === String(value))?.label;
      return name ? frequencyLabel(name) : value;
    }
    return value;
  };
  const typesMap = useSelector(selectChangeRequestTypesMap);
  const effectsMap = useSelector(selectChangeRequestProjectEffectsMap);
  const typeLine = typesText(form.typeKeys, form.otherTypeText, typesMap);
  const effectLine = form.projectEffectKey != null ? effectsMap[form.projectEffectKey]?.label ?? '' : '';
  const general = form.shownProblems.general;
  const itemNames = useMemo(
    () => [...form.items.map((i) => i.name), ...form.newItems.map((i) => `${i.values.englishName.trim()} (new item)`)],
    [form.items, form.newItems]
  );

  return (
    <FormSection title={t('title')} subtitle={t('subtitle')} icon={Scale}>
      <p className="mb-3 text-xs" style={{ color: CHROME.textSecondary }}>
        <span style={{ color: CHROME.textMuted }}>{t('type')} </span>
        <strong style={{ color: CHROME.textPrimary }}>{typeLine || '—'}</strong>
        <span className="ms-4" style={{ color: CHROME.textMuted }}>{t('effect')} </span>
        <strong style={{ color: CHROME.textPrimary }}>{effectLine || '—'}</strong>
      </p>
      <div
        className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl px-4 py-3 text-xs"
        style={{ backgroundColor: '#f6f5f3' }}
      >
        <span>
          <span style={{ color: CHROME.textMuted }}>{t('itemsAddUp')} </span>
          <strong style={{ color: CHROME.textPrimary }}>{formatCurrency(totals.itemsTotal, currency)}</strong>
        </span>
        <span>
          <span style={{ color: CHROME.textMuted }}>{t('projectValue')} </span>
          <strong style={{ color: CHROME.textPrimary }}>{formatCurrency(totals.projectValue, currency)}</strong>
        </span>
        <span style={{ color: over ? CHROME.textSecondary : STATUS.good }}>
          {over
            ? t.rich('exceeds', { value: formatCurrency(totals.itemsTotal - totals.projectValue, currency), amount: (chunks) => <span dir="ltr">{chunks}</span> })
            : t.rich('unallocated', { value: formatCurrency(totals.projectValue - totals.itemsTotal, currency), amount: (chunks) => <span dir="ltr">{chunks}</span> })}
        </span>
      </div>

      {projectChanges.length === 0 && form.items.length === 0 && form.newItems.length === 0 ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>{t('noChanges')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {projectChanges.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{t('project')}</p>
              <ul className="flex flex-col gap-0.5">
                {projectChanges.map((c) => (
                  <ChangeLine
                    key={`${c.uid}:${c.key}`}
                    label={subProjects.length > 1 ? `${c.name} — ${tf(c.key)}` : tf(c.key)}
                    from={show(c.key, c.from)}
                    to={show(c.key, c.to)}
                  />
                ))}
              </ul>
            </div>
          )}
          {form.items.map((item) => {
            const fields = changedItemFields(item);
            const plan = planLine(cycleChangesOf(item), t);
            return (
              <div key={item.itemId}>
                <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{item.name}</p>
                <ul className="flex flex-col gap-0.5">
                  {fields.map((c) => <ChangeLine key={c.key} label={tf(c.key)} from={show(c.key, c.from)} to={show(c.key, c.to)} />)}
                  {plan && <li className="text-xs" style={{ color: CHROME.textSecondary }}>{plan}</li>}
                  {fields.length === 0 && !plan && (
                    <li className="text-xs" style={{ color: CHROME.textMuted }}>{t('nothingChanged')}</li>
                  )}
                </ul>
              </div>
            );
          })}
          {form.newItems.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{t('newItems')}</p>
              <ul className="flex flex-col gap-0.5">
                {form.newItems.map((item) => (
                  <li key={item.key} className="text-xs" style={{ color: CHROME.textSecondary }}>
                    <span className="font-medium" style={{ color: CHROME.textPrimary }}>{item.values.englishName.trim() || t('newItem')}</span>
                    {' · '}<span dir="ltr">{formatCurrency(newItemTotal(item.values), currency)}</span>
                    {' · '}{t('planCycles', { count: item.cycles.length })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <ChangeProblemsPanel messages={general} itemNames={itemNames} />
    </FormSection>
  );
}
