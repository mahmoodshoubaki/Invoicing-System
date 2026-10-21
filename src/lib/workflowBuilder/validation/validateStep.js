import { STEP_TYPE } from '@/constants/workflow';

import { checkAutomated } from './steps/automated';
import { checkBranch, checkDelay, checkForEach, checkRepeat } from './steps/controlFlow';
import { checkHumanTask } from './steps/humanTask';
import { checkParallel } from './steps/parallel';
import { checkQuery } from './steps/query';
import { checkSendNotification } from './steps/sendNotification';
import { checkSetVariable } from './steps/setVariable';

/** One step's rules, by type — each type's live in ./steps/. */

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
 * One step's own rules. Split out so the step editors can show the same
 * problems inline, rather than an author having to find their step from a
 * message in a list at the top of the page.
 *
 * @param {Object} step
 * @param {string} where  human description of the step's location
 * @param {Array} [fields]
 * @param {Set} [stageIds]
 * @param {boolean} [allowUnknownFields]
 * @param {Object} [catalog] what the step is checked against beyond its own shape
 * @param {Set} [catalog.declaredNames] variables and manual-trigger inputs a
 *   `setVariable` may write to. Empty means "not known here" — the same guard
 *   `stageIds` uses, so a step validated in isolation does not report every
 *   name as undeclared.
 * @param {Array} [catalog.actions] from GetActions, each with its declared
 *   `inputs`. Empty means the catalog has not loaded, and no action is judged.
 * @param {Array} [catalog.taskFields] the tracked record's whole field list, invoicing plan
 *   included — what a human task may ask to have filled (2026-10-13).
 * @param {Object} [catalog.fieldsByTargetType] GetFields per target type. A
 *   `query` searches its OWN type, which need not be what the workflow
 *   tracks, so its filter is checked against that type's catalog, not `fields`.
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
