import { Info } from 'lucide-react';

import FormSection from '@/components/common/FormSection';

/**
 * The request's own details. An invoice is made in two stages (2026-10-11):
 * this form is stage 1. The invoice number, the baseline collection date, the
 * financial claim reference number and the receipt issue date come later,
 * filled in through workflow tasks, so none of them is asked here.
 */
export default function InvoiceDetailsSection() {
  return (
    <FormSection title="Invoice Details" icon={Info}>
      <p className="text-sm text-gray-600">
        The invoice number, the baseline expected collection date, the financial claim reference number and the
        receipt issue date are filled in later, by the Invoicing and Collection team. Until then, they show as <strong>Pending</strong>.
      </p>
    </FormSection>
  );
}
