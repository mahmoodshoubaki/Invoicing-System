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
