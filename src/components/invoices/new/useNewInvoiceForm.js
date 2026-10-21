'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';

import { useToast } from '@/hooks/useToast';
import { createInvoice } from '@/store/slices/invoicesSlice';
import { claimReferenceProblem, toClaimReference } from '@/lib/claimReference';

const INITIAL_FORM = {
  // boqLineItems: { [boqItemId]: { quantity: '' } }
  boqLineItems: {},
  vat: '0.15',
  // Optional, 12 digits (2026-10-13) — typed as text, sent as a number.
  financialClaimReference: '',
  // No invoice number or baseline date (2026-10-11): stage 2 fills them in,
  // through the workflow's task — see InvoiceDetailsSection.
};

/**
 * The new invoice request being filled in: which BOQ items, how many of each,
 * its attachments — checked, confirmed, then submitted.
 *
 * @param {{ projectCode: string, boqItems: Array, projectFinancials: Object }} options
 */
export function useNewInvoiceForm({ projectCode, boqItems, projectFinancials }) {
  const router = useRouter();
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
      e.boqLineItems = 'Select at least one BOQ item';
    } else {
      lineEntries.forEach(([itemId, { quantity }]) => {
        const boq = boqItems.find((b) => String(b.id) === itemId);
        if (!boq) return;
        const qty = Number(quantity);
        const available = boq.availableQuantity;

        if (!quantity || isNaN(qty) || qty <= 0) {
          e[`qty_${itemId}`] = 'Enter a quantity greater than 0';
        } else if (qty > available) {
          e[`qty_${itemId}`] = `Only ${available} unit${available !== 1 ? 's' : ''} available (${boq.committedQuantity} already committed)`;
        }
      });
    }

    const claimProblem = claimReferenceProblem(form.financialClaimReference);
    if (claimProblem) e.financialClaimReference = claimProblem;
    // if (form.vat === '' || isNaN(Number(form.vat)) || Number(form.vat) < 0) {
    //   e.vat = 'Valid VAT rate is required';
    // }
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
        financialClaimReference: toClaimReference(form.financialClaimReference),
        wip: projectFinancials.wip,
        revenue: projectFinancials.totalRevenue,
        // Who submitted it is the backend's to record, from the signed-in user.
        lines,
        // Anything still uploading is already blocked by the disabled
        // submit button, so every entry here is ready to send.
        // `file` (a raw File object) is genuinely non-serializable — the
        // store is configured to allow that specifically for this field,
        // see store/index.js.
        attachments,
      })).unwrap();

      setConfirmOpen(false);
      toast.success('Invoice request submitted', 'The invoice request was created successfully.');
      router.push(`/projects/${encodeURIComponent(projectCode)}`);
    } catch (err) {
      toast.error('Failed to submit invoice request', err ?? 'Please try again.');
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
