'use client';

import { useSelector } from 'react-redux';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import FormSection from '@/components/common/FormSection';
import { DatePicker, Input } from '@/components/forms/FormField';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils';
import { mainProjectOf, projectValueTotal } from '@/lib/changeRequest/projectDraft';

const blank = (value) => String(value ?? '').trim() === '';

function SubProjectsTable({ subProjects, currency }) {
  const t = useTranslations('changeRequests.contract');
  const format = useLocaleFormat();
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-start font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">{t('subProject')}</th>
            <th className="px-3 py-2 text-end">{t('value')}</th>
            <th className="px-3 py-2">{t('start')}</th>
            <th className="px-3 py-2">{t('end')}</th>
            <th className="px-3 py-2 text-end">{t('months')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {subProjects.map((p) => (
            <tr key={p.uid}>
              <td className="px-3 py-2" style={{ color: CHROME.textPrimary }}>
                <span dir="ltr" className="font-mono">{p.code}</span>
                {p.isMain && <span className="ms-1.5 rounded-full bg-[#f1f0ee] px-1.5 py-px text-[10px] font-semibold text-gray-600">{t('main')}</span>}
              </td>
              <td className="px-3 py-2 text-end tabular-nums">{blank(p.values.projectValue) ? '—' : formatCurrency(Number(p.values.projectValue), currency)}</td>
              <td className="px-3 py-2">{format.date(p.values.contractStartDate) || '—'}</td>
              <td className="px-3 py-2">{format.date(p.contractFinishDate) || '—'}</td>
              <td className="px-3 py-2 text-end tabular-nums">{p.values.contractDuration || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>, subProjects: Array }} props
 */
export default function ProjectChangesSection({ form, subProjects }) {
  const t = useTranslations('changeRequests.contract');
  const format = useLocaleFormat();
  const currency = useSelector((s) => s.ui.currency);
  const locked = !form.asks.fieldChanges;
  const main = mainProjectOf(subProjects);

  if (!main) {
    return (
      <FormSection title={t('title')} icon={Building2}>
        <p className="text-xs" style={{ color: CHROME.textMuted }}>
          {t('noMain')}
        </p>
      </FormSection>
    );
  }

  const proposed = form.proposed.find((p) => p.uid === main.uid) ?? main;
  const edits = form.projectEdits[main.uid] ?? {};
  const problems = form.shownProblems.project[main.uid] ?? {};
  const was = (key, text, missing = t('notInEpmRequired')) => (key in edits ? t('was', { value: text || '—' }) : blank(main.values[key]) ? missing : undefined);
  const set = (key) => (e) => form.setProjectField(main.uid, key, e.target.value);
  const start = proposed.values.contractStartDate;
  const end = proposed.contractFinishDate;
  const endHint = end !== main.contractFinishDate
    ? t('was', { value: format.date(main.contractFinishDate) || '—' })
    : blank(main.contractFinishDate) ? t('notInEpmRequired') : undefined;

  return (
    <FormSection
      title={t('title')}
      subtitle={t('subtitle', { code: main.code })}
      icon={Building2}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DatePicker
          label={t('updatedStart')}
          value={start}
          onChange={set('contractStartDate')}
          disabled={locked}
          hint={was('contractStartDate', format.date(main.values.contractStartDate))}
          error={problems.contractStartDate}
        />
        <Input
          label={t('updatedDuration')}
          type="number"
          min="1"
          step="1"
          value={proposed.values.contractDuration}
          onChange={set('contractDuration')}
          disabled={locked}
          hint={was('contractDuration', main.values.contractDuration, t('notInEpm'))}
          error={problems.contractDuration}
        />
        <DatePicker
          label={t('updatedEnd')}
          value={end}
          onChange={set('contractFinishDate')}
          min={start || undefined}
          disabled={locked}
          hint={endHint}
          error={problems.contractFinishDate}
        />
        <Input
          label={t('projectValue')}
          readOnly
          value={formatCurrency(projectValueTotal(subProjects), currency)}
          hint={t('readOnly')}
          className="cursor-not-allowed bg-gray-50"
        />
      </div>
      <SubProjectsTable subProjects={subProjects} currency={currency} />
    </FormSection>
  );
}
