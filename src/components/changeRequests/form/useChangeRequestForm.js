'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { boqRepository } from '@/repositories/boqRepository';
import { invoicedBlocker, statusBlocker } from '@/lib/changeRequest/eligibility';
import { PLAN_ANCHORS, itemDraftFrom, toPlanCycles } from '@/lib/changeRequest/itemDraft';
import { applyProjectEdit, contractWindow, proposedSubProjects } from '@/lib/changeRequest/projectDraft';
import { ALL_PARTS, changeRequestProblems, problemsAskedFor } from '@/lib/changeRequest/checks';
import { createChangeRequestBody, mapServerErrors } from '@/lib/changeRequest/payload';
import { groupProblems } from '@/lib/changeRequest/problemText';

const NO_SERVER_ERRORS = { reasons: null, details: null, project: {}, items: {}, general: [] };
const EMPTY = { reasons: [], details: '', projectEdits: {}, items: [] };

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
  const [reasons, setReasons] = useState(start.reasons);
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

  const draft = useMemo(() => ({ reasons, details, projectEdits, items }), [reasons, details, projectEdits, items]);
  const proposed = useMemo(() => proposedSubProjects(subProjects, projectEdits), [subProjects, projectEdits]);
  const window = useMemo(() => contractWindow(proposed), [proposed]);
  const problems = useMemo(() => {
    const all = changeRequestProblems(draft, { subProjects, allItems: boqItems });
    return asks === ALL_PARTS ? all : problemsAskedFor(all, asks, draft);
  }, [draft, subProjects, boqItems, asks]);

  // An edit answers the server's last refusal.
  const edited = () => setServerErrors(NO_SERVER_ERRORS);

  const toggleReason = (key) => {
    setReasons((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    edited();
  };

  const setDetails = (text) => {
    setDetailsText(text);
    edited();
  };

  const setProjectField = (uid, key, value) => {
    if (!asks.fieldChanges) return;
    setProjectEdits((prev) => applyProjectEdit(prev, subProjects, uid, key, value));
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
    const blocked = statusBlocker(item, statusNameOf(item.statusId));
    if (blocked) {
      setAdding({ itemId: null, error: `${name}: ${blocked}` });
      return;
    }
    setAdding({ itemId: item.id, error: null });
    try {
      const cycles = await boqRepository.getTrackerCycles(item.id);
      const invoiced = invoicedBlocker(cycles);
      if (invoiced) {
        setAdding({ itemId: null, error: `${name}: ${invoiced}` });
        return;
      }
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
    const { body, fieldIndex, cycleIndex } = createChangeRequestBody({ draft, subProjects });
    setSubmitting(true);
    setServerErrors(NO_SERVER_ERRORS);
    try {
      await onSubmit(body);
    } catch (err) {
      const placed = mapServerErrors(err?.errors, { fieldIndex, cycleIndex });
      // A refusal with nothing to place (BOQ-017 a request already open, BOQ-019 a locked item, PRJ-002 EPM) is said whole.
      const anyPlaced = placed.reasons || placed.details || placed.general.length || Object.keys(placed.project).length || Object.keys(placed.items).length;
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
    details: serverErrors.details ?? local?.details ?? null,
    project: { ...(local?.project ?? {}), ...serverErrors.project },
    items: { ...(local?.items ?? {}), ...serverErrors.items },
    general: [...(local?.general ?? []), ...serverErrors.general],
  };
  const shownCount = (shownProblems.reasons ? 1 : 0) + (shownProblems.details ? 1 : 0)
    + Object.values(shownProblems.project).reduce((n, p) => n + Object.keys(p).length, 0)
    + Object.values(shownProblems.items).reduce((n, p) => n + Object.keys(p).length, 0)
    // Counted as the problems panel shows them: a run of late cycles on one item is one.
    + groupProblems(shownProblems.general).count;

  return {
    reasons,
    toggleReason,
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
