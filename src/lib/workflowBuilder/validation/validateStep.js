import { STEP_TYPE } from '@/constants/workflow';

import { checkAutomated } from './steps/automated';
import { checkBranch, checkDelay, checkForEach, checkRepeat } from './steps/controlFlow';
import { checkHumanTask } from './steps/humanTask';
import { checkParallel } from './steps/parallel';
import { checkQuery } from './steps/query';
import { checkSendNotification } from './steps/sendNotification';
import { checkSetVariable } from './steps/setVariable';

const CHECKS = {
  [STEP_TYPE.HUMAN_TASK]: checkHumanTask,
  [STEP_TYPE.AUTOMATED]: checkAutomated,
  [STEP_TYPE.DELAY]: checkDelay,
  [STEP_TYPE.BRANCH]: checkBranch,
  [STEP_TYPE.FOR_EACH]: checkForEach,
  [STEP_TYPE.REPEAT]: checkRepeat,
  [STEP_TYPE.QUERY]: checkQuery,
  [STEP_TYPE.SEND_NOTIFICATION]: checkSendNotification,
  [STEP_TYPE.SET_VARIABLE]: checkSetVariable,
  [STEP_TYPE.PARALLEL]: checkParallel,
};

/**
 * @param {Object} step
 * @param {string} where
 * @param {Array} [fields]
 * @param {Set} [stageIds]
 * @param {boolean} [allowUnknownFields]
 * @param {Object} [catalog]
 * @param {Set} [catalog.declaredNames]
 * @param {Array} [catalog.actions]
 * @param {Array} [catalog.taskFields]
 * @param {Object} [catalog.fieldsByTargetType]
 * @returns {{errors: string[], warnings: string[]}}
 */
export function validateStep(
  step, where, fields = [], stageIds = new Set(), allowUnknownFields = false,
  {
    declaredNames = new Set(), actions = [], fieldsByTargetType = {},
    humanTaskIds = new Set(), notificationTypeKeys = null, taskFields = null,
  } = {}
) {
  const errors = [];
  const warnings = [];

  if (!step.id) errors.push(`${where} has no id.`);
  if (!step.title?.trim()) warnings.push(`${where} has no title, so it will be hard to recognise in a run.`);

  const check = Object.hasOwn(CHECKS, step.type) ? CHECKS[step.type] : null;
  check?.(step, {
    where, fields, stageIds, allowUnknownFields, declaredNames, actions,
    fieldsByTargetType, humanTaskIds, notificationTypeKeys, taskFields, errors, warnings,
  });

  return { errors, warnings };
}
