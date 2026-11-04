'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { boqRepository } from '@/repositories/boqRepository';
import { itemBlocker } from '@/lib/changeRequest/eligibility';
import { PLAN_ANCHORS, itemDraftFrom, toPlanCycles } from '@/lib/changeRequest/itemDraft';
import { contractWindow, editContractDate, proposedSubProjects } from '@/lib/changeRequest/projectDraft';
import { ALL_PARTS, changeRequestProblems, problemsAskedFor } from '@/lib/changeRequest/checks';
import { createChangeRequestBody, mapServerErrors } from '@/lib/changeRequest/payload';
import { groupProblems } from '@/lib/changeRequest/problemText';
import { useNewItems } from './useNewItems';
import { useRequestFiles } from './useRequestFiles';
import { selectChangeRequestTypes } from '@/store/slices/lookupsSlice';

const NO_SERVER_ERRORS = {
  reasons: null, typeKeys: null, otherTypeText: null, projectEffectKey: null, details: null,
  project: {}, items: {}, newItems: {}, files: null, general: [],
};
const EMPTY = {
  reasons: [], typeKeys: [], otherTypeText: '', projectEffectKey: null, details: '',
  projectEdits: {}, items: [], newItems: [], files: null,
};
const NO_FILES = { existing: [], deleteIds: [], added: [] };

/**
 * @param {{ boqItems: Array, statusNameOf: (statusId) => string|null, subProjects: Array, initial?: Object|null, onSubmit?: (body: Object) => Promise<void>, asks?: typeof ALL_PARTS, }} options
 */
export function useChangeRequestForm({ boqItems, statusNameOf, subProjects, initial = null, onSubmit, asks = ALL_PARTS }) {
  const start = initial ?? EMPTY;
  const types = useSelector(selectChangeRequestTypes);
  const [reasons, setReasons] = useState(start.reasons);
  const [typeKeys, setTypeKeys] = useState(start.typeKeys ?? []);
  const [otherTypeText, setOtherTypeTextValue] = useState(start.otherTypeText ?? '');
  const [projectEffectKey, setProjectEffectKey] = useState(start.projectEffectKey ?? null);
  const [details, setDetailsText] = useState(start.details);
  const [projectEdits, setProjectEdits] = useState(start.projectEdits);
  const [items, setItems] = useState(start.items);
  const [adding, setAdding] = useState({ itemId: null, error: null });
  const [plans, setPlans] = useState({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState(NO_SERVER_ERRORS);
  const [refusedCount, setRefusedCount] = useState(0);
  const rebuildSeq = useRef({});

  const proposed = useMemo(() => proposedSubProjects(subProjects, projectEdits), [subProjects, projectEdits]);
  const window = useMemo(() => contractWindow(proposed), [proposed]);
  const edited = () => setServerErrors(NO_SERVER_ERRORS);
  const newItemsPart = useNewItems({ initial: start.newItems ?? [], window, canEdit: asks.newItems, onEdit: edited });
  const filesPart = useRequestFiles(asks.files ? start.files ?? NO_FILES : null, edited);
  const { newItems } = newItemsPart;
  const { files } = filesPart;
  const draft = useMemo(
    () => ({ reasons, typeKeys, otherTypeText, projectEffectKey, details, projectEdits, items, newItems, files }),
    [reasons, typeKeys, otherTypeText, projectEffectKey, details, projectEdits, items, newItems, files]
  );
  const problems = useMemo(() => {
    const all = changeRequestProblems(draft, { subProjects, allItems: boqItems, types });
    return asks === ALL_PARTS ? all : problemsAskedFor(all, asks, draft);
  }, [draft, subProjects, boqItems, types, asks]);

  const toggleReason = (key) => {
    setReasons((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    edited();
  };

  const toggleType = (key) => {
    if (!asks.types) return;
    setTypeKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    edited();
  };

  const setOtherTypeText = (text) => {
    if (!asks.types && !asks.typeText) return;
    setOtherTypeTextValue(text);
    edited();
  };

  const setProjectEffect = (key) => {
    if (!asks.effect) return;
    setProjectEffectKey(key);
    edited();
  };

  const setDetails = (text) => {
    setDetailsText(text);
    edited();
  };

  const setProjectField = (uid, key, value) => {
    if (!asks.fieldChanges) return;
    setProjectEdits((prev) => editContractDate(prev, subProjects, uid, key, value));
    edited();
  };

  const rebuildPlan = useCallback(async (itemId, values) => {
    if (!values.expectedInvoicingDate || !values.billingFrequencyId || !window.start || !window.end) return;
    const mine = (rebuildSeq.current[itemId] ?? 0) + 1;
    rebuildSeq.current[itemId] = mine;
    setPlans((prev) => ({ ...prev, [itemId]: { busy: true, error: null } }));
    try {
      const preview = await boqRepository.previewInvoicingPlan({
        anchorDate: values.expectedInvoicingDate,
        billingFrequencyId: values.billingFrequencyId,
        contractStartDate: window.start,
        contractFinishDate: window.end,
        boqItemId: itemId,
      });
      if (rebuildSeq.current[itemId] !== mine) return;
      setItems((prev) => prev.map((d) => (d.itemId === itemId ? { ...d, cycles: toPlanCycles(preview) } : d)));
      setPlans((prev) => ({ ...prev, [itemId]: { busy: false, error: null } }));
    } catch (err) {
      if (rebuildSeq.current[itemId] !== mine) return;
      setPlans((prev) => ({ ...prev, [itemId]: { busy: false, error: err?.message || 'Failed to generate the invoicing plan.' } }));
    }
  }, [window.start, window.end]);

  const addItem = async (itemId) => {
    const item = boqItems.find((i) => String(i.id) === String(itemId));
    if (!item || items.some((d) => String(d.itemId) === String(itemId))) return;
    const name = item.englishName ?? `Item ${item.id}`;
    const blocked = itemBlocker(item, statusNameOf(item.statusId));
    if (blocked) {
      setAdding({ itemId: null, error: `${name}: ${blocked.reason}` });
      return;
    }
    setAdding({ itemId: item.id, error: null });
    try {
      const cycles = await boqRepository.getTrackerCycles(item.id);
      setItems((prev) => (prev.some((d) => d.itemId === item.id) ? prev : [...prev, itemDraftFrom(item, cycles)]));
      setAdding({ itemId: null, error: null });
      edited();
    } catch (err) {
      setAdding({ itemId: null, error: `${name}: ${err?.message || 'its invoicing plan could not be loaded.'}` });
    }
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((d) => d.itemId !== itemId));
    edited();
  };

  const setItemField = (itemId, key, value) => {
    const current = items.find((d) => d.itemId === itemId);
    if (!current || !asks.fieldChanges) return;
    const values = { ...current.values, [key]: value };
    setItems((prev) => prev.map((d) => (d.itemId === itemId ? { ...d, values } : d)));
    if (PLAN_ANCHORS.includes(key) && asks.cycleChanges) rebuildPlan(itemId, values);
    edited();
  };

  const setItemCycles = (itemId, cycles) => {
    if (!asks.cycleChanges) return;
    setItems((prev) => prev.map((d) => (d.itemId === itemId ? { ...d, cycles: toPlanCycles(cycles) } : d)));
    edited();
  };

  const check = () => {
    setAttempted(true);
    if (problems.count === 0) return true;
    setRefusedCount((n) => n + 1);
    return false;
  };

  const showServerErrors = (placed) => {
    setServerErrors({ ...NO_SERVER_ERRORS, ...placed });
    setRefusedCount((n) => n + 1);
  };

  const submit = async () => {
    if (!check()) return;
    const { body, fieldIndex, cycleIndex, newItemIndex } = createChangeRequestBody({ draft, subProjects });
    setSubmitting(true);
    setServerErrors(NO_SERVER_ERRORS);
    try {
      await onSubmit(body, { added: files?.added ?? [], deleteIds: files?.deleteIds ?? [] });
    } catch (err) {
      const placed = mapServerErrors(err?.errors, { fieldIndex, cycleIndex, newItemIndex });
      const anyPlaced = placed.reasons || placed.typeKeys || placed.otherTypeText || placed.projectEffectKey
        || placed.details || placed.files || placed.general.length
        || Object.keys(placed.project).length || Object.keys(placed.items).length || Object.keys(placed.newItems).length;
      if (!anyPlaced) placed.general.push(err?.message || 'The change request could not be sent.');
      showServerErrors(placed);
    } finally {
      setSubmitting(false);
    }
  };

  const local = attempted ? problems : null;
  const shownProblems = {
    reasons: serverErrors.reasons ?? local?.reasons ?? null,
    typeKeys: serverErrors.typeKeys ?? local?.typeKeys ?? null,
    otherTypeText: serverErrors.otherTypeText ?? local?.otherTypeText ?? null,
    projectEffectKey: serverErrors.projectEffectKey ?? local?.projectEffectKey ?? null,
    details: serverErrors.details ?? local?.details ?? null,
    project: { ...(local?.project ?? {}), ...serverErrors.project },
    items: { ...(local?.items ?? {}), ...serverErrors.items },
    newItems: { ...(local?.newItems ?? {}), ...serverErrors.newItems },
    files: serverErrors.files ?? local?.files ?? null,
    general: [...(local?.general ?? []), ...serverErrors.general],
  };
  const shownCount = (shownProblems.reasons ? 1 : 0) + (shownProblems.details ? 1 : 0) + (shownProblems.files ? 1 : 0)
    + (shownProblems.typeKeys ? 1 : 0) + (shownProblems.otherTypeText ? 1 : 0) + (shownProblems.projectEffectKey ? 1 : 0)
    + Object.values(shownProblems.project).reduce((n, p) => n + Object.keys(p).length, 0)
    + Object.values(shownProblems.items).reduce((n, p) => n + Object.keys(p).length, 0)
    + Object.values(shownProblems.newItems).reduce((n, p) => n + Object.keys(p).length, 0)
    + groupProblems(shownProblems.general).count;

  return {
    reasons,
    toggleReason,
    typeKeys,
    toggleType,
    otherTypeText,
    setOtherTypeText,
    projectEffectKey,
    setProjectEffect,
    details,
    setDetails,
    proposed,
    projectEdits,
    setProjectField,
    window,
    items,
    adding,
    addItem,
    removeItem,
    setItemField,
    setItemCycles,
    plans,
    ...newItemsPart,
    ...filesPart,
    shownProblems,
    shownCount,
    submit,
    submitting,
    check,
    showServerErrors,
    refusedCount,
    draft,
    asks,
  };
}
