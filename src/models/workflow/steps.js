/**
 * Step builders — `type` FIRST, always.
 *
 * ===========================================================================
 * THIS FILE IS THE ONLY PLACE ALLOWED TO CONSTRUCT A STEP OBJECT.
 *   (Split out of models/workflow.js, which re-exports it — the rule moved with it.)
 *
 * System.Text.Json rejects a polymorphic payload whose `type` discriminator
 * arrives after other properties, and it fails as a **500** — not as a tidy
 * validation error. `{"id":"x","type":"delay"}` breaks. `{"type":"delay",
 * "id":"x"}` is fine.
 *
 * Every builder below therefore writes `type` first. Two rules keep it that
 * way, and both matter:
 *
 *   1. Nothing outside this file builds a step literal. Import a builder.
 *   2. Never spread over a type field — `{...partial, type}` puts the
 *      discriminator LAST and reintroduces the bug silently.
 *
 * `openapi.json` cannot catch a mistake here: its StepDefinition is just
 * `{ id, title }` and it declares no discriminator, so there is no schema,
 * no codegen and no validation standing behind this. Only these functions.
 * ===========================================================================
 */

import { DEFAULT_AUTOMATED_MODE, HTTP_CALL_ACTION, STEP_TYPE } from '@/constants/workflow';
import { readDuration, writeDuration } from '@/utils/workflowDuration';

import { createFilterGroup, isEmptyFilterGroup } from './conditions';

/**
 * Every step type the palette may offer.
 *
 * Read the property order literally: `type` leads in all eight. That ordering
 * is the contract, not a style choice — see this file's header.
 *
 * `callApi` is absent on purpose. The JSON accepts the name and the executor
 * refuses it; an HTTP call is `automated` with `action: 'http.call'`.
 */
export const createStep = {
  /**
   * Stops and waits for a person.
   *
   * Several assignees means the FIRST to answer finishes it — that is settled
   * and deliberate. Two approvals that are both genuinely needed are two
   * steps, which `parallel` writes directly.
   */
  humanTask({
    id,
    title = '',
    assignToUserIds = [],
    assignToRoleIds = [],
    assignToExpressions = [],
    outcomes = [],
    overdue = null,
    notifications = undefined,
    fields = [],
    ...duration
  }) {
    const step = {
      type: STEP_TYPE.HUMAN_TASK,
      id,
      title,
      assignToUserIds,
      assignToRoleIds,
      // A third assignee source, resolved when the to-do is created rather than
      // when the workflow is drawn: `{{submittedBy}}` reaches whoever submitted
      // this particular invoice. All three lists union, and the existing rule
      // is unchanged — the first person to answer finishes it for everyone.
      assignToExpressions,
      // The due date is the same five optional units as a delay, spelled
      // `dueIn…`, plus the shared `excludeDays`. All optional: a task with no
      // due date simply never becomes overdue.
      ...writeDuration(readDuration(duration, 'dueIn'), 'dueIn'),
    };

    // Three behaviours, one checkbox apart:
    //   absent                        → nothing happens; the to-do just shows as overdue
    //   { toStageId }                 → the run leaves and the to-do is cancelled
    //   { toStageId, comeBack: true } → the run leaves, the to-do stays open, and
    //                                   answering it brings the run back
    if (overdue?.toStageId) {
      step.overdue = { toStageId: overdue.toStageId, comeBack: overdue.comeBack === true };
    }

    // Who is told what (2026-10-07). Absent = the engine's defaults (assigned,
    // handed to, handed from and cancelled on; no reminder), which is what
    // every step saved before this has. A new step writes them out.
    if (notifications !== undefined) step.notifications = notifications;

    // What whoever holds the task fills in on the record (2026-10-11):
    // `[{ name, required }]`, names exactly as GetFields gives them and only
    // `fillable` ones. Saved by an outcome with `requiresFields`.
    step.fields = fields;

    step.outcomes = outcomes;
    return step;
  },

  /**
   * Tells people something, then walks on — it never stops the run. Somebody
   * who cannot be reached is skipped and logged. Added 2026-10-07.
   *
   * People are picked like a human task's assignees; `toEmails` / `ccEmails`
   * are addresses that are not users (or a `{{field}}` holding one), and get
   * the email only. `taskStepId` names a human task in this workflow whose
   * details (title, due date, who has it, its answer) the words may use.
   *
   * CC (2026-10-08) is picked exactly like To. The two boxes say what CC
   * people get: the email (on its CC line) and/or an in-app notification of
   * their own. A step saved before them has no `ccGetsEmail`, which the
   * engine reads as true. `placeholderValues` are typed for the type's
   * placeholders — only the filled ones are kept.
   */
  sendNotification({
    id,
    title = '',
    notificationTypeKey = null,
    toUserIds = [],
    toRoleIds = [],
    toExpressions = [],
    toEmails = [],
    ccUserIds = [],
    ccRoleIds = [],
    ccExpressions = [],
    ccEmails = [],
    ccGetsEmail = true,
    ccGetsInApp = false,
    taskStepId = null,
    placeholderValues = {},
  }) {
    const step = {
      type: STEP_TYPE.SEND_NOTIFICATION,
      id,
      title,
      notificationTypeKey,
      toUserIds,
      toRoleIds,
      toExpressions,
      toEmails,
      ccUserIds,
      ccRoleIds,
      ccExpressions,
      ccEmails,
      ccGetsEmail,
      ccGetsInApp,
    };
    if (taskStepId) step.taskStepId = taskStepId;
    step.placeholderValues = placeholderValues;
    return step;
  },

  /** Calls something a module registered. */
  automated({
    id,
    title = '',
    action = '',
    inputs = {},
    mode = DEFAULT_AUTOMATED_MODE,
  }) {
    return {
      type: STEP_TYPE.AUTOMATED,
      id,
      title,
      action,
      inputs,
      mode,
    };
  },

  /**
   * An outbound HTTP call — an `automated` step with a particular action, not
   * a step type of its own.
   *
   * Headers ride in `inputs` as `header.<Name>` keys. Two placeholder kinds
   * exist and they are not the same thing: `{{invoiceNumber}}` is a value the
   * run holds, while `{{secrets.Name}}` is a credential resolved at the last
   * moment and never stored in the definition. Never write a real token here.
   */
  httpCall({
    id,
    title = '',
    url = '',
    method = 'GET',
    body = null,
    contentType = 'application/json',
    headers = {},
    mode = DEFAULT_AUTOMATED_MODE,
  }) {
    const inputs = { url, method, contentType };
    if (body != null && method !== 'GET') inputs.body = body;
    for (const [name, value] of Object.entries(headers)) {
      if (name) inputs[`header.${name}`] = value;
    }

    return {
      type: STEP_TYPE.AUTOMATED,
      id,
      title,
      action: HTTP_CALL_ACTION,
      inputs,
      mode,
    };
  },

  /** An if, inside a stage. */
  branch({ id, title = '', condition = createFilterGroup(), whenTrue = [], whenFalse = [] }) {
    return {
      type: STEP_TYPE.BRANCH,
      id,
      title,
      condition,
      whenTrue,
      whenFalse,
    };
  },

  /** Repeats its body once per item in a list variable. */
  forEach({ id, title = '', source = '', itemName = 'item', body = [] }) {
    return {
      type: STEP_TYPE.FOR_EACH,
      id,
      title,
      source,
      itemName,
      body,
    };
  },

  /**
   * Counted, or until a condition holds. Pass `times`, or `until` with
   * `maxIterations` — the unused arm is omitted rather than sent as null.
   */
  repeat({ id, title = '', times = null, until = null, maxIterations = null, body = [] }) {
    const step = {
      type: STEP_TYPE.REPEAT,
      id,
      title,
    };
    if (times != null) {
      step.times = times;
    } else {
      step.until = until ?? createFilterGroup();
      step.maxIterations = maxIterations;
    }
    step.body = body;
    return step;
  },

  /**
   * Holds the run for a set time, then carries on by itself.
   *
   * Five optional units — years, months, days, hours, minutes — plus
   * `excludeDays`. **Only what the author filled in is sent**, so a step that
   * waits three days carries `delayDays` alone rather than four zeroes saying
   * the same thing less clearly. The total must exceed zero: a delay somebody
   * placed is a delay they expect to pause.
   *
   * `type` stays the first key because the duration is spread in AFTER it.
   */
  delay({ id, title = '', ...duration }) {
    return {
      type: STEP_TYPE.DELAY,
      id,
      title,
      ...writeDuration(readDuration(duration, 'delay'), 'delay'),
    };
  },

  /**
   * Branches that all run at the same time, joined when every one is done — or
   * earlier if `joinWhen` holds, which cancels everything still open inside
   * the block.
   *
   * "At the same time" describes the *waiting*: two people are asked in the
   * same instant and neither blocks the other. The engine still walks the
   * branches one after another inside a single call.
   *
   * `joinWhen` is omitted entirely when absent — sending an empty group would
   * mean "stop immediately", since an empty group matches everything.
   */
  parallel({ id, title = '', branches = [], joinWhen = null }) {
    const step = {
      type: STEP_TYPE.PARALLEL,
      id,
      title,
    };
    if (joinWhen && !isEmptyFilterGroup(joinWhen)) step.joinWhen = joinWhen;
    step.branches = branches;
    return step;
  },

  /**
   * Asks a module which of its things match and puts the answer in a variable —
   * what fills the list a `forEach` walks.
   */
  query({ id, title = '', targetTypeKey = null, filter = createFilterGroup(), into = '', max = null }) {
    const step = {
      type: STEP_TYPE.QUERY,
      id,
      title,
      targetTypeKey,
      filter,
      into,
    };
    if (max != null) step.max = max;
    return step;
  },

  /**
   * Carries one value from one part of a run to another.
   *
   * Before this existed a variable could only be filled by a manual trigger
   * input, its own `defaultValue`, or a `query`'s `into` — so a run could not
   * record what it had decided and read it back later.
   *
   * `value` is a string template resolved and then parsed against the
   * variable's declared type, exactly as a condition value is. A literal is
   * just a template with no placeholders. Deliberately NOT an expression
   * language: `{{a}} + {{b}}` is not supported and will not be.
   */
  setVariable({ id, title = '', name = '', value = '' }) {
    return {
      type: STEP_TYPE.SET_VARIABLE,
      id,
      title,
      name,
      value,
    };
  },
};

/** One lane inside a `parallel` step. Not a step itself — it has no `type`. */
export function createParallelBranch({ id, title = '', steps = [] }) {
  return { id, title, steps };
}

/** One outcome button on a human task. */
export function createOutcome({ key, label = '', requiresComment = false, requiresFields = false, colorHex = null }) {
  // `requiresFields` (2026-10-11): pressing this button saves the task's
  // fields, so its required ones must be filled. A button without it ignores
  // whatever was typed — "Return to BDM" saves nothing.
  return { key, label: label || key, requiresComment, requiresFields, colorHex };
}
