/** Each step type's icon — on its canvas card, and at the top of its side panel. */

import {
  BellRing, Bot, Clock, GitFork, Layers, Repeat, Search, UserCheck, Variable,
} from 'lucide-react';

import { STEP_TYPE } from '@/constants/workflow';

export const STEP_ICONS = {
  [STEP_TYPE.HUMAN_TASK]: UserCheck,
  [STEP_TYPE.AUTOMATED]: Bot,
  [STEP_TYPE.DELAY]: Clock,
  [STEP_TYPE.BRANCH]: GitFork,
  [STEP_TYPE.FOR_EACH]: Repeat,
  [STEP_TYPE.REPEAT]: Repeat,
  [STEP_TYPE.QUERY]: Search,
  [STEP_TYPE.PARALLEL]: Layers,
  [STEP_TYPE.SET_VARIABLE]: Variable,
  [STEP_TYPE.SEND_NOTIFICATION]: BellRing,
};

/** For a type this screen does not know. Looked up as `STEP_ICONS[type] ?? FALLBACK_STEP_ICON`, a plain
 * lookup, so the compiler can see the component is not made during render. */
export const FALLBACK_STEP_ICON = Bot;

export const stepIcon = (type) => STEP_ICONS[type] ?? FALLBACK_STEP_ICON;
