import { STATUS } from '@/theme/vizPalette';

/**
 * Workflow engine enums.
 *
 * The API speaks in integer keys and these are documented as stable, so they
 * are hardcoded here rather than fetched — with one exception: target types
 * also come from `GetTargetTypes`, which is what the builder's dropdown should
 * use so a new one added server-side appears without a release. TARGET_TYPE
 * below is for the handful of places that need to *name* a specific type
 * (e.g. "a project's id is its project code").
 */

// ---------------------------------------------------------------------------
// Keys — handoff §4
// ---------------------------------------------------------------------------

export const TARGET_TYPE = {
  NONE: 1,
  INVOICE: 2,
  BOQ_ITEM: 3,
  /**
   * Added 2026-10-01. Its id is the project CODE ("P-1"), not a number or a
   * guid. Nothing raises an event about a project, so a project workflow is
   * scheduled or started by hand — never event-triggered (WF-023).
   */
  PROJECT: 4,
  /**
   * Added 2026-10-13: one row per cycle of a BOQ item's invoicing plan, its id
   * the cycle's. For schedule scans, Find records steps and hand-started runs —
   * nothing raises an event about one, and a task cannot fill any of its fields.
   */
  INVOICING_PLAN_CYCLE: 5,
  /**
   * Added 2026-10-19: a change request on a BOQ, its id the request's. Raises
   * BoqChangeRequestSubmitted and BoqChangeRequestUpdated — the approval
   * workflow runs on it.
   */
  BOQ_CHANGE_REQUEST: 6,
};

/**
 * A field type that is never compared or searched (2026-10-13): a BOQ item's
 * whole invoicing plan, which a task can only ASK for — never a condition, a
 * scan, a filter or a {{value}}.
 */
export const INVOICING_PLAN_TYPE = 'invoicingPlan';

/**
 * Two more of them (later on 2026-10-13): an invoice's `lines` (`list`, read
 * only, its columns in `itemFields`) and its `attachments` (`files`, which a
 * task can fill). The engine compares a field as text, and a list's text is
 * never empty and never equal to anything — so a condition on one could never
 * be true, and they are left out with the plan.
 */
export const LIST_TYPE = 'list';
export const FILES_TYPE = 'files';

/**
 * A change request's content (2026-10-20), which a task can ask for: its
 * picked reasons, its item and project changes, and its plan changes — each a
 * JSON list, drawn with the create form's parts and never compared.
 */
export const CR_REASONS_TYPE = 'changeRequestReasons';
export const CR_FIELD_CHANGES_TYPE = 'changeRequestFieldChanges';
export const CR_CYCLE_CHANGES_TYPE = 'changeRequestCycleChanges';

const NOT_COMPARABLE = new Set([
  INVOICING_PLAN_TYPE, LIST_TYPE, FILES_TYPE, CR_REASONS_TYPE, CR_FIELD_CHANGES_TYPE, CR_CYCLE_CHANGES_TYPE,
]);

/** Whether a field may be read by a condition, a search or a value menu. */
export const isComparableField = (field) => !NOT_COMPARABLE.has(field?.typeKey);

export const TRIGGER_TYPE = {
  EVENT: 1,
  SCHEDULE: 2,
  MANUAL: 3,
};

/**
 * Whether a workflow can be started by hand (2026-10-13). One that starts by
 * hand, of course — and one that starts on an event: started on a record, it
 * runs as if the event had just happened there. One on a schedule cannot
 * (WF-021): its own scan decides which records it runs for.
 */
export const canStartByHand = (triggerTypeKey) =>
  triggerTypeKey === TRIGGER_TYPE.EVENT || triggerTypeKey === TRIGGER_TYPE.MANUAL;

export const INSTANCE_STATUS = {
  RUNNING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
  FAULTED: 4,
  /**
   * Stopped on purpose, and reversible — added 2026-09-13.
   *
   * The distinction that matters: **Cancelled is final and Paused is not.** A
   * paused run is picked up by the same `ResumeInstance` that revives a faulted
   * one, so the two share a button; a cancelled run can only be started again
   * from the beginning.
   */
  PAUSED: 5,
};

export const TASK_STATUS = {
  PENDING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
  REASSIGNED: 4,
};

export const ASSIGNEE_TYPE = {
  USER: 1,
  ROLE: 2,
};

/**
 * The target types something can *search*. A `query` step (from any workflow)
 * or a schedule trigger's `scan` naming anything else is refused (WF-029).
 * BOQ items and projects joined invoices on 2026-10-01.
 */
export const SEARCHABLE_TARGET_TYPES = [
  TARGET_TYPE.INVOICE, TARGET_TYPE.BOQ_ITEM, TARGET_TYPE.PROJECT, TARGET_TYPE.INVOICING_PLAN_CYCLE,
  TARGET_TYPE.BOQ_CHANGE_REQUEST,
];

/**
 * The list a hand-started run is given: one row per record it was started on,
 * each carrying that record's fields plus `targetId`.
 *
 * The engine writes it on EVERY hand-started run and overwrites whatever was
 * there, so it is a reserved name — no variable, start-form field or Find
 * records step may use it. Shown to authors as "Records picked at start".
 */
export const PICKED_TARGETS_LIST = 'targets';
export const PICKED_TARGETS_LABEL = 'Records picked at start';

// ---------------------------------------------------------------------------
// Graph vocabulary — string discriminators, handoff §3
// ---------------------------------------------------------------------------

/**
 * Step `type` values. These are the discriminator System.Text.Json reads, and
 * it must be the FIRST property of the serialised object — see
 * `models/workflow.js`, which is the only place allowed to build one.
 *
 * `callApi` is deliberately absent. WorkflowStepTypes declares it server-side
 * but the executor refuses it; an HTTP call is an `automated` step whose
 * action is `http.call`. Never put it in the palette.
 */
export const STEP_TYPE = {
  HUMAN_TASK: 'humanTask',
  AUTOMATED: 'automated',
  BRANCH: 'branch',
  FOR_EACH: 'forEach',
  REPEAT: 'repeat',
  DELAY: 'delay',
  PARALLEL: 'parallel',
  QUERY: 'query',
  SET_VARIABLE: 'setVariable',
  /** Tells people, then walks on. Never stops the run. Added 2026-10-07. */
  SEND_NOTIFICATION: 'sendNotification',
};

/**
 * How each step type is described in the palette.
 *
 * `callApi` is absent for the same reason it is absent from STEP_TYPE: the
 * executor refuses it. An HTTP call is an `automated` step with the
 * `http.call` action, offered as an action rather than a type.
 */
export const STEP_TYPE_INFO = {
  humanTask: {
    label: 'Human task',
    hint: 'Stops and waits for a person to answer.',
  },
  automated: {
    label: 'Automated action',
    hint: 'Calls an action — today, an API call to a domain an administrator approved.',
  },
  delay: {
    label: 'Delay',
    hint: 'Holds the run for a set time, then carries on by itself.',
  },
  branch: {
    label: 'Branch',
    hint: 'An if: different steps depending on a condition.',
  },
  forEach: {
    label: 'For each',
    hint: 'Repeats its steps once per item in a list.',
  },
  repeat: {
    label: 'Repeat',
    hint: 'Repeats a fixed number of times, or until a condition holds.',
  },
  query: {
    label: 'Find records',
    hint: 'Asks a module which of its things match, into a variable.',
  },
  parallel: {
    label: 'Parallel block',
    hint: 'Several branches that all run at once, joined when each is done.',
  },
  setVariable: {
    label: 'Set a variable',
    hint: 'Remembers a value so a later step or condition can use it.',
  },
  sendNotification: {
    label: 'Send notification',
    hint: 'Tells people — by email and in their bell — then carries on.',
  },
};

/**
 * A colour per step type, for the icon chip on a node.
 *
 * Nominal categories with no order, so these are chosen for separation rather
 * than as a ramp — eight hues spread far enough around the wheel to be told
 * apart at 14px. UI chrome, not data: the chart palette's rules about encoding
 * value in colour do not apply, but its restraint does, so every one of these
 * is a mid-tone that carries white text and sits calmly on an off-white canvas.
 */
export const STEP_ACCENTS = {
  humanTask: '#2a78d6',
  automated: '#4a3aa7',
  delay: '#b07800',
  branch: '#7c3aed',
  forEach: '#158a62',
  repeat: '#0d7f78',
  query: '#5f7d95',
  parallel: '#b1275f',
  setVariable: '#8a6a3f',
  sendNotification: '#c2562c',
};

/**
 * What each `automated` mode means when the action fails.
 *
 * The first two both STOP the run on the failed step — neither ever walks past
 * work that did not happen. They differ only in who comes back: the engine, or
 * nobody until a person clicks. That is the distinction worth getting right,
 * and the one the old `waitForSuccess` name obscured by promising a wait that
 * never happened.
 */
export const AUTOMATED_MODE_INFO = {
  queueAndRetry: {
    label: 'Retry on its own',
    hint: 'The run parks here and a sweep tries again after 5, 10, 15 then 20 minutes. After 5 tries it faults.',
  },
  manualRetry: {
    label: 'Stop until someone retries',
    hint: 'Nothing is saved and the run stays on this step. Nothing tries again until a person presses Advance.',
  },
  continueRegardless: {
    label: 'Continue regardless',
    hint: 'The failure is logged and the run walks on to the next step — past work that did not happen.',
  },
};

/** Trigger `kind` values. */
export const TRIGGER_KIND = {
  EVENT: 'event',
  SCHEDULE: 'schedule',
  MANUAL: 'manual',
};

/**
 * What an engine-settings row holds.
 *
 * The admin screen draws its control from THIS, never from the key. All eight
 * rows are `positiveInteger` today; a future one that is not will say so on its
 * own row, and a screen switching on the key would render the wrong box for it.
 */
export const SETTING_TYPE = {
  POSITIVE_INTEGER: 'positiveInteger',
  /** 0 or more — 0 usually means "off" or "keep for ever". Added 2026-10-07. */
  WHOLE_NUMBER: 'wholeNumber',
  BOOLEAN: 'boolean',
  /** A full http/https address. Notifications settings only, so far. */
  URL: 'url',
  TEXT: 'text',
};

/** What a failing `automated` action means for the run. */
/**
 * Declared in the order the picker offers them: the default first.
 *
 * `waitForSuccess` was renamed to `manualRetry` — same behaviour, honest name —
 * and is now REFUSED at save with WF-008. Nothing in the front end may emit it.
 */
export const AUTOMATED_MODE = {
  QUEUE_AND_RETRY: 'queueAndRetry',
  MANUAL_RETRY: 'manualRetry',
  CONTINUE_REGARDLESS: 'continueRegardless',
};

/** What a step means when it says nothing. The engine's default, mirrored here. */
export const DEFAULT_AUTOMATED_MODE = AUTOMATED_MODE.QUEUE_AND_RETRY;

/** The action key that turns an `automated` step into an outbound HTTP call. */
export const HTTP_CALL_ACTION = 'http.call';

/**
 * The two values the engine supplies to a `{{…}}` in a condition.
 *
 * Everything else in that position is a name the run has to answer — a
 * variable, a field on the tracked record, or a loop item. These two are the
 * exception: they are computed at the moment the condition is checked, which is
 * the whole point of them ("on or before today" has to mean the day the run
 * gets there, not the day somebody drew the workflow).
 */
export const PLACEHOLDER_BUILTIN = {
  TODAY: 'today',
  NOW: 'now',
};

export const PLACEHOLDER_BUILTIN_INFO = {
  today: { label: 'Today', hint: 'midnight on the day the condition is checked' },
  now: { label: 'Now', hint: 'the exact moment the condition is checked' },
};

/**
 * Offsets are legal on the built-ins and ONLY on the built-ins.
 *
 * `{{today+7d}}` resolves; `{{reviewDeadline+7d}}` is refused at save as
 * WF-037. So the offset control has to disappear the moment the author picks a
 * variable rather than a built-in — it is not a modifier on the value, it is
 * part of the built-in's own grammar.
 */
export const PLACEHOLDER_OFFSET_UNITS = [
  { key: 'd', label: 'days' },
  { key: 'h', label: 'hours' },
  { key: 'm', label: 'minutes' },
];

/** A credential reference. Legal in a step input, refused in a condition (WF-036). */
export const SECRETS_PREFIX = 'secrets.';

/**
 * The shapes `GetActions` can give an input.
 *
 * `choice` is the one that changes the control: a dropdown that shows `label`
 * and sends `value`. The rest map onto the ordinary field types.
 */
export const ACTION_INPUT_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  CHOICE: 'choice',
};

/** Variable / field types. */
export const VARIABLE_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  LIST: 'list',
  /**
   * One person, held as their user id (a guid) — never a username, which can
   * change or repeat. Pickers show the name and send the id. Anything that is
   * not a user id is refused. Added 2026-10-01.
   */
  USER: 'user',
};

/** How a type is named in the variable editor. Only `user` reads differently. */
export const VARIABLE_TYPE_LABELS = {
  [VARIABLE_TYPE.TEXT]: 'text',
  [VARIABLE_TYPE.NUMBER]: 'number',
  [VARIABLE_TYPE.DATE]: 'date',
  [VARIABLE_TYPE.BOOLEAN]: 'boolean',
  [VARIABLE_TYPE.LIST]: 'list',
  [VARIABLE_TYPE.USER]: 'person',
};

/**
 * Operators offered for a workflow variable or a step's answer.
 *
 * `GetFields` narrows operators per field for the module's own properties, but
 * variables and outcomes are ours, so the narrowing happens here — on the same
 * principle: never offer `contains` on a number.
 */
export const OPERATORS_BY_TYPE = {
  text: ['eq', 'neq', 'contains', 'isEmpty', 'isNotEmpty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  boolean: ['eq', 'neq'],
  list: ['contains', 'isEmpty', 'isNotEmpty'],
  // Greater-than and contains mean nothing for a person. Ids compare as text,
  // ignoring case.
  user: ['eq', 'neq', 'isEmpty', 'isNotEmpty'],
};

/** What makes a step id readable as a condition field: `approve.outcome`. */
export const OUTCOME_FIELD_SUFFIX = '.outcome';

/**
 * Day names as the engine spells them: lowercase, Sunday first. Not numbers.
 * Used by `excludeDays` on a `delay`, a stage `deadline` and a `humanTask` due
 * date — one key, shared, whatever the duration's prefix.
 */
export const WEEKDAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

/** Sentence-case for display; the wire format stays lowercase. */
export const WEEKDAY_LABELS = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
};

/**
 * This organisation's weekend — Friday and Saturday, the working week being
 * Sunday to Thursday. Same rule as `WORKING_DAYS_CRON` and the BOQ invoicing
 * tracker, kept identical so the three cannot disagree about what a working
 * day is. It backs the "skip weekends" shortcut, which is only ever a
 * convenience for ticking two of the seven boxes.
 */
export const WEEKEND_DAYS = ['friday', 'saturday'];

/**
 * The five duration fields a `delay` step and a stage `deadline` share.
 *
 * They differ only in prefix: `delayYears` vs `afterYears`, and so on. Every
 * field is optional and **only what the author filled in is sent**, so a step
 * that waits three days carries `delayDays` alone.
 *
 * Order matters — it is the order the boxes appear in, largest first.
 */
export const DURATION_UNITS = [
  { key: 'Years', label: 'Years' },
  { key: 'Months', label: 'Months' },
  { key: 'Days', label: 'Days' },
  { key: 'Hours', label: 'Hours' },
  { key: 'Minutes', label: 'Minutes' },
];

/**
 * The rule that surprises people, so it is shown rather than discovered.
 *
 * Excluded days subtract from **days only**. Months, years and hours land where
 * the calendar puts them and are merely nudged forward off an excluded day —
 * so "1 month, no Fridays" is one calendar month shifted off a Friday, not a
 * month of weekdays.
 */
export const EXCLUDE_DAYS_HELP =
  'Excluded days are counted only for days — 3 days with Fri and Sat off means 3 working days. Months, years and hours land where the calendar puts them, and only shift to the next allowed day if they land on an excluded one, at the same time of day.';

/** HTTP methods offered for an `http.call`. Body is ignored on GET. */
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export const MATCH = {
  ALL: 'all',
  ANY: 'any',
};

/** All nine operators. The per-field subset comes from `GetFields`. */
export const FILTER_OPERATOR = {
  EQ: 'eq',
  NEQ: 'neq',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  CONTAINS: 'contains',
  IS_EMPTY: 'isEmpty',
  IS_NOT_EMPTY: 'isNotEmpty',
};

/** Operators that take no value input — the box is hidden, not just ignored. */
export const VALUELESS_OPERATORS = [FILTER_OPERATOR.IS_EMPTY, FILTER_OPERATOR.IS_NOT_EMPTY];

/**
 * Prose labels — for summaries, where the operator sits inside a sentence:
 * "Total amount is greater than or equal to 5000".
 *
 * All six comparisons share one vocabulary on purpose. An earlier set said
 * "is at least" / "is at most" for `gte`/`lte` while `gt`/`lt` said "greater
 * than" / "less than", so the reader had to hold two mental models and work out
 * that "at least" was the inclusive form of "greater than".
 */
export const FILTER_OPERATOR_LABELS = {
  [FILTER_OPERATOR.EQ]: 'is',
  [FILTER_OPERATOR.NEQ]: 'is not',
  [FILTER_OPERATOR.GT]: 'is greater than',
  [FILTER_OPERATOR.GTE]: 'is greater than or equal to',
  [FILTER_OPERATOR.LT]: 'is less than',
  [FILTER_OPERATOR.LTE]: 'is less than or equal to',
  [FILTER_OPERATOR.CONTAINS]: 'contains',
  [FILTER_OPERATOR.IS_EMPTY]: 'is empty',
  [FILTER_OPERATOR.IS_NOT_EMPTY]: 'is not empty',
};

/**
 * Labels for the operator dropdown, which is a narrow control rather than a
 * sentence. The symbol leads so the list can be scanned by shape, and the words
 * follow so nothing depends on knowing the symbol.
 *
 * Must cover exactly the same keys as FILTER_OPERATOR_LABELS.
 */
export const FILTER_OPERATOR_OPTION_LABELS = {
  [FILTER_OPERATOR.EQ]: '=  is',
  [FILTER_OPERATOR.NEQ]: '≠  is not',
  [FILTER_OPERATOR.GT]: '>  greater than',
  [FILTER_OPERATOR.GTE]: '≥  greater than or equal to',
  [FILTER_OPERATOR.LT]: '<  less than',
  [FILTER_OPERATOR.LTE]: '≤  less than or equal to',
  [FILTER_OPERATOR.CONTAINS]: 'contains',
  [FILTER_OPERATOR.IS_EMPTY]: 'is empty',
  [FILTER_OPERATOR.IS_NOT_EMPTY]: 'is not empty',
};

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

/**
 * Run status colours, drawn from the validated palette rather than picked by
 * eye. `info` is the desaturated slate reserved for in-flight states so a
 * running workflow can never read as a data series.
 */
export const INSTANCE_STATUS_COLORS = {
  [INSTANCE_STATUS.RUNNING]: STATUS.info,
  [INSTANCE_STATUS.COMPLETED]: STATUS.good,
  [INSTANCE_STATUS.CANCELLED]: STATUS.neutral,
  [INSTANCE_STATUS.FAULTED]: STATUS.critical,
  // Amber, as the backend specified (#F59E0B) — deliberately NOT the palette's
  // own warning tone, so a paused run is not mistaken for a run in trouble.
  [INSTANCE_STATUS.PAUSED]: '#F59E0B',
};

/**
 * Target-type labels.
 *
 * `GetTargetTypes` returns these from the server and the builder's dropdown
 * should use that — but it is guarded by `Workflows.Manage`, so a user who can
 * only *view* workflows gets a 403 and no labels at all. These cover the
 * read-only screens; anywhere the catalog is loaded, prefer it.
 */
export const TARGET_TYPE_LABELS = {
  [TARGET_TYPE.NONE]: 'No target',
  [TARGET_TYPE.INVOICE]: 'Invoice',
  [TARGET_TYPE.BOQ_ITEM]: 'BOQ item',
  [TARGET_TYPE.PROJECT]: 'Project',
  [TARGET_TYPE.INVOICING_PLAN_CYCLE]: 'Invoicing plan cycle',
  [TARGET_TYPE.BOQ_CHANGE_REQUEST]: 'BOQ change request',
};

/** Trigger labels, keyed by the integer `triggerTypeKey` a definition row carries. */
export const TRIGGER_TYPE_LABELS = {
  [TRIGGER_TYPE.EVENT]: 'Event',
  [TRIGGER_TYPE.SCHEDULE]: 'Schedule',
  [TRIGGER_TYPE.MANUAL]: 'Manual',
};

/**
 * Fallback labels. Prefer the `status` string the API sends alongside
 * `statusKey` — this is only for rows that carry a key and nothing else.
 */
/**
 * What became of one to-do — the engine's own four names, used as-is.
 *
 * They were softened to "Open / Answered / Withdrawn / Passed on" for a while;
 * the canonical names won, because they are what the API, the history and
 * anybody talking to the backend team all say, and a screen that renames them
 * makes every conversation about a task begin with a translation.
 *
 * **Cancelled is still not a failure**, and is drawn neutral rather than red: a
 * stage deadline firing, or a `joinWhen` closing a parallel block, cancels every
 * to-do still open inside it. Reassigned means this row was replaced by a new
 * one with a new id, keeping the title and the original due date.
 */
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Pending',
  [TASK_STATUS.COMPLETED]: 'Completed',
  [TASK_STATUS.CANCELLED]: 'Cancelled',
  [TASK_STATUS.REASSIGNED]: 'Reassigned',
};

export const TASK_STATUS_COLORS = {
  [TASK_STATUS.PENDING]: STATUS.info,
  [TASK_STATUS.COMPLETED]: STATUS.good,
  [TASK_STATUS.CANCELLED]: STATUS.neutral,
  [TASK_STATUS.REASSIGNED]: STATUS.warning,
};

export const INSTANCE_STATUS_LABELS = {
  [INSTANCE_STATUS.RUNNING]: 'Running',
  [INSTANCE_STATUS.COMPLETED]: 'Completed',
  [INSTANCE_STATUS.CANCELLED]: 'Cancelled',
  [INSTANCE_STATUS.FAULTED]: 'Faulted',
  [INSTANCE_STATUS.PAUSED]: 'Paused',
};

/**
 * Constraints the builder enforces before saving, so nobody learns them from a
 * failed request. Every one is also enforced server-side.
 */
export const BUILDER_LIMITS = {
  /** A `parallel` step needs at least this many branches — one is not parallel. */
  MIN_PARALLEL_BRANCHES: 2,
  /** Default `max` on a `query` step when left blank (server's MaxScanRows). */
  DEFAULT_QUERY_MAX: 500,
  /** Rows a scan-and-spawn trigger may start per occurrence. */
  MAX_SCAN_ROWS: 500,
  /** `GetInstances` clamps `take` to this server-side, whatever we send. */
  MAX_INSTANCES_PAGE: 200,
  /** Reserved prefix — a `query` step's `into` may not start with it. */
  RESERVED_VARIABLE_PREFIX: '__',
};

/**
 * Step types that cannot appear inside a `parallel` branch.
 *
 * Each parks the run using something the run keeps exactly one of — one wake-up
 * time, one set of branch cursors, one retry slot — so two branches doing it at
 * once would be sharing a single slot. `queueAndRetry` is the third case but is
 * a *mode* rather than a type, so it is checked separately.
 */
export const TYPES_FORBIDDEN_IN_BRANCH = [STEP_TYPE.DELAY, STEP_TYPE.PARALLEL];

/** Shown in the palette tooltip when a type is greyed out inside a branch. */
export const FORBIDDEN_IN_BRANCH_REASON =
  'Not available inside a parallel branch: a run holds only one wake-up time, one set of branch cursors and one retry slot, so two branches cannot each park on their own.';
