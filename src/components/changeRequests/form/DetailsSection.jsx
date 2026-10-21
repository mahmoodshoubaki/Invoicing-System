'use client';

import { AlignLeft } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import { Textarea } from '@/components/forms/FormField';
import { CR_DETAILS_MAX } from '@/constants/changeRequests';

/**
 * Anything the reasons do not say — the user's own words for the approver.
 *
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm> }} props
 */
export default function DetailsSection({ form }) {
  return (
    <FormSection title="Additional details" subtitle="Optional — anything the approver should know" icon={AlignLeft}>
      <Textarea
        rows={4}
        value={form.details}
        onChange={(e) => form.setDetails(e.target.value)}
        placeholder="Like: the client confirmed the new UAT window by email on 12 October."
        hint={`${form.details.length} / ${CR_DETAILS_MAX}`}
        error={form.shownProblems?.details ?? undefined}
      />
    </FormSection>
  );
}
