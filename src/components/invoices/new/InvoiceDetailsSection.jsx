import { Info } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import ClaimReferenceInput from '@/components/invoices/ClaimReferenceInput';

/**
 * The request's own details. An invoice is made in two stages (2026-10-11):
 * this form is stage 1. The invoice number and the baseline collection date
 * come at stage 2, filled in by whoever the workflow gives that task to, so
 * they are not asked here. The Financial Claim Reference Number is optional
 * and can be given now (2026-10-13).
 */
export default function InvoiceDetailsSection({ form, errors, set }) {
  return (
    <FormSection title="Invoice Details" icon={Info}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ClaimReferenceInput
          value={form.financialClaimReference}
          onChange={(text) => set('financialClaimReference')({ target: { value: text } })}
          error={errors.financialClaimReference}
        />
        <p className="self-center text-sm text-gray-600">
          The invoice number and the baseline expected collection date are filled in at the next stage, by whoever
          the workflow gives that task to. Until then they show as <strong>Pending</strong>.
        </p>
      </div>
    </FormSection>
  );
}
