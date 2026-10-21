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
 * Everything the start-run dialog knows and does: the workflow's definition,
 * the records and answers being filled in, whether it can start — and, once
 * started, the run and the one nudge its status allows.
 *
 * A workflow that starts on an event can be started here too (2026-10-13): on
 * ONE record, as if its event had just happened there, asking for nothing —
 * any input sent is refused (WF-022). Several records would leave the run
 * without the record's values the event gives it, so it takes exactly one.
 *
 * @param {{
 *   workflow: { code: string, name?: string }, open: boolean,
 *   presetTargetIds: string[]|null, presetTargetTypeKey: number|null,
 *   onStarted?: (instance: Object) => void,
 * }} options
 */
export function useStartRun({ workflow, open, presetTargetIds, presetTargetTypeKey, onStarted }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const isAdvancing = useSelector(selectIsAdvancing);

  const [definition, setDefinition] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [targetText, setTargetText] = useState('');
  // Project codes are picked from the real list — the backend does not check a
  // typed code exists. Falls back to the text box if the list cannot be read.
  const [pickedCodes, setPickedCodes] = useState([]);
  const [projectListUnavailable, setProjectListUnavailable] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [instance, setInstance] = useState(null);

  const code = workflow?.code ?? null;
  // A run starts on the LIVE version, so its form is the live version's. By
  // code alone GetDefinition returns the draft first (2026-10-11), whose inputs
  // may not be published yet.
  const liveId = workflow?.activeDefinitionId ?? null;

  /*
   * The trigger's declared inputs come from the definition, not from the list
   * row — the row knows the trigger's KIND but not the little form it declares.
   *
   * Loads only. There is deliberately no "clear the last workflow's answers"
   * here: the page mounts this fresh per workflow, so every field already
   * starts empty. Resetting in an effect would be a synchronous double render
   * and would leave the previous workflow's answers on screen for a frame.
   */
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

  /*
   * A record handed in has to be the kind this workflow tracks. Lists only
   * offer matching workflows, but the definition is the authority — and
   * starting a BOQ workflow "on invoice 12" would really start it on BOQ item 12.
   */
  const presetMismatch = preset && definition != null && presetTargetTypeKey != null
    && definition.targetTypeKey !== presetTargetTypeKey;

  /** Type and required checks, in the same words the save button would use. */
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

    // Only what was actually typed travels. An untouched box means "use the
    // declared default", and sending "" would overwrite that with empty.
    const inputs = {};
    for (const variable of declaredInputs) {
      const raw = answers[variable.name];
      if (raw != null && String(raw).trim() !== '') inputs[variable.name] = String(raw).trim();
    }

    // The whole list is one run. A workflow that tracks nothing must send an
    // empty array rather than the ids of a previous selection — either way
    // round is WF-017.
    const result = await dispatch(startInstance({
      code,
      targetIds: needsTarget ? targetIds : [],
      inputs,
      values: {},
    }));
    setSubmitting(false);

    if (startInstance.rejected.match(result)) {
      // Shown as sent. WF-016 in particular names every id already held by a
      // run of this workflow, which is the part the user needs; nothing we
      // could write here would know those ids.
      toast.error('Could not start this workflow', result.payload);
      return;
    }

    setInstance(result.payload);
    toast.success('Run started', workflow?.name ?? undefined);
    // Lets a caller showing the record's runs pick up the new one.
    onStarted?.(result.payload);
  }, [answers, code, declaredInputs, dispatch, needsTarget, onStarted, targetIds, toast, workflow]);

  /**
   * Advance, or resume — the status decides which, and they are not
   * interchangeable: advancing a faulted run answers 200 and does nothing.
   */
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

    // A 200 is not proof of movement. Saying "advanced" to somebody whose run
    // sat still is worse than saying nothing.
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
