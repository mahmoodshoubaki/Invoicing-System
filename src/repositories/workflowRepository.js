import { createApiClient } from '@/lib/apiClient';
import {
  mapDefinitionRow,
  mapDefinition,
  mapVersionRow,
  mapProblem,
  mapField,
  mapEvent,
  mapAction,
  mapTargetType,
  mapInstance,
  mapInstanceRow,
  mapInstanceTaskRow,
  mapInstanceVariable,
  mapHistoryRow,
  mapMyTask,
  mapApiDomain,
  mapWorkflowSetting,
  mapFieldSetting,
  createSaveFieldSettingsPayload,
  createUpdateSettingPayload,
  createStartInstancePayload,
  createAdvanceInstancePayload,
  createResumeInstancePayload,
  createCancelInstancePayload,
  createPauseInstancePayload,
  createCompleteTaskPayload,
  createCompleteTaskWithFilesFormData,
  createReassignTaskPayload,
  createApproveApiDomainPayload,
  createSetApiDomainEnabledPayload,
} from '@/models/workflow';
import { mapConfigChange, mapCorrelationTrace } from '@/models/notification';

const definitionsApi = createApiClient('/api/Workflows');
const instancesApi = createApiClient('/api/WorkflowInstances');
const tasksApi = createApiClient('/api/WorkflowTasks');
const domainsApi = createApiClient('/api/WorkflowApiDomains');
const settingsApi = createApiClient('/api/WorkflowSettings');

/**
 * Drops null/undefined entries before they reach URLSearchParams, which would
 * otherwise serialise them as the literal strings "null" and "undefined" and
 * have the backend try to bind them. Every list filter here is optional, so
 * this is the difference between "no filter" and "filter on the word null".
 *
 * @param {Object} params
 * @returns {Object}
 */
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
  );
}

/**
 * Workflow engine API — 21 endpoints across five controllers.
 *
 * Routes are literal action names (`POST /api/Controller/ActionName`), not REST
 * resources, and query parameters are PascalCase exactly as the OpenAPI
 * document declares them.
 */
export const workflowRepository = {
  // =========================================================================
  // Definitions — /api/Workflows
  // =========================================================================

  /**
   * Save the workflow's draft (2026-10-11) — creating the workflow when
   * `code` is null. It saves even with problems, and lists every one; it only
   * refuses a missing or too-long name, a too-long description, or a graph
   * that cannot be read. 409 WF-052 when the stamp is stale.
   *
   * @param {Object} payload  from createDefinitionPayload()
   * @returns {Promise<{id: string, code: string, stamp: number, problems: Array}>}
   */
  async saveDefinition(payload) {
    const data = await definitionsApi.post('/SaveDefinition', payload);
    return {
      id: data?.id ?? null,
      code: data?.code ?? null,
      stamp: data?.stamp ?? null,
      problems: (data?.problems ?? []).map(mapProblem),
    };
  },

  /**
   * Turn the draft into the next version and make it live; running workflows
   * move onto it. Refused 400 WF-053 while the draft has problems (`Problems`
   * in the error body), 404 WF-054 when there is no draft, 409 WF-024 when runs
   * wait in a stage that changed (`BlockedRuns`).
   *
   * @param {string} code
   * @returns {Promise<{definitionId: string, version: number}>}
   */
  async publishDefinition(code) {
    const data = await definitionsApi.post('/PublishDefinition', { code });
    return { definitionId: data?.definitionId ?? null, version: data?.version ?? null };
  },

  /**
   * Make an existing version live again — how a workflow goes back to an older
   * one. Running workflows move onto it, or it is refused 409 WF-024 with
   * `BlockedRuns`, like a publish.
   *
   * Returns 200 with an empty object body (MediatR Unit, not 204) — a falsy
   * body here is success, not failure.
   *
   * @param {string} definitionId
   * @returns {Promise<void>}
   */
  async activateDefinition(definitionId) {
    await definitionsApi.post('/ActivateDefinition', { definitionId });
  },

  /**
   * Remove one version for good — only one nothing has run on and that is not
   * live. Given the draft's id, it discards the draft.
   *
   * @param {string} definitionId
   * @returns {Promise<void>}
   */
  async deleteDefinition(definitionId) {
    await definitionsApi.post('/DeleteDefinition', { definitionId });
  },

  /**
   * All workflows — one row per workflow, not per version.
   * @param {Object} [filters]
   * @param {number} [filters.targetTypeKey]
   * @param {boolean} [filters.activeOnly]
   * @returns {Promise<Object[]>}
   */
  async getDefinitions({ targetTypeKey = null, activeOnly = null } = {}) {
    const data = await definitionsApi.get(
      '/GetDefinitions',
      cleanParams({ TargetTypeKey: targetTypeKey, ActiveOnly: activeOnly })
    );
    return (data?.workflows ?? []).map(mapDefinitionRow);
  },

  /**
   * One definition, by id or by code+version. Omit the version for the latest.
   *
   * The response feeds straight back into saveDefinition with no translation,
   * which is what makes load/edit/post-back safe.
   *
   * @param {Object} query
   * @param {string} [query.definitionId]
   * @param {string} [query.code]
   * @param {number} [query.version]
   * @returns {Promise<Object>}
   */
  async getDefinition({ definitionId = null, code = null, version = null } = {}) {
    const data = await definitionsApi.get(
      '/GetDefinition',
      cleanParams({ DefinitionId: definitionId, Code: code, Version: version })
    );
    return mapDefinition(data);
  },

  /**
   * Every version of one workflow. `hasRunningInstances` gates rollback.
   * @param {string} code
   * @returns {Promise<Object[]>}
   */
  async getDefinitionVersions(code) {
    const data = await definitionsApi.get('/GetDefinitionVersions', { Code: code });
    return (data?.versions ?? []).map(mapVersionRow);
  },

  /**
   * The field catalog a condition builder may offer for a kind of entity.
   * Each row's `operators` is already narrowed to that field's type.
   *
   * @param {number} targetTypeKey
   * @returns {Promise<Object[]>}
   */
  async getFields(targetTypeKey) {
    /*
     * Paged since 2026-10-13 (`search`, `skip`, `take` up to 200, `total`).
     * The builder still loads the whole list, a page at a time: it checks a
     * saved workflow against it (fillable, asked-with, a person), names every
     * field a workflow already uses, and offers it in a dozen pickers — and a
     * kind of thing has tens of fields, not thousands. A reply without `total`
     * (an older server) is the whole list in one page.
     */
    const PAGE = 200;
    const fields = [];
    for (let skip = 0; ; skip += PAGE) {
      const data = await definitionsApi.get('/GetFields', { TargetTypeKey: targetTypeKey, Skip: skip, Take: PAGE });
      const page = data?.fields ?? [];
      fields.push(...page);
      if (page.length < PAGE || fields.length >= (data?.total ?? 0)) break;
    }
    return fields.map(mapField);
  },

  /**
   * Events that can start a workflow. Only InvoiceSubmitted is raisable today.
   * @param {number} [targetTypeKey]
   * @returns {Promise<Object[]>}
   */
  async getEvents(targetTypeKey = null) {
    const data = await definitionsApi.get('/GetEvents', cleanParams({ TargetTypeKey: targetTypeKey }));
    return (data?.events ?? []).map(mapEvent);
  },

  /**
   * What an `automated` step may call.
   * @returns {Promise<Object[]>}
   */
  async getActions() {
    const data = await definitionsApi.get('/GetActions');
    return (data?.actions ?? []).map(mapAction);
  },

  /**
   * The kinds of entity a workflow can track.
   * @returns {Promise<Object[]>}
   */
  async getTargetTypes() {
    const data = await definitionsApi.get('/GetTargetTypes');
    return (data?.targetTypes ?? []).map(mapTargetType);
  },

  // =========================================================================
  // Runs — /api/WorkflowInstances
  // =========================================================================

  /**
   * Start a run.
   *
   * `targetIds` is a list and the whole list is ONE run. If any id in it is
   * already held by a run of this same workflow the request is refused whole
   * with WF-016 — nothing starts, and the message names every offender.
   *
   * @param {Object} args  { code, targetIds, inputs, values }
   * @returns {Promise<Object>} the instance
   */
  async startInstance(args) {
    const data = await instancesApi.post('/StartInstance', createStartInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * Nudge a run forward. Safe to send twice — a run waiting on a person does
   * not move — and on a `queueAndRetry`-parked run it retries immediately,
   * which is the "try now" button.
   *
   * @param {Object} args  { instanceId, values }
   * @returns {Promise<Object>} the instance
   */
  async advanceInstance(args) {
    const data = await instancesApi.post('/AdvanceInstance', createAdvanceInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * Bring a faulted run back.
   *
   * The counterpart to advance, and NOT interchangeable with it: advancing a
   * faulted run returns 200 and does nothing whatsoever — no error, no
   * movement. This un-faults it, resets the attempt count so the failed step
   * gets its full allowance again, and advances it.
   *
   * So the button rule on the run screen is just the status: Running →
   * advance, Faulted → resume. Faulted only — anything else is WF-045.
   *
   * @param {Object} args  { instanceId, notes?, resetStepCount? }
   * @returns {Promise<Object>} the instance
   */
  async resumeInstance(args) {
    const data = await instancesApi.post('/ResumeInstance', createResumeInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * Pause a run — stopped on purpose, and reversible.
   *
   * `ResumeInstance` picks it back up, which is what separates it from cancel.
   * `reason` is required: an empty one is refused with a 400, and it is the
   * explanation anybody finding the run later will read.
   *
   * `POST /api/WorkflowInstances/PauseInstance`, `[WorkflowInstances.Cancel]` —
   * the same permission cancel uses, so the two cannot be granted separately.
   *
   * @param {Object} args  { instanceId, reason }
   * @returns {Promise<Object>} the instance
   */
  async pauseInstance(args) {
    const data = await instancesApi.post('/PauseInstance', createPauseInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * Stop a run for good.
   *
   * Withdraws every to-do it was still asking and closes it. **There is no
   * undo** — a cancelled run cannot be resumed, only started again from the
   * beginning — so nothing should call this without a deliberate confirmation.
   *
   * Running runs only; anything else is WF-001. The `reason` lands in the run's
   * history and is the only explanation a cancelled run will ever carry.
   *
   * @param {Object} args  { instanceId, reason }
   * @returns {Promise<Object>} the instance
   */
  async cancelInstance(args) {
    const data = await instancesApi.post('/CancelInstance', createCancelInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * One run.
   *
   * **Its tasks and history are no longer on it** — both were split out on
   * 2026-09-13 into `getInstanceTasks` and `getInstanceHistory`, because both
   * are unbounded and both page. What is left is the run's own state, plus
   * `pendingTaskCount` so a header can say how many to-dos are open without
   * fetching them.
   *
   * @param {string} instanceId
   * @returns {Promise<Object>}
   */
  async getInstance(instanceId) {
    const data = await instancesApi.get('/GetInstance', { InstanceId: instanceId });
    return mapInstance(data);
  },

  /**
   * A run's values right now (2026-10-21) — `GET GetInstanceVariables`,
   * WorkflowInstances.View — so somebody can correct one before resuming it.
   * Each is `{ name, type, value }`: see mapInstanceVariable.
   *
   * @param {string} instanceId
   * @returns {Promise<Array<{ name: string, type: string|null, value: * }>>}
   */
  async getInstanceVariables(instanceId) {
    const data = await instancesApi.get('/GetInstanceVariables', cleanParams({ InstanceId: instanceId }));
    return (data?.variables ?? []).map(mapInstanceVariable);
  },

  /**
   * Every task a run has created — **whatever became of it**.
   *
   * Not just the pending ones: `statusKey` is the `taskStatus` enum (1 Pending,
   * 2 Completed, 3 Cancelled, 4 Reassigned) and a completed row carries the
   * answer, the comment, who gave it and when. Omit `statusKey` for all of them.
   *
   * This is what makes a run's audit trail readable — before it, a screen could
   * say what a run was waiting for but never what anybody had decided, and a
   * to-do withdrawn by a stage deadline left no trace at all.
   *
   * @param {Object} args  { instanceId, statusKey?, skip?, take? }
   * @returns {Promise<{items: Object[], total: number}>}
   */
  async getInstanceTasks({ instanceId, statusKey = null, skip = 0, take = 50 } = {}) {
    const data = await instancesApi.get(
      '/GetInstanceTasks',
      cleanParams({ InstanceId: instanceId, StatusKey: statusKey, Skip: skip, Take: take })
    );
    return {
      items: (data?.tasks ?? []).map(mapInstanceTaskRow),
      total: data?.total ?? 0,
    };
  },

  /**
   * A run's audit trail, paged.
   *
   * Split off `GetInstance` for the same reason as the tasks: a long-running
   * workflow's history has no ceiling, and shipping all of it on every poll of
   * the run's own state was the cost of rendering a timeline.
   *
   * @param {Object} args  { instanceId, skip?, take? }
   * @returns {Promise<{items: Object[], total: number}>}
   */
  async getInstanceHistory({ instanceId, skip = 0, take = 100 } = {}) {
    const data = await instancesApi.get(
      '/GetInstanceHistory',
      cleanParams({ InstanceId: instanceId, Skip: skip, Take: take })
    );
    return {
      items: (data?.history ?? []).map(mapHistoryRow),
      total: data?.total ?? 0,
    };
  },

  /**
   * A page of runs. Every filter is optional.
   *
   * `take` is clamped to 200 server-side whatever we send, and there is no
   * sort parameter — so ordering can only ever be applied within the page
   * already fetched.
   *
   * **`targetId` here stays singular on purpose.** The run's own subjects
   * became `targetIds` on 2026-09-13, but this is a FILTER — "show me runs
   * touching this one thing" — and the endpoint still takes exactly one. Do
   * not pluralise it to match the response.
   *
   * **`targetId` never travels without `targetTypeKey`** (2026-09-30). An id is
   * only unique within its kind: `targetId=12` alone matches invoice 12 AND
   * BOQ item 12, and the answer would look perfectly plausible. So asking by id
   * alone is refused here rather than sent. `targetTypeKey` on its own is fine
   * — every invoice run, say.
   *
   * With both, the answer is every run ever made on that one record, across
   * every workflow, finished ones included, newest first.
   *
   * @param {Object} [filters]
   * @returns {Promise<{items: Object[], total: number}>}
   */
  async getInstances({
    code = null, statusKey = null, targetTypeKey = null, targetId = null, skip = 0, take = 50,
  } = {}) {
    if (targetId != null && targetTypeKey == null) {
      throw new Error('getInstances: targetId needs targetTypeKey — an id alone matches every kind of record with it.');
    }
    const data = await instancesApi.get(
      '/GetInstances',
      cleanParams({
        Code: code, StatusKey: statusKey, TargetTypeKey: targetTypeKey, TargetId: targetId, Skip: skip, Take: take,
      })
    );
    return {
      items: (data?.instances ?? []).map(mapInstanceRow),
      total: data?.total ?? 0,
    };
  },

  // =========================================================================
  // To-do list — /api/WorkflowTasks
  // =========================================================================

  /**
   * One PAGE of the current user's to-dos — paged since 2026-09-30, on the same
   * skip / take / total pattern as GetInstances and GetInstanceTasks.
   *
   * Every row still carries what the screen needs to act on it: buttons,
   * colours, comment rules and canAct.
   *
   * - `statusKey` filters on the server. It has to: filtering a page in the
   *   browser would leave a Pending tab empty whenever the first page happened
   *   to hold only completed work.
   * - `take` defaults to 50 server-side and is capped at 200.
   * - `total` counts every task matching the filter, not just this page.
   * - `pendingCount` is every PENDING task, whatever the filter — so the
   *   Pending tab and the sidebar badge come from any page, with no call of
   *   their own.
   *
   * The order is the server's, with the task id as the last tie-breaker so a
   * row can never appear on two pages.
   *
   * @param {{ statusKey?: number|null, skip?: number, take?: number }} [args]
   * @returns {Promise<{ items: Object[], total: number, pendingCount: number|null }>}
   */
  async getMyTasks({ instanceId = null, statusKey = null, skip = 0, take = 50 } = {}) {
    // `instanceId` (2026-10-11) narrows it to one run — how a record's own
    // page finds the to-do waiting on it.
    const data = await tasksApi.get(
      '/GetMyTasks',
      cleanParams({ InstanceId: instanceId, StatusKey: statusKey, Skip: skip, Take: take })
    );
    return {
      items: (data?.tasks ?? []).map(mapMyTask),
      total: data?.total ?? 0,
      pendingCount: data?.pendingCount ?? null,
    };
  },

  /**
   * Answer a task. Returns the updated instance, so callers already hold the
   * new state and need no follow-up fetch.
   *
   * @param {Object} args  { instanceId, taskId, outcomeKey, comment, values }
   * @returns {Promise<Object>} the instance
   */
  async completeTask(args) {
    const data = await tasksApi.post('/CompleteTask', createCompleteTaskPayload(args));
    return mapInstance(data);
  },

  /**
   * Answer a task that has a `files` field (2026-10-13) — multipart, the new
   * files as parts named after their field. A task without one keeps using
   * completeTask. Refusals come back keyed by field, as CompleteTask's do.
   *
   * @param {Object} args  { instanceId, taskId, outcomeKey, comment, values }
   * @param {Object<string, Array<{ file: File, name: string }>>} filesByField
   * @returns {Promise<Object>} the instance
   */
  async completeTaskWithFiles(args, filesByField) {
    const data = await tasksApi.post('/CompleteTaskWithFiles', createCompleteTaskWithFilesFormData(args, filesByField));
    return mapInstance(data);
  },

  /**
   * Hand an open to-do to somebody else.
   *
   * Returns `{ taskId, replacedTaskId }` — a **new** to-do, not the old one
   * updated. The original closes as `Reassigned` (status 4, not Cancelled) and
   * the replacement keeps the title, the due date and the escalation clock,
   * because a handover is the same piece of work and its deadline should not
   * restart.
   *
   * The id changing is the thing to design around: callers re-read the list
   * rather than patching the row in place.
   *
   * **There is no ownership check.** `WorkflowTasks.Reassign` is deliberately
   * its own permission, so somebody covering for a colleague can pass work on
   * without `ActAll`, which would also let them decide the outcome.
   *
   * @param {Object} args  { instanceId, taskId, toUserIds, toRoleIds }
   * @returns {Promise<{taskId: string, replacedTaskId: string}>}
   */
  async reassignTask(args) {
    const data = await tasksApi.post('/ReassignTask', createReassignTaskPayload(args));
    return {
      taskId: data?.taskId ?? null,
      replacedTaskId: data?.replacedTaskId ?? null,
    };
  },

  // =========================================================================
  // -------------------------------------------------------------------------
  // Engine limits — /api/WorkflowSettings
  // -------------------------------------------------------------------------

  /**
   * The eight engine limits, editable without SQL.
   *
   * Reading is `Workflows.Manage`; changing needs `Workflows.ManageSettings`.
   * A change takes effect on the next read — nothing is cached and no restart
   * is involved, so the screen does not need to warn about one.
   *
   * @returns {Promise<Array>} settings rows
   */
  async getSettings() {
    const data = await settingsApi.get('/GetSettings');
    return (data?.settings ?? []).map(mapWorkflowSetting);
  },

  /**
   * One page of the fields of one kind of thing, On and Off (2026-10-13) —
   * Workflow fields, the admin page. Workflows.Manage to read. `search` matches
   * the name or the label; `take` is 50 by default and at most 200.
   *
   * @param {{ targetTypeKey: number, search?: string, skip?: number, take?: number }} args
   * @returns {Promise<{ rows: Array, total: number }>}
   */
  async getFieldSettings({ targetTypeKey, search = '', skip = 0, take = 50 }) {
    const data = await settingsApi.get(
      '/GetFieldSettings',
      cleanParams({ TargetTypeKey: targetTypeKey, Search: search?.trim() || null, Skip: skip, Take: take })
    );
    return { rows: (data?.fields ?? []).map(mapFieldSetting), total: data?.total ?? 0 };
  },

  /**
   * Saves the changed rows (Workflows.ManageSettings) and answers with just
   * those rows, as saved. Refused with WF-057, its `errors` keyed by field name.
   *
   * @param {number} targetTypeKey
   * @param {Array} rows  only the changed ones, each whole
   * @returns {Promise<Array>} the saved rows
   */
  async saveFieldSettings(targetTypeKey, rows) {
    const data = await settingsApi.post('/SaveFieldSettings', createSaveFieldSettingsPayload(targetTypeKey, rows));
    return (data?.fields ?? []).map(mapFieldSetting);
  },

  /**
   * Change one limit. Returns just the row that changed.
   *
   * WF-047 is a value that does not fit the declared type and WF-046 a key that
   * is not a setting — both catchable in the editor before the call.
   *
   * @param {Object} args  { key, value }
   * @returns {Promise<Object>} the updated row
   */
  async updateSetting(args) {
    const data = await settingsApi.post('/UpdateSetting', createUpdateSettingPayload(args));
    return mapWorkflowSetting(data);
  },

  // API-domain allowlist — /api/WorkflowApiDomains
  // What a workflow may reach. Nothing to do with "external": the same list
  // governs this application's own API and anybody else's.
  // =========================================================================

  /**
   * Hosts an `http.call` step is allowed to reach.
   * @param {boolean} [enabledOnly]
   * @returns {Promise<Object[]>}
   */
  async getApiDomains(enabledOnly = null) {
    const data = await domainsApi.get('/GetApiDomains', cleanParams({ EnabledOnly: enabledOnly }));
    return (data?.domains ?? []).map(mapApiDomain);
  },

  /**
   * Approve a host. Takes a BARE host — `api.example.com`, no scheme, port or
   * path (WF-032 otherwise). Approving a withdrawn host re-enables that row.
   *
   * The response is documented only as a string; it is returned as-is rather
   * than interpreted, since callers today just refetch the list.
   *
   * @param {Object} args  { host, description }
   * @returns {Promise<string|null>}
   */
  async approveApiDomain(args) {
    const data = await domainsApi.post('/ApproveApiDomain', createApproveApiDomainPayload(args));
    return data ?? null;
  },

  /**
   * Enable or withdraw an approved host.
   * @param {Object} args  { domainId, isEnabled }
   * @returns {Promise<void>}
   */
  async setApiDomainEnabled(args) {
    await domainsApi.post('/SetApiDomainEnabled', createSetApiDomainEnabledPayload(args));
  },

  // =========================================================================
  // Audit — added 2026-10-07
  // =========================================================================

  /**
   * Who changed what in Workflow, newest first: workflows, settings, approved
   * domains and background jobs. `Workflows.Manage`.
   *
   * @param {{ area?: string, changedBy?: string, fromDate?: string, toDate?: string, correlationId?: string, skip?: number, take?: number }} [filters]
   */
  async getConfigChanges(filters = {}) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    const data = await definitionsApi.get('/GetConfigChanges', params);
    return { items: (data?.changes ?? []).map(mapConfigChange), total: data?.total ?? 0 };
  },

  /**
   * Everything one tracking number caused, across Workflow and Notifications.
   * An unknown number is an empty page, not an error. `WorkflowInstances.View`.
   */
  async getCorrelationTrace(correlationId) {
    const data = await instancesApi.get('/GetCorrelationTrace', { correlationId });
    return mapCorrelationTrace(data);
  },
};

export default workflowRepository;
