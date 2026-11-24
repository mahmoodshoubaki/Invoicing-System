'use client';

import { AlignLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FormSection from '@/components/common/FormSection';
import { Textarea } from '@/components/forms/FormField';
import { CR_DETAILS_MAX } from '@/constants/changeRequests';

/**
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm> }} props
 */
export default function DetailsSection({ form }) {
  const t = useTranslations('changeRequests.details');
  return (
    <FormSection title={t('title')} subtitle={t('subtitle')} icon={AlignLeft}>
      <Textarea
        rows={4}
        value={form.details}
        onChange={(e) => form.setDetails(e.target.value)}
        placeholder={t('placeholder')}
        hint={`${form.details.length} / ${CR_DETAILS_MAX}`}
        error={form.shownProblems?.details ?? undefined}
      />
    </FormSection>
  );
}
