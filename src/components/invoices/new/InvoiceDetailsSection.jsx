import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FormSection from '@/components/common/FormSection';

export default function InvoiceDetailsSection() {
  const t = useTranslations('invoices.form');
  return (
    <FormSection title={t('detailsTitle')} icon={Info}>
      <p className="text-sm text-gray-600">
        {t.rich('detailsNote', { b: (chunks) => <strong>{chunks}</strong> })}
      </p>
    </FormSection>
  );
}
