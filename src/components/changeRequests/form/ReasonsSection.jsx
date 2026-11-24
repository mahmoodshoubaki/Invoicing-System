'use client';

import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FormSection from '@/components/common/FormSection';
import CheckboxDropdown from '@/components/ui/CheckboxDropdown';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>, reasons: Array }} props
 */
export default function ReasonsSection({ form, reasons }) {
  const t = useTranslations('changeRequests.reasons');
  const problem = form.shownProblems.reasons;

  return (
    <FormSection title={t('title')} subtitle={t('subtitle')} icon={ListChecks}>
      {reasons.length === 0 ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>{t('loading')}</p>
      ) : (
        <div data-problem-scope>
          <CheckboxDropdown
            label={t('title')}
            options={reasons.map((r) => ({ value: r.key, label: r.label, description: r.justification }))}
            selected={form.reasons}
            onToggle={form.toggleReason}
            placeholder={t('placeholder')}
            error={problem}
          />
          {problem && <p data-problem className="mt-2 text-xs" style={{ color: STATUS.critical }}>{problem}</p>}
        </div>
      )}
    </FormSection>
  );
}
