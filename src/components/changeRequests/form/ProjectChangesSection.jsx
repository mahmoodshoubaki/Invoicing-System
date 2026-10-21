'use client';

import { useSelector } from 'react-redux';
import { Building2 } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import { DatePicker, Input, NumberInput } from '@/components/forms/FormField';
import { CHROME } from '@/theme/vizPalette';
import { formatCurrency, formatDate } from '@/utils';

/**
 * Each EPM sub-project's value, contract start date and contract duration, as
 * the request would leave them (2026-10-19). Each starts at what the
 * sub-project has now; a changed field says what it was. The end date is the
 * start plus the duration — worked out, not typed — and it bounds every
 * invoice date. Values are updated in EPM once the request is approved.
 *
 * Locked in a workflow task that does not ask for the request's field changes
 * (2026-10-20): they stay as the request has them.
 *
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>, subProjects: Array }} props
 */
export default function ProjectChangesSection({ form, subProjects }) {
  const currency = useSelector((s) => s.ui.currency);
  const locked = !form.asks.fieldChanges;

  return (
    <FormSection
      title="Project changes"
      subtitle="Leave a value as it is to keep it — EPM is updated once the request is approved"
      icon={Building2}
    >
      {subProjects.length === 0 ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>This project has no EPM sub-projects to change.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {subProjects.map((original) => {
            const proposed = form.proposed.find((p) => p.uid === original.uid) ?? original;
            const edits = form.projectEdits[original.uid] ?? {};
            const problems = form.shownProblems.project[original.uid] ?? {};
            const was = (key, text) => (key in edits ? `was ${text || '—'}` : undefined);
            const set = (key) => (e) => form.setProjectField(original.uid, key, e.target.value);
            return (
              <div key={original.uid} className={subProjects.length > 1 ? 'rounded-xl border border-[#eceae4] p-3' : undefined}>
                {subProjects.length > 1 && (
                  <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
                    {original.name}
                    <span className="ml-1.5 font-mono font-normal" style={{ color: CHROME.textMuted }}>{original.code}</span>
                  </p>
                )}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <NumberInput
                    label={`Updated Project value (${currency})`}
                    value={proposed.values.projectValue}
                    onChange={set('projectValue')}
                    disabled={locked}
                    hint={was('projectValue', formatCurrency(Number(original.values.projectValue) || 0, currency))}
                    error={problems.projectValue}
                  />
                  <DatePicker
                    label="Updated Contract start date"
                    value={proposed.values.contractStartDate}
                    onChange={set('contractStartDate')}
                    disabled={locked}
                    hint={was('contractStartDate', formatDate(original.values.contractStartDate))}
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
                    hint={was('contractDuration', original.values.contractDuration)}
                    error={problems.contractDuration}
                  />
                  <Input
                    label="Updated Contract end date"
                    readOnly
                    value={formatDate(proposed.contractFinishDate) || '—'}
                    hint={proposed.contractFinishDate !== original.contractFinishDate
                      ? `was ${formatDate(original.contractFinishDate) || '—'}`
                      : 'Start + duration'}
                    className="cursor-not-allowed bg-gray-50"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}
