import { PICKED_TARGETS_LIST, STEP_TYPE, TARGET_TYPE_LABELS, TRIGGER_KIND } from '@/constants/workflow';
import { validateFilterGroup } from '@/lib/filterDescription';

import { availableLists, isItemShapeUnknown, itemFields } from '../fields';
import { catchAllAt, eachStep } from '../graph';
import { declaredVariableNames, defaultValueErrors } from '../variables';
import { unknownTypeErrors } from './notificationTypes';
import { validateStageDeadline } from './stageDeadline';
import { validateStep } from './validateStep';

/** The whole definition's rules, run before a save. */

/**
 * Everything that would make SaveDefinition fail, checked before the request.
 *
 * The backend refuses each of these anyway — the point is that a save error is
 * a poor way to learn the rules, and a 500 from a malformed payload is a worse
 * one.
 *
 * @param {Object} state
 * @param {Array} [fields] the target type's field catalog, for checking
 *   conditions. Omitted or empty means field-level checks are skipped rather
 *   than every condition being reported as wrong — `GetFields` is
 *   `Workflows.Manage`-gated and can legitimately not have loaded.
 * @returns {{errors: string[], warnings: string[]}} errors block saving;
 *   warnings are about workflows that save fine and then behave oddly.
 */
export function validateDefinition(
  state, fields = [], fieldsByTargetType = {}, actions = [], events = [], notificationTypes = null
) {
  const errors = [];
  const warnings = [];

  // What the notification checks need: which steps are human tasks (a Send
  // notification may point at one), and which type keys exist. A null type
  // list means it could not be read, and type keys are then not judged.
  const humanTaskIds = new Set();
  eachStep(state.graph, (step) => {
    if (step.type === STEP_TYPE.HUMAN_TASK && step.id) humanTaskIds.add(step.id);
  });
  const notificationTypeKeys = notificationTypes ? new Set(notificationTypes.map((t) => t.key)) : null;
  errors.push(...unknownTypeErrors(state.graph?.notifications, 'The workflow', notificationTypeKeys));
  if (state.graph?.notifications && !state.graph.notifications.failed) {
    warnings.push('Nobody is told when a run of this workflow stops with an error — "A run stops with an error" is unticked.');
  }

  // Needed to widen the catalog inside a forEach body — see `walkSteps` below.
  const lists = availableLists(state);

  /** What a `setVariable` may write to: declared variables + trigger inputs. */
  const declaredNames = declaredVariableNames(state);

  if (!state.name?.trim()) errors.push('A workflow needs a name.');
  if (state.targetTypeKey == null) errors.push('Choose what this workflow tracks.');

  const kind = state.trigger?.kind;
  if (kind === TRIGGER_KIND.EVENT && !state.trigger.eventName) {
    errors.push('An event trigger needs an event to listen for.');
  }

  /*
   * The event has to belong to what this workflow tracks — WF-023.
   *
   * Skipped when the catalog has not loaded, for the same reason the field
   * checks are: GetEvents is `Workflows.Manage`-gated, and reporting every
   * event as unknown because a fetch has not landed would be worse than not
   * checking. An event with no `targetTypeKey` is valid against any target.
   */
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

  /*
   * A schedule's filter is the one condition that runs before any instance
   * exists — it decides which records to start runs FOR. So there is no run to
   * answer a variable name, and only {{today}} / {{now}} resolve there. It also
   * searches rather than reads, so the same filterable rule as a query applies.
   */
  if (kind === TRIGGER_KIND.SCHEDULE && state.trigger.scan && fields.length > 0) {
    for (const problem of validateFilterGroup(state.trigger.scan, fields, {
      filterableOnly: true,
      builtinsOnly: true,
    })) {
      errors.push(`In the schedule's filter: ${problem}`);
    }
  }

  // A default has to fit the type it is declared against, or the run cannot
  // start — WF-044.
  for (const variable of state.variables ?? []) {
    errors.push(...defaultValueErrors(variable));
  }

  /*
   * `targets` is written by the engine on every hand-started run — event and
   * scheduled workflows can be started by hand too — and it overwrites
   * whatever was there. A variable or start-form field of that name would
   * silently lose its value, so the name is refused everywhere.
   */
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

  /** Human tasks that come back after escalating — checked across stages below. */
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
      // A stage may not transition back to itself. A stage *deadline* still may
      // — pointing a deadline at its own stage starts that stage over — but a
      // transition looping a stage onto itself re-runs its steps with nothing
      // changed, which is how a run spins until the engine's loop guard faults it.
      if (t.toStageId === stage.id) {
        errors.push(`"${stage.title || stage.id}" transitions back to itself. Point it at another stage, or end the run.`);
      }

      if (fields.length > 0) {
        for (const problem of validateFilterGroup(t.condition, fields)) {
          errors.push(`In "${stage.title || stage.id}": ${problem}`);
        }
      }
    }

    // First match wins, and an empty condition matches everything — so any
    // transition after a catch-all is unreachable. The builder no longer lets
    // one be created there, but a definition saved before that rule existed
    // still loads, and its dead arms have to be visible rather than quietly
    // rendered as though they did something.
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

    // Steps nest, so this walks the whole tree — a step broken three levels
    // inside a branch is just as unsaveable as one at the top, and an author
    // who cannot see it in the error list will never find it.
    /**
     * `scope` is the field catalog as seen from HERE.
     *
     * A `forEach` binds an item name, and conditions inside its body read that
     * item's fields — `invoice.totalAmount` and so on. Those fields exist only
     * inside the loop, so the catalog grows on the way down rather than being
     * one flat list: validating the body against the outer catalog would report
     * every legitimate item reference as an unknown field.
     */
    const walkSteps = (steps, inBranch, scope, blind) => {
      for (const step of steps ?? []) {
        const where = `"${step.title || step.id}" in "${stage.title || stage.id}"`;
        const stepResult = validateStep(step, where, scope, stageIds, blind, {
          declaredNames, actions, fieldsByTargetType, humanTaskIds, notificationTypeKeys,
          // What a task may ask to have filled: the tracked record's whole list.
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
          /*
           * GetFields for the queried type is fetched on load and may still be
           * in flight. Reporting every `invoice.totalAmount` in the body as an
           * unknown field for those few hundred milliseconds would put a wall
           * of red on a workflow that is perfectly valid — the same mistake as
           * flagging an escalation target because the stage list had not
           * arrived. So while the shape is genuinely unknown, the body's field
           * names are not judged at all.
           */
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

  /**
   * The two rules about coming back that no single step can see.
   *
   * A run holds one place to return to, so two overlapping returns have nowhere
   * to put the second, and a branch has no cursor of its own to come back to.
   */
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

  /**
   * Assignees removed on load because they can no longer answer a task.
   *
   * A step left with nobody at all is already a blocking error from
   * `validateStep`, so this only has to explain *why* it emptied. Where other
   * assignees remain the workflow still runs, so it is a warning — but the
   * author is told, because their stated intent has quietly changed.
   */
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
