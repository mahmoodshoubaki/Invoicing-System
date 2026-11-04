import { Info } from 'lucide-react';

import FormSection from '@/components/common/FormSection';

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
