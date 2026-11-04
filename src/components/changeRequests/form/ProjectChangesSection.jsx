'use client';

import { useSelector } from 'react-redux';
import { Building2 } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import { DatePicker, Input } from '@/components/forms/FormField';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency, formatDate } from '@/utils';
import { mainProjectOf, projectValueTotal } from '@/lib/changeRequest/projectDraft';

const NOT_IN_EPM = 'Not set in EPM — required';
const blank = (value) => String(value ?? '').trim() === '';

function SubProjectsTable({ subProjects, currency }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-3 py-2">Sub-project</th>
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2">Start</th>
            <th className="px-3 py-2">End</th>
            <th className="px-3 py-2 text-right">Months</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {subProjects.map((p) => (
            <tr key={p.uid}>
              <td className="px-3 py-2" style={{ color: CHROME.textPrimary }}>
                <span className="font-mono">{p.code}</span>
                {p.isMain && <span className="ml-1.5 rounded-full bg-[#f1f0ee] px-1.5 py-px text-[10px] font-semibold text-gray-600">Main</span>}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{blank(p.values.projectValue) ? '—' : formatCurrency(Number(p.values.projectValue), currency)}</td>
              <td className="px-3 py-2">{formatDate(p.values.contractStartDate) || '—'}</td>
              <td className="px-3 py-2">{formatDate(p.contractFinishDate) || '—'}</td>
              <td className="px-3 py-2 text-right tabular-nums">{p.values.contractDuration || '—'}</td>
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
  const currency = useSelector((s) => s.ui.currency);
  const locked = !form.asks.fieldChanges;
  const main = mainProjectOf(subProjects);

  if (!main) {
    return (
      <FormSection title="Contract dates" icon={Building2}>
        <p className="text-xs" style={{ color: CHROME.textMuted }}>
          EPM has no main project for this project (a code like 23/116), so the contract dates can&rsquo;t be changed.
        </p>
      </FormSection>
    );
  }

  const proposed = form.proposed.find((p) => p.uid === main.uid) ?? main;
  const edits = form.projectEdits[main.uid] ?? {};
  const problems = form.shownProblems.project[main.uid] ?? {};
  const was = (key, text, missing = NOT_IN_EPM) => (key in edits ? `was ${text || '—'}` : blank(main.values[key]) ? missing : undefined);
  const set = (key) => (e) => form.setProjectField(main.uid, key, e.target.value);
  const start = proposed.values.contractStartDate;
  const end = proposed.contractFinishDate;
  const endHint = end !== main.contractFinishDate
    ? `was ${formatDate(main.contractFinishDate) || '—'}`
    : blank(main.contractFinishDate) ? NOT_IN_EPM : undefined;

  return (
    <FormSection
      title="Contract dates"
      subtitle={`Changed on the main project, ${main.code}. EPM is updated once the request is approved.`}
      icon={Building2}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <DatePicker
          label="Updated Contract start date"
          value={start}
          onChange={set('contractStartDate')}
          disabled={locked}
          hint={was('contractStartDate', formatDate(main.values.contractStartDate))}
          error={problems.contractStartDate}
        />
        <Input
          label="Updated Contract duration (months)"
          type="number"
          min="1"
          step="1"
          value={proposed.values.contractDuration}
          onChange={set('contractDuration')}
          disabled={locked}
          hint={was('contractDuration', main.values.contractDuration, 'Not set in EPM')}
          error={problems.contractDuration}
        />
        <DatePicker
          label="Updated Contract end date"
          value={end}
          onChange={set('contractFinishDate')}
          min={start || undefined}
          disabled={locked}
          hint={endHint}
          error={problems.contractFinishDate}
        />
        <Input
          label="Project value"
          readOnly
          value={formatCurrency(projectValueTotal(subProjects), currency)}
          hint="Read-only"
          className="cursor-not-allowed bg-gray-50"
        />
      </div>
      <SubProjectsTable subProjects={subProjects} currency={currency} />
    </FormSection>
  );
}
