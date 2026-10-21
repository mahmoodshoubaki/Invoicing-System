'use client';

import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useToast } from '@/hooks/useToast';
import { workflowRepository } from '@/repositories/workflowRepository';
import { faultedAgain } from '@/lib/runVariables';
import {
  advanceInstance, cancelInstance, didAdvance, pauseInstance, resumeInstance,
} from '@/store/slices/workflowRunsSlice';

/**
 * What can be done to a run from its page — advance, pause, stop, resume, and
 * hand a pending to-do on — with the dialog each one opens.
 *
 * Every action reloads the run afterwards, success or not: the run's status,
 * its tasks and the history row the action just wrote all move together.
 *
 * @param {{ instanceId: string, run: Object|null, load: () => void }} options
 */
export function useRunActions({ instanceId, run, load }) {
  const dispatch = useDispatch();
  const toast = useToast();

  const [resuming, setResuming] = useState(false);
  /** 'pause' or 'cancel' while the stop dialog is open; null when it is not. */
  const [stopping, setStopping] = useState(null);
  /** The to-do being handed on, while the dialog is open. */
  const [handingOn, setHandingOn] = useState(null);
  const [reassigning, setReassigning] = useState(false);

  const handleAdvance = useCallback(async () => {
    const before = run;
    const result = await dispatch(advanceInstance({ instanceId }));

    if (advanceInstance.rejected.match(result)) {
      toast.error('Could not advance this run', result.payload);
      return;
    }

    // A 200 is not proof of movement: on a run that has given up, Advance
    // returns quietly having done nothing at all.
    if (didAdvance(before, result.payload)) toast.success('Run advanced');
    else toast.info('Nothing moved', 'It is waiting on something — a person, a delay, or a deadline.');

    load();
  }, [dispatch, instanceId, load, run, toast]);

  const handleStop = useCallback(async ({ reason }) => {
    const pausing = stopping === 'pause';
    const thunk = pausing ? pauseInstance : cancelInstance;
    const result = await dispatch(thunk({ instanceId, reason }));

    if (thunk.rejected.match(result)) {
      // WF-001 lands here — the run stopped being Running between the screen
      // rendering the button and somebody pressing it. A 400 lands here too if
      // the reason were ever empty, which the dialog prevents.
      toast.error(pausing ? 'Could not pause this run' : 'Could not stop this run', result.payload);
      return;
    }

    setStopping(null);
    if (pausing) {
      toast.success('Run paused', 'Resume picks it up where it stopped.');
    } else {
      toast.success('Run stopped', 'Any to-dos it was asking have been withdrawn.');
    }
    // Reloads all three: the run's status, its tasks, and the history row
    // carrying the reason that was just written.
    load();
  }, [dispatch, instanceId, load, stopping, toast]);

  /*
   * Resolves to `{ errors }` when a corrected value was refused (WF-058) —
   * nothing saved, the run where it was — so the dialog stays open with each
   * complaint under its value. A resumed run is read again: a value can still
   * be wrong, and the step faults on it again (2026-10-21).
   */
  const handleResume = useCallback(async ({ notes, resetStepCount, variableChanges }) => {
    const result = await dispatch(resumeInstance({ instanceId, notes, resetStepCount, variableChanges }));

    if (resumeInstance.rejected.match(result)) {
      toast.error('Could not resume this run', result.payload);
      return { errors: result.meta?.errors ?? null };
    }

    setResuming(false);
    const again = faultedAgain(result.payload);
    if (again) toast.error('Resumed, but it stopped again', again);
    else toast.success('Run resumed');
    load();
    return null;
  }, [dispatch, instanceId, load, toast]);

  /*
   * Straight to the repository rather than through the My Tasks slice: that
   * slice's reassign records its failures as the My Tasks screen's own error,
   * and a refusal here has nothing to do with that list. The run is reloaded
   * either way — the handover creates a new to-do with a new id, and a refusal
   * (WF-005) usually means somebody answered it first.
   */
  const handleReassign = useCallback(async ({ toUserIds, toRoleIds }) => {
    setReassigning(true);
    try {
      await workflowRepository.reassignTask({ instanceId, taskId: handingOn.taskId, toUserIds, toRoleIds });
      setHandingOn(null);
      toast.success('Task handed on', 'It is in their list now, with the same due date.');
    } catch (err) {
      toast.error('Could not hand this task on', err.message);
    } finally {
      setReassigning(false);
      load();
    }
  }, [handingOn, instanceId, load, toast]);

  return {
    handleAdvance,
    stopping, askToStop: setStopping, cancelStop: () => setStopping(null), handleStop,
    resuming, askToResume: () => setResuming(true), cancelResume: () => setResuming(false), handleResume,
    handingOn, askToReassign: setHandingOn, cancelReassign: () => setHandingOn(null), reassigning, handleReassign,
  };
}
