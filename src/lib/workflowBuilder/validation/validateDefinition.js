import { PICKED_TARGETS_LIST, STEP_TYPE, TARGET_TYPE_LABELS, TRIGGER_KIND } from '@/constants/workflow';
import { validateFilterGroup } from '@/lib/filterDescription';

import { availableLists, isItemShapeUnknown, itemFields } from '../fields';
import { catchAllAt, eachStep } from '../graph';
import { declaredVariableNames, defaultValueErrors } from '../variables';
import { unknownTypeErrors } from './notificationTypes';
import { validateStageDeadline } from './stageDeadline';
import { validateStep } from './validateStep';

/**
 * @param {Object} state
 * @param {Array} [fields]
 * @returns {{errors: string[], warnings: string[]}}
 */
export function validateDefinition(
  state, fields = [], fieldsByTargetType = {}, actions = [], events = [], notificationTypes = null
) {
  const errors = [];
  const warnings = [];

  const humanTaskIds = new Set();
  eachStep(state.graph, (step) => {
    if (step.type === STEP_TYPE.HUMAN_TASK && step.id) humanTaskIds.add(step.id);
  });
  const notificationTypeKeys = notificationTypes ? new Set(notificationTypes.map((t) => t.key)) : null;
  errors.push(...unknownTypeErrors(state.graph?.notifications, 'The workflow', notificationTypeKeys));
  if (state.graph?.notifications && !state.graph.notifications.failed) {
    warnings.push('Nobody is told when a run of this workflow stops with an error — "A run stops with an error" is unticked.');
  }

  const lists = availableLists(state);

  const declaredNames = declaredVariableNames(state);

  if (!state.name?.trim()) errors.push('A workflow needs a name.');
  if (state.targetTypeKey == null) errors.push('Choose what this workflow tracks.');

  const kind = state.trigger?.kind;
  if (kind === TRIGGER_KIND.EVENT && !state.trigger.eventName) {
    errors.push('An event trigger needs an event to listen for.');
  }

  if (kind === TRIGGER_KIND.EVENT && state.trigger.eventName && events.length > 0) {
    const match = events.find((e) => e.name === state.trigger.eventName);
    const tracked = TARGET_TYPE_LABELS[state.targetTypeKey] ?? 'what it tracks';

    if (!match) {
      errors.push(`"${state.trigger.eventName}" is not an event this system raises.`);
    } else if (match.targetTypeKey != null && match.targetTypeKey !== state.targetTypeKey) {
      const belongs = TARGET_TYPE_LABELS[match.targetTypeKey] ?? 'something else';
      errors.push(
        `"${match.name}" is about ${belongs}, but this workflow tracks ${tracked}. `
        + 'Pick an event for what it tracks, or change what it tracks.'
      );
    }
  }
  if (kind === TRIGGER_KIND.SCHEDULE && !state.trigger.cron?.trim()) {
    errors.push('A schedule trigger needs a cron expression.');
  }

  if (kind === TRIGGER_KIND.SCHEDULE && state.trigger.scan && fields.length > 0) {
    for (const problem of validateFilterGroup(state.trigger.scan, fields, {
      filterableOnly: true,
      builtinsOnly: true,
    })) {
      errors.push(`In the schedule's filter: ${problem}`);
    }
  }

  for (const variable of state.variables ?? []) {
    errors.push(...defaultValueErrors(variable));
  }

  const reservedClash = [
    ...(state.variables ?? []),
    ...(kind === TRIGGER_KIND.MANUAL ? state.trigger.inputs ?? [] : []),
  ].some((v) => v?.name === PICKED_TARGETS_LIST);
  if (reservedClash) {
    errors.push(
      `"${PICKED_TARGETS_LIST}" is filled in by the engine with the records a run was started on, so a variable cannot use that name.`
    );
  }

  const stages = state.graph?.stages ?? [];
  if (stages.length === 0) errors.push('A workflow needs at least one stage.');

  const stageIds = new Set(stages.map((s) => s.id));

  const comingBack = [];
  if (stageIds.size !== stages.length) errors.push('Two stages share an id.');
  if (stages.some((s) => !s.id)) errors.push('Every stage needs an id.');

  if (stages.length > 0 && !stageIds.has(state.graph.startStageId)) {
    errors.push('The starting stage does not exist.');
  }

  for (const stage of stages) {
    const transitions = stage.transitions ?? [];

    for (const t of transitions) {
      if (t.toStageId !== null && !stageIds.has(t.toStageId)) {
        errors.push(`"${stage.title || stage.id}" points at a stage that no longer exists.`);
      }
      if (t.toStageId === stage.id) {
        errors.push(`"${stage.title || stage.id}" transitions back to itself. Point it at another stage, or end the run.`);
      }

      if (fields.length > 0) {
        for (const problem of validateFilterGroup(t.condition, fields)) {
          errors.push(`In "${stage.title || stage.id}": ${problem}`);
        }
      }
    }

    const catchAllIndex = catchAllAt(transitions);
    if (catchAllIndex !== -1 && catchAllIndex < transitions.length - 1) {
      const dead = transitions.length - catchAllIndex - 1;
      errors.push(
        `In "${stage.title || stage.id}", the "otherwise" arm is not last, so the ${dead} transition${dead === 1 ? '' : 's'} below it can never be taken. Move it to the end, or give it a condition.`
      );
    }

    if (transitions.length === 0 && stage.id !== null) {
      warnings.push(`"${stage.title || stage.id}" has no transitions, so a run reaching it stops there.`);
    }

    const walkSteps = (steps, inBranch, scope, blind) => {
      for (const step of steps ?? []) {
        const where = `"${step.title || step.id}" in "${stage.title || stage.id}"`;
        const stepResult = validateStep(step, where, scope, stageIds, blind, {
          declaredNames, actions, fieldsByTargetType, humanTaskIds, notificationTypeKeys,
          taskFields: fieldsByTargetType[state.targetTypeKey] ?? null,
        });
        errors.push(...stepResult.errors);
        warnings.push(...stepResult.warnings);

        if (step.type === STEP_TYPE.HUMAN_TASK && step.overdue?.comeBack) {
          comingBack.push({ where, stage, toStageId: step.overdue.toStageId, inBranch });
        }

        let inner = scope;
        let innerBlind = blind;

        if (step.type === STEP_TYPE.FOR_EACH) {
          const bound = itemFields(step, lists, fieldsByTargetType);
          inner = [...scope, ...bound];
          if (isItemShapeUnknown(step, lists, fieldsByTargetType)) innerBlind = true;
        }

        walkSteps(step.whenTrue, inBranch, scope, blind);
        walkSteps(step.whenFalse, inBranch, scope, blind);
        walkSteps(step.body, inBranch, inner, innerBlind);
        for (const branch of step.branches ?? []) walkSteps(branch.steps, true, scope, blind);
      }
    };
    walkSteps(stage.steps, false, fields, false);

    errors.push(...validateStageDeadline(stage, stageIds));
  }

  for (const entry of comingBack) {
    if (entry.inBranch) {
      errors.push(`${entry.where} comes back after escalating, which cannot be done from inside a parallel branch.`);
    }

    const target = stages.find((s) => s.id === entry.toStageId);
    const targetAlsoReturns = target && comingBack.some((other) => other.stage.id === target.id);
    if (targetAlsoReturns) {
      errors.push(
        `${entry.where} comes back into "${target.title || target.id}", which also has a task that comes back. Only one at a time.`
      );
    }
  }

  for (const removed of state.removedAssignees ?? []) {
    const who = removed.displayName ?? `A former user (${String(removed.userId).slice(0, 8)}…)`;
    const why =
      removed.reason === 'missing'
        ? 'is no longer in the directory'
        : 'has been deactivated';
    const line = `${who} ${why}, so they were removed from "${removed.stepTitle}". Assign somebody else.`;

    if (removed.stillAssigned) warnings.push(line);
    else errors.push(line);
  }

  return { errors, warnings };
}
