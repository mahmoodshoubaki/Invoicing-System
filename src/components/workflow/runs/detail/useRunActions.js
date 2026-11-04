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
 * @param {{ instanceId: string, run: Object|null, load: () => void }} options
 */
export function useRunActions({ instanceId, run, load }) {
  const dispatch = useDispatch();
  const toast = useToast();

  const [resuming, setResuming] = useState(false);
  const [stopping, setStopping] = useState(null);
  const [handingOn, setHandingOn] = useState(null);
  const [reassigning, setReassigning] = useState(false);

  const handleAdvance = useCallback(async () => {
    const before = run;
    const result = await dispatch(advanceInstance({ instanceId }));

    if (advanceInstance.rejected.match(result)) {
      toast.error('Could not advance this run', result.payload);
      return;
    }

    if (didAdvance(before, result.payload)) toast.success('Run advanced');
    else toast.info('Nothing moved', 'It is waiting on something — a person, a delay, or a deadline.');

    load();
  }, [dispatch, instanceId, load, run, toast]);

  const handleStop = useCallback(async ({ reason }) => {
    const pausing = stopping === 'pause';
    const thunk = pausing ? pauseInstance : cancelInstance;
    const result = await dispatch(thunk({ instanceId, reason }));

    if (thunk.rejected.match(result)) {
      toast.error(pausing ? 'Could not pause this run' : 'Could not stop this run', result.payload);
      return;
    }

    setStopping(null);
    if (pausing) {
      toast.success('Run paused', 'Resume picks it up where it stopped.');
    } else {
      toast.success('Run stopped', 'Any to-dos it was asking have been withdrawn.');
    }
    load();
  }, [dispatch, instanceId, load, stopping, toast]);

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

  const handleReassign = useCallback(async ({ toUserIds, toRoleIds, toGroupIds }) => {
    setReassigning(true);
    try {
      await workflowRepository.reassignTask({ instanceId, taskId: handingOn.taskId, toUserIds, toRoleIds, toGroupIds });
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
