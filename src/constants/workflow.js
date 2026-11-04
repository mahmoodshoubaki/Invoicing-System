import { STATUS } from '@/theme/vizPalette';

export const TARGET_TYPE = {
  NONE: 1,
  INVOICE: 2,
  BOQ_ITEM: 3,
  PROJECT: 4,
  INVOICING_PLAN_CYCLE: 5,
  BOQ_CHANGE_REQUEST: 6,
};

export const INVOICING_PLAN_TYPE = 'invoicingPlan';

export const LIST_TYPE = 'list';
export const FILES_TYPE = 'files';

export const CR_REASONS_TYPE = 'changeRequestReasons';
export const CR_TYPES_TYPE = 'changeRequestTypes';
export const CR_FIELD_CHANGES_TYPE = 'changeRequestFieldChanges';
export const CR_CYCLE_CHANGES_TYPE = 'changeRequestCycleChanges';
export const CR_NEW_ITEMS_TYPE = 'changeRequestNewItems';

const NOT_COMPARABLE = new Set([
  INVOICING_PLAN_TYPE, LIST_TYPE, FILES_TYPE, CR_REASONS_TYPE, CR_TYPES_TYPE, CR_FIELD_CHANGES_TYPE, CR_CYCLE_CHANGES_TYPE,
  CR_NEW_ITEMS_TYPE,
]);

export const isComparableField = (field) => !NOT_COMPARABLE.has(field?.typeKey);

export const TRIGGER_TYPE = {
  EVENT: 1,
  SCHEDULE: 2,
  MANUAL: 3,
};

export const canStartByHand = (triggerTypeKey) =>
  triggerTypeKey === TRIGGER_TYPE.EVENT || triggerTypeKey === TRIGGER_TYPE.MANUAL;

export const INSTANCE_STATUS = {
  RUNNING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
  FAULTED: 4,
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
  GROUP: 3,
};

export const SEARCHABLE_TARGET_TYPES = [
  TARGET_TYPE.INVOICE, TARGET_TYPE.BOQ_ITEM, TARGET_TYPE.PROJECT, TARGET_TYPE.INVOICING_PLAN_CYCLE,
  TARGET_TYPE.BOQ_CHANGE_REQUEST,
];

export const PICKED_TARGETS_LIST = 'targets';
export const PICKED_TARGETS_LABEL = 'Records picked at start';

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
  SEND_NOTIFICATION: 'sendNotification',
};

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

export const TRIGGER_KIND = {
  EVENT: 'event',
  SCHEDULE: 'schedule',
  MANUAL: 'manual',
};

export const SETTING_TYPE = {
  POSITIVE_INTEGER: 'positiveInteger',
  WHOLE_NUMBER: 'wholeNumber',
  BOOLEAN: 'boolean',
  URL: 'url',
  TEXT: 'text',
};

export const AUTOMATED_MODE = {
  QUEUE_AND_RETRY: 'queueAndRetry',
  MANUAL_RETRY: 'manualRetry',
  CONTINUE_REGARDLESS: 'continueRegardless',
};

export const DEFAULT_AUTOMATED_MODE = AUTOMATED_MODE.QUEUE_AND_RETRY;

export const HTTP_CALL_ACTION = 'http.call';

export const PLACEHOLDER_BUILTIN = {
  TODAY: 'today',
  NOW: 'now',
};

export const PLACEHOLDER_BUILTIN_INFO = {
  today: { label: 'Today', hint: 'midnight on the day the condition is checked' },
  now: { label: 'Now', hint: 'the exact moment the condition is checked' },
};

export const PLACEHOLDER_OFFSET_UNITS = [
  { key: 'd', label: 'days' },
  { key: 'h', label: 'hours' },
  { key: 'm', label: 'minutes' },
];

export const SECRETS_PREFIX = 'secrets.';

export const ACTION_INPUT_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  CHOICE: 'choice',
};

export const VARIABLE_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  LIST: 'list',
  USER: 'user',
};

export const VARIABLE_TYPE_LABELS = {
  [VARIABLE_TYPE.TEXT]: 'text',
  [VARIABLE_TYPE.NUMBER]: 'number',
  [VARIABLE_TYPE.DATE]: 'date',
  [VARIABLE_TYPE.BOOLEAN]: 'boolean',
  [VARIABLE_TYPE.LIST]: 'list',
  [VARIABLE_TYPE.USER]: 'person',
};

export const OPERATORS_BY_TYPE = {
  text: ['eq', 'neq', 'contains', 'isEmpty', 'isNotEmpty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  boolean: ['eq', 'neq'],
  list: ['contains', 'isEmpty', 'isNotEmpty'],
  user: ['eq', 'neq', 'isEmpty', 'isNotEmpty'],
};

export const OUTCOME_FIELD_SUFFIX = '.outcome';

export const WEEKDAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

export const WEEKDAY_LABELS = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat',
};

export const WEEKEND_DAYS = ['friday', 'saturday'];

export const DURATION_UNITS = [
  { key: 'Years', label: 'Years' },
  { key: 'Months', label: 'Months' },
  { key: 'Days', label: 'Days' },
  { key: 'Hours', label: 'Hours' },
  { key: 'Minutes', label: 'Minutes' },
];

export const EXCLUDE_DAYS_HELP =
  'Excluded days are counted only for days — 3 days with Fri and Sat off means 3 working days. Months, years and hours land where the calendar puts them, and only shift to the next allowed day if they land on an excluded one, at the same time of day.';

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const MATCH = {
  ALL: 'all',
  ANY: 'any',
};

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

export const VALUELESS_OPERATORS = [FILTER_OPERATOR.IS_EMPTY, FILTER_OPERATOR.IS_NOT_EMPTY];

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

export const INSTANCE_STATUS_COLORS = {
  [INSTANCE_STATUS.RUNNING]: STATUS.info,
  [INSTANCE_STATUS.COMPLETED]: STATUS.good,
  [INSTANCE_STATUS.CANCELLED]: STATUS.neutral,
  [INSTANCE_STATUS.FAULTED]: STATUS.critical,
  [INSTANCE_STATUS.PAUSED]: '#F59E0B',
};

export const TARGET_TYPE_LABELS = {
  [TARGET_TYPE.NONE]: 'No target',
  [TARGET_TYPE.INVOICE]: 'Invoice',
  [TARGET_TYPE.BOQ_ITEM]: 'BOQ item',
  [TARGET_TYPE.PROJECT]: 'Project',
  [TARGET_TYPE.INVOICING_PLAN_CYCLE]: 'Invoicing plan cycle',
  [TARGET_TYPE.BOQ_CHANGE_REQUEST]: 'BOQ change request',
};

export const TRIGGER_TYPE_LABELS = {
  [TRIGGER_TYPE.EVENT]: 'Event',
  [TRIGGER_TYPE.SCHEDULE]: 'Schedule',
  [TRIGGER_TYPE.MANUAL]: 'Manual',
};

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

export const BUILDER_LIMITS = {
  MIN_PARALLEL_BRANCHES: 2,
  DEFAULT_QUERY_MAX: 500,
  MAX_SCAN_ROWS: 500,
  MAX_INSTANCES_PAGE: 200,
  RESERVED_VARIABLE_PREFIX: '__',
};

export const TYPES_FORBIDDEN_IN_BRANCH = [STEP_TYPE.DELAY, STEP_TYPE.PARALLEL];

export const FORBIDDEN_IN_BRANCH_REASON =
  'Not available inside a parallel branch: a run holds only one wake-up time, one set of branch cursors and one retry slot, so two branches cannot each park on their own.';
