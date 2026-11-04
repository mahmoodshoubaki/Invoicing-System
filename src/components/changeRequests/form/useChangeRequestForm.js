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
 * A change request being written (2026-10-18; sent to the API 2026-10-19): one
 * draft — the reasons, the additional details, each sub-project's changes and
 * each item's — and what is wrong with it.
 *
 * Adding an item loads its invoicing plan, which is also how the form learns
 * whether the item has an invoice (and so cannot be in a request). Changing an
 * item's billing frequency or updated expected invoicing date rebuilds its
 * plan, exactly as the BOQ item form does — inside the contract dates the
 * request leaves, so setting a contract duration makes a plan rebuildable on a
 * project that has none.
 *
 * Submit runs every check first; then `onSubmit(body)` sends it. A refusal is
 * put back under the box it is about.
 *
 * A workflow task (2026-10-20) asks for only some of the parts (`asks`): the
 * rest stay as the request has them — not editable here, and their problems
 * not shown. The task sends its own answer, through `check` and
 * `showServerErrors` rather than `submit`.
 *
 * @param {{
 *   boqItems: Array, statusNameOf: (statusId) => string|null, subProjects: Array,
 *   initial?: Object|null, onSubmit?: (body: Object) => Promise<void>,
 *   asks?: typeof ALL_PARTS,
 * }} options
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
  // Ticks each time Submit is refused — by the checks or by the server — so the form can show the first problem.
  const [refusedCount, setRefusedCount] = useState(0);
  // Only the newest plan rebuild of an item lands — an older answer arriving late is dropped.
  const rebuildSeq = useRef({});

  const proposed = useMemo(() => proposedSubProjects(subProjects, projectEdits), [subProjects, projectEdits]);
  const window = useMemo(() => contractWindow(proposed), [proposed]);
  // An edit answers the server's last refusal.
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

  /** As the BOQ item form: the plan regenerated from the frequency and the updated date, committed cycles kept. */
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
    // A plan the task does not ask for is the request's — not rebuilt here.
    if (PLAN_ANCHORS.includes(key) && asks.cycleChanges) rebuildPlan(itemId, values);
    edited();
  };

  const setItemCycles = (itemId, cycles) => {
    if (!asks.cycleChanges) return;
    setItems((prev) => prev.map((d) => (d.itemId === itemId ? { ...d, cycles: toPlanCycles(cycles) } : d)));
    edited();
  };

  /** Every check, shown from now on; whether the request may go. */
  const check = () => {
    setAttempted(true);
    if (problems.count === 0) return true;
    setRefusedCount((n) => n + 1);
    return false;
  };

  /** A refusal, mapped by mapServerErrors, under the boxes it is about. */
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
      // A refusal with nothing to place (BOQ-017 a request already open, BOQ-019 a locked item, PRJ-002 EPM) is said whole.
      const anyPlaced = placed.reasons || placed.typeKeys || placed.otherTypeText || placed.projectEffectKey
        || placed.details || placed.files || placed.general.length
        || Object.keys(placed.project).length || Object.keys(placed.items).length || Object.keys(placed.newItems).length;
      if (!anyPlaced) placed.general.push(err?.message || 'The change request could not be sent.');
      showServerErrors(placed);
    } finally {
      setSubmitting(false);
    }
  };

  // Problems show once Submit has been pressed — not on a fresh form; the server's always.
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
    // Counted as the problems panel shows them: a run of late cycles on one item is one.
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
