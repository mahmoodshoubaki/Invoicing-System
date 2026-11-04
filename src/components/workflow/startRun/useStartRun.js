'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useToast } from '@/hooks/useToast';
import { INSTANCE_STATUS, TARGET_TYPE, TRIGGER_KIND } from '@/constants/workflow';
import { typeMismatch } from '@/lib/workflowBuilderState';
import { workflowRepository } from '@/repositories/workflowRepository';
import {
  advanceInstance, didAdvance, resumeInstance, runAction, selectIsAdvancing, startInstance,
} from '@/store/slices/workflowRunsSlice';
import { parseTargetIds } from './startRunShared';

/**
 * @param {{ workflow: { code: string, name?: string }, open: boolean, presetTargetIds: string[]|null, presetTargetTypeKey: number|null, onStarted?: (instance: Object) => void, }} options
 */
export function useStartRun({ workflow, open, presetTargetIds, presetTargetTypeKey, onStarted }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const isAdvancing = useSelector(selectIsAdvancing);

  const [definition, setDefinition] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [targetText, setTargetText] = useState('');
  const [pickedCodes, setPickedCodes] = useState([]);
  const [projectListUnavailable, setProjectListUnavailable] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [instance, setInstance] = useState(null);

  const code = workflow?.code ?? null;
  const liveId = workflow?.activeDefinitionId ?? null;

  useEffect(() => {
    if (!open || !code) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const loaded = await workflowRepository.getDefinition(liveId ? { definitionId: liveId } : { code });
        if (!cancelled) setDefinition(loaded);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Could not load this workflow.');
      }
    })();

    return () => { cancelled = true; };
  }, [open, code, liveId]);

  const declaredInputs = useMemo(() => {
    if (definition?.trigger?.kind !== TRIGGER_KIND.MANUAL) return [];
    return definition.trigger.inputs ?? [];
  }, [definition]);

  const needsTarget = definition != null && definition.targetTypeKey !== TARGET_TYPE.NONE;
  const isEvent = definition?.trigger?.kind === TRIGGER_KIND.EVENT;
  const preset = Array.isArray(presetTargetIds) && presetTargetIds.length > 0;
  const picksProjects = definition?.targetTypeKey === TARGET_TYPE.PROJECT && !projectListUnavailable;
  const typedIds = useMemo(() => parseTargetIds(targetText), [targetText]);
  const targetIds = preset ? presetTargetIds.map(String) : picksProjects ? pickedCodes : typedIds;

  const presetMismatch = preset && definition != null && presetTargetTypeKey != null
    && definition.targetTypeKey !== presetTargetTypeKey;

  const problems = useMemo(() => {
    const found = {};
    for (const variable of declaredInputs) {
      const raw = answers[variable.name] ?? '';
      if (variable.required && !String(raw).trim() && variable.defaultValue == null) {
        found[variable.name] = 'Needed to start this run.';
        continue;
      }
      const why = typeMismatch(raw, variable.type);
      if (why) found[variable.name] = `That is ${why}.`;
    }
    return found;
  }, [answers, declaredInputs]);

  const ready = definition != null
    && !presetMismatch
    && Object.keys(problems).length === 0
    && (!needsTarget || (isEvent ? targetIds.length === 1 : targetIds.length > 0));

  const handleStart = useCallback(async () => {
    setSubmitting(true);

    const inputs = {};
    for (const variable of declaredInputs) {
      const raw = answers[variable.name];
      if (raw != null && String(raw).trim() !== '') inputs[variable.name] = String(raw).trim();
    }

    const result = await dispatch(startInstance({
      code,
      targetIds: needsTarget ? targetIds : [],
      inputs,
      values: {},
    }));
    setSubmitting(false);

    if (startInstance.rejected.match(result)) {
      toast.error('Could not start this workflow', result.payload);
      return;
    }

    setInstance(result.payload);
    toast.success('Run started', workflow?.name ?? undefined);
    onStarted?.(result.payload);
  }, [answers, code, declaredInputs, dispatch, needsTarget, onStarted, targetIds, toast, workflow]);

  const handleNudge = useCallback(async () => {
    const action = runAction(instance);
    if (!action) return;

    const before = instance;
    const result = await dispatch(
      action === 'resume'
        ? resumeInstance({ instanceId: instance.instanceId })
        : advanceInstance({ instanceId: instance.instanceId })
    );

    const thunk = action === 'resume' ? resumeInstance : advanceInstance;
    if (thunk.rejected.match(result)) {
      toast.error(
        action === 'resume' ? 'Could not resume this run' : 'Could not advance this run',
        result.payload
      );
      return;
    }

    setInstance(result.payload);

    if (didAdvance(before, result.payload)) {
      toast.success(action === 'resume' ? 'Run resumed' : 'Run advanced');
    } else {
      toast.info('Nothing moved', 'The run is waiting on something — a person, a delay, or a deadline.');
    }
  }, [dispatch, instance, toast]);

  return {
    definition, loadError, instance, submitting, isAdvancing,
    declaredInputs, needsTarget, isEvent, preset, presetMismatch, picksProjects, targetIds, problems, ready,
    targetText, setTargetText, pickedCodes, setPickedCodes,
    markProjectListUnavailable: () => setProjectListUnavailable(true),
    answers, setAnswer: (name, value) => setAnswers((prev) => ({ ...prev, [name]: value })),
    handleStart, handleNudge,
    nudge: runAction(instance),
    loopStopped: instance?.statusKey === INSTANCE_STATUS.FAULTED
      && /loop|step count|steps in one run|life of this run/i.test(instance.failureReason ?? ''),
  };
}
