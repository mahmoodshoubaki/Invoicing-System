'use client';

import { useCallback, useRef, useState } from 'react';

import { boqRepository } from '@/repositories/boqRepository';
import { toPlanCycles } from '@/lib/changeRequest/itemDraft';
import { NEW_ITEM_PLAN_ANCHORS, emptyNewItem } from '@/lib/changeRequest/newItemDraft';

const NONE = [];

/**
 * @param {{ initial?: Array, window: { start: string, end: string }, canEdit: boolean, onEdit: () => void }} options
 */
export function useNewItems({ initial = NONE, window, canEdit, onEdit }) {
  const [newItems, setNewItems] = useState(initial);
  const [plans, setPlans] = useState({});
  const lastKey = useRef(initial.length);
  const rebuildSeq = useRef({});

  const rebuild = useCallback(async (key, values) => {
    if (!values.baselineInvoicingDate || !values.billingFrequencyId || !window.start || !window.end) return;
    const mine = (rebuildSeq.current[key] ?? 0) + 1;
    rebuildSeq.current[key] = mine;
    setPlans((prev) => ({ ...prev, [key]: { busy: true, error: null } }));
    try {
      const preview = await boqRepository.previewInvoicingPlan({
        anchorDate: values.baselineInvoicingDate,
        billingFrequencyId: values.billingFrequencyId,
        contractStartDate: window.start,
        contractFinishDate: window.end,
      });
      if (rebuildSeq.current[key] !== mine) return;
      setNewItems((prev) => prev.map((d) => (d.key === key ? { ...d, cycles: toPlanCycles(preview) } : d)));
      setPlans((prev) => ({ ...prev, [key]: { busy: false, error: null } }));
    } catch (err) {
      if (rebuildSeq.current[key] !== mine) return;
      setPlans((prev) => ({ ...prev, [key]: { busy: false, error: err?.message || 'Failed to generate the invoicing plan.' } }));
    }
  }, [window.start, window.end]);

  const addNewItem = () => {
    if (!canEdit) return;
    lastKey.current += 1;
    const key = `new-${lastKey.current}`;
    setNewItems((prev) => [...prev, emptyNewItem(key)]);
    onEdit();
  };

  const removeNewItem = (key) => {
    if (!canEdit) return;
    setNewItems((prev) => prev.filter((d) => d.key !== key));
    onEdit();
  };

  const setNewItemField = (key, field, value) => {
    const current = newItems.find((d) => d.key === key);
    if (!current || !canEdit) return;
    const values = { ...current.values, [field]: value };
    setNewItems((prev) => prev.map((d) => (d.key === key ? { ...d, values } : d)));
    if (NEW_ITEM_PLAN_ANCHORS.includes(field)) rebuild(key, values);
    onEdit();
  };

  const setNewItemCycles = (key, cycles) => {
    if (!canEdit) return;
    setNewItems((prev) => prev.map((d) => (d.key === key ? { ...d, cycles: toPlanCycles(cycles) } : d)));
    onEdit();
  };

  return { newItems, newItemPlans: plans, addNewItem, removeNewItem, setNewItemField, setNewItemCycles };
}
