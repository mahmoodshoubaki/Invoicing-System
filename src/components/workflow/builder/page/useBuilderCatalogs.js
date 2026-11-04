'use client';

import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { STEP_TYPE, TRIGGER_KIND } from '@/constants/workflow';
import { conditionFields } from '@/lib/workflowBuilderState';
import {
  personNames, withLookupOptions, withPersonNames, withPersonNamesByType,
} from '@/lib/workflowFieldOptions';
import {
  selectBillingFrequencies, selectBoqItemStatuses, selectChangeRequestProjectEffects,
} from '@/store/slices/lookupsSlice';
import { fetchFields, selectFieldsByTargetType } from '@/store/slices/workflowSlice';

const EMPTY_FIELDS = [];

/**
 * @param {{ state: Object, resolvedById: Object }} options
 */
export function useBuilderCatalogs({ state, resolvedById }) {
  const dispatchRedux = useDispatch();

  useEffect(() => {
    if (state.targetTypeKey != null) dispatchRedux(fetchFields(state.targetTypeKey));
  }, [dispatchRedux, state.targetTypeKey]);

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

  const rawFieldsByTargetType = useSelector(selectFieldsByTargetType);
  const boqItemStatuses = useSelector(selectBoqItemStatuses);
  const billingFrequencies = useSelector(selectBillingFrequencies);
  const projectEffects = useSelector(selectChangeRequestProjectEffects);
  const changeRequestProjectEffects = useMemo(
    () => projectEffects.map((e) => ({ id: e.key, label: e.label })),
    [projectEffects]
  );
  const peopleNames = useMemo(() => personNames(resolvedById), [resolvedById]);
  const fieldsByTargetType = useMemo(
    () => withPersonNamesByType(
      withLookupOptions(rawFieldsByTargetType, { boqItemStatuses, billingFrequencies, changeRequestProjectEffects }),
      peopleNames
    ),
    [rawFieldsByTargetType, boqItemStatuses, billingFrequencies, changeRequestProjectEffects, peopleNames]
  );
  const catalogFields = fieldsByTargetType[state.targetTypeKey] ?? EMPTY_FIELDS;

  const fields = useMemo(
    () => withPersonNames(conditionFields(state, catalogFields), peopleNames),
    [state, catalogFields, peopleNames]
  );

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

  return { fieldsByTargetType, fields, declaredVariables, taskFields: catalogFields };
}
