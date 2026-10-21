'use client';

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { STEP_TYPE, TRIGGER_KIND } from '@/constants/workflow';
import { conditionFields } from '@/lib/workflowBuilderState';
import {
  personNames, withLookupOptions, withPersonNames, withPersonNamesByType,
} from '@/lib/workflowFieldOptions';
import { selectBillingFrequencies, selectBoqItemStatuses } from '@/store/slices/lookupsSlice';
import { fetchFields, selectFieldsByTargetType } from '@/store/slices/workflowSlice';

/** Stable identity so an unloaded catalog does not re-run every memo below. */
const EMPTY_FIELDS = [];

/**
 * What the definition's conditions and steps can read: the field catalogs, the
 * condition fields, and the variables a Set variable step may write to.
 *
 * @param {{ state: Object, resolvedById: Object }} options
 */
export function useBuilderCatalogs({ state, resolvedById }) {
  const dispatchRedux = useDispatch();

  // The condition builder's field catalog, per target type. Changing what a
  // workflow tracks changes which fields its conditions can read, so this
  // follows `targetTypeKey` rather than loading once.
  useEffect(() => {
    if (state.targetTypeKey != null) dispatchRedux(fetchFields(state.targetTypeKey));
  }, [dispatchRedux, state.targetTypeKey]);

  /*
   * A `query` step can search a different module from the one the workflow
   * tracks, and a `forEach` over its results has to show what is IN a row. That
   * needs GetFields for the query's target type, not the workflow's — without
   * it the loop body can only offer the author a name to guess at.
   *
   * Keyed on the sorted list of types so this fires when a query's target
   * changes, not on every keystroke in the graph. The slice caches per type, so
   * a repeat dispatch for one already held is cheap.
   */
  const queriedTypes = useMemo(() => {
    const keys = new Set();
    const walk = (steps) => {
      for (const step of steps ?? []) {
        if (step.type === STEP_TYPE.QUERY && step.targetTypeKey != null) keys.add(step.targetTypeKey);
        walk(step.whenTrue); walk(step.whenFalse); walk(step.body);
        for (const branch of step.branches ?? []) walk(branch.steps);
      }
    };
    for (const stage of state.graph.stages) walk(stage.steps);
    return [...keys].sort();
  }, [state.graph]);

  const queriedTypesKey = queriedTypes.join(',');
  useEffect(() => {
    for (const key of queriedTypesKey ? queriedTypesKey.split(',').map(Number) : []) {
      dispatchRedux(fetchFields(key));
    }
  }, [queriedTypesKey, dispatchRedux]);

  /*
   * The field catalogs, with what GetFields leaves to us attached: names for a
   * BOQ item's statusId and billingFrequencyId (from the same lookup lists the
   * BOQ screens use, loaded app-wide), and people's names for every field that
   * holds a person. Done once here so the value boxes, the "Reads as"
   * sentences and the loop items all agree.
   */
  const rawFieldsByTargetType = useSelector(selectFieldsByTargetType);
  const boqItemStatuses = useSelector(selectBoqItemStatuses);
  const billingFrequencies = useSelector(selectBillingFrequencies);
  const peopleNames = useMemo(() => personNames(resolvedById), [resolvedById]);
  const fieldsByTargetType = useMemo(
    () => withPersonNamesByType(
      withLookupOptions(rawFieldsByTargetType, { boqItemStatuses, billingFrequencies }),
      peopleNames
    ),
    [rawFieldsByTargetType, boqItemStatuses, billingFrequencies, peopleNames]
  );
  const catalogFields = fieldsByTargetType[state.targetTypeKey] ?? EMPTY_FIELDS;

  /**
   * What conditions can compare against: the module's own fields, plus this
   * workflow's variables, plus every human task's answer. Without the last two
   * the commonest workflow of all — "if approved go here, if rejected go there"
   * — could not be expressed at all.
   */
  const fields = useMemo(
    () => withPersonNames(conditionFields(state, catalogFields), peopleNames),
    [state, catalogFields, peopleNames]
  );

  /**
   * Everything a `setVariable` step may write to, labelled for a dropdown.
   *
   * A manual trigger's inputs are variables too — the run is started with them
   * — so both sources appear, tagged so the author can tell which is which.
   */
  const declaredVariables = useMemo(() => {
    const rows = (state.variables ?? []).map((v) => ({
      name: v.name, label: v.label || v.name, type: v.type, source: 'variable',
    }));
    if (state.trigger?.kind === TRIGGER_KIND.MANUAL) {
      for (const input of state.trigger.inputs ?? []) {
        if (input?.name && !rows.some((r) => r.name === input.name)) {
          rows.push({ name: input.name, label: input.label || input.name, type: input.type, source: 'trigger' });
        }
      }
    }
    return rows;
  }, [state.variables, state.trigger]);

  // What a human task may ask to have filled: the tracked record's whole list,
  // an invoicing plan included — which conditions never see (2026-10-13).
  return { fieldsByTargetType, fields, declaredVariables, taskFields: catalogFields };
}
