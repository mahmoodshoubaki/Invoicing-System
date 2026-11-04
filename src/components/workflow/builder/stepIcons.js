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

export const FALLBACK_STEP_ICON = Bot;

export const stepIcon = (type) => STEP_ICONS[type] ?? FALLBACK_STEP_ICON;
