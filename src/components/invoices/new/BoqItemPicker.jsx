import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';

import FormSection from '@/components/common/FormSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import BoqItemRow from './BoqItemRow';

/**
 * @param {{ boqItems: Array, loading: boolean, currency: string, invoice: ReturnType<import('./useNewInvoiceForm').useNewInvoiceForm>, }} props
 */
export default function BoqItemPicker({ boqItems, loading, currency, invoice }) {
  const t = useTranslations('invoices.picker');
  const { form, errors, selectedIds, grandTotal } = invoice;

  return (
    <FormSection
      title={t('title')}
      subtitle={t('subtitle')}
      icon={ListChecks}
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : boqItems.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">
            {t('none')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {t('goingBack')}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
            {boqItems.map((boq) => (
              <BoqItemRow
                key={boq.id}
                boq={boq}
                line={form.boqLineItems[boq.id]}
                qtyError={errors[`qty_${boq.id}`]}
                currency={currency}
                onToggle={invoice.toggleBOQItem}
                onQuantity={invoice.setLineQty}
              />
            ))}
          </div>

          {errors.boqLineItems && (
            <p className="text-xs text-red-500 mt-2">{errors.boqLineItems}</p>
          )}

          {selectedIds.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#f8485e]/20 bg-[#f8485e]/6 px-3.5 py-2.5">
              <span className="text-xs font-medium text-[#d9304a]">
                {t('selected', { count: selectedIds.length })}
              </span>
              <span className="text-sm font-bold tabular-nums text-[#d9304a]">
                {t.rich('grandTotal', { value: formatCurrency(grandTotal, currency), amount: (chunks) => <span dir="ltr">{chunks}</span> })}
              </span>
            </div>
          )}
        </>
      )}
    </FormSection>
  );
}
