'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useTranslations } from 'next-intl';

import { useToast } from '@/hooks/useToast';
import { createInvoice } from '@/store/slices/invoicesSlice';
import { VAT_RATE } from '@/constants/appConfig';

const INITIAL_FORM = {
  boqLineItems: {},
  vat: String(VAT_RATE),
};

/**
 * @param {{ projectCode: string, boqItems: Array, projectFinancials: Object }} options
 */
export function useNewInvoiceForm({ projectCode, boqItems, projectFinancials }) {
  const router = useRouter();
  const t = useTranslations('invoices.form');
  const dispatch = useDispatch();
  const toast = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const toggleBOQItem = (boqId) => {
    setForm((prev) => {
      const next = { ...prev.boqLineItems };
      if (next[boqId]) {
        delete next[boqId];
      } else {
        next[boqId] = { quantity: '' };
      }
      return { ...prev, boqLineItems: next };
    });
    setErrors((prev) => {
      const n = { ...prev };
      delete n.boqLineItems;
      delete n[`qty_${boqId}`];
      return n;
    });
  };

  const setLineQty = (boqId, qty) => {
    setForm((prev) => ({
      ...prev,
      boqLineItems: { ...prev.boqLineItems, [boqId]: { quantity: qty } },
    }));
    setErrors((prev) => { const n = { ...prev }; delete n[`qty_${boqId}`]; return n; });
  };

  const set = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};

    const lineEntries = Object.entries(form.boqLineItems);
    if (lineEntries.length === 0) {
      e.boqLineItems = t('errors.selectItem');
    } else {
      lineEntries.forEach(([itemId, { quantity }]) => {
        const boq = boqItems.find((b) => String(b.id) === itemId);
        if (!boq) return;
        const qty = Number(quantity);
        const available = boq.availableQuantity;

        if (!quantity || isNaN(qty) || qty <= 0) {
          e[`qty_${itemId}`] = t('errors.quantity');
        } else if (qty > available) {
          e[`qty_${itemId}`] = t('errors.onlyAvailable', { available, committed: boq.committedQuantity });
        }
      });
    }

    return e;
  };

  const selectedIds = Object.keys(form.boqLineItems);
  const grandTotal = selectedIds.reduce((sum, itemId) => {
    const boq = boqItems.find((b) => String(b.id) === itemId);
    return sum + (boq?.unitCost ?? 0) * (Number(form.boqLineItems[itemId]?.quantity) || 0);
  }, 0);
  const attachmentsUploading = attachments.some((a) => a.status === 'uploading');

  const handleSubmitClick = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSaving(true);
    try {
      const lines = selectedIds.map((itemId) => {
        const boq = boqItems.find((b) => String(b.id) === itemId);
        return {
          boqItemId: boq.id,
          quantity: Number(form.boqLineItems[itemId]?.quantity) || 0,
          billedUnitPrice: boq.unitCost,
          itemTitleArSnapshot: boq.arabicName,
          itemTitleEnSnapshot: boq.englishName,
          itemDescriptionSnapshot: boq.notes,
        };
      });

      await dispatch(createInvoice({
        projectCode,
        wip: projectFinancials.wip,
        revenue: projectFinancials.totalRevenue,
        lines,
        attachments,
      })).unwrap();

      setConfirmOpen(false);
      toast.success(t('submitted'), t('submittedBody'));
      router.push(`/projects/${encodeURIComponent(projectCode)}`);
    } catch (err) {
      toast.error(t('submitFailed'), err ?? t('tryAgain'));
    } finally {
      setSaving(false);
    }
  };

  return {
    form, errors, saving, attachments, setAttachments, attachmentsUploading,
    selectedIds, grandTotal,
    toggleBOQItem, setLineQty, set,
    confirmOpen, handleSubmitClick, handleConfirmSubmit, closeConfirm: () => setConfirmOpen(false),
  };
}
