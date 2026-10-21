/**
 * The step types that hold other steps, and what each draws on the canvas
 * below its header: the lists of steps inside it. Their own settings are in
 * the side panel like every other step's.
 */

import { STEP_TYPE } from '@/constants/workflow';

import { BranchBody } from './BranchBody';
import { ForEachBody } from './ForEachBody';
import { ParallelBranches } from './ParallelBranches';
import { RepeatBody } from './RepeatBody';

export const CONTAINER_BODIES = {
  [STEP_TYPE.BRANCH]: BranchBody,
  [STEP_TYPE.FOR_EACH]: ForEachBody,
  [STEP_TYPE.REPEAT]: RepeatBody,
  [STEP_TYPE.PARALLEL]: ParallelBranches,
};
