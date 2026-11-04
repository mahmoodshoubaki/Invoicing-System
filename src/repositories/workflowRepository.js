import { createApiClient } from '@/lib/apiClient';
import { fetchAllPages } from '@/lib/fetchAllPages';
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
 * @param {Object} params
 * @returns {Object}
 */
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
  );
}

export const workflowRepository = {

  /**
   * @param {Object} payload
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
   * @param {string} code
   * @returns {Promise<{definitionId: string, version: number}>}
   */
  async publishDefinition(code) {
    const data = await definitionsApi.post('/PublishDefinition', { code });
    return { definitionId: data?.definitionId ?? null, version: data?.version ?? null };
  },

  /**
   * @param {string} definitionId
   * @returns {Promise<void>}
   */
  async activateDefinition(definitionId) {
    await definitionsApi.post('/ActivateDefinition', { definitionId });
  },

  /**
   * @param {string} definitionId
   * @returns {Promise<void>}
   */
  async deleteDefinition(definitionId) {
    await definitionsApi.post('/DeleteDefinition', { definitionId });
  },

  /**
   * @param {Object} [filters]
   * @param {number} [filters.targetTypeKey]
   * @param {boolean} [filters.activeOnly]
   * @returns {Promise<Object[]>}
   */
  async getDefinitions({ targetTypeKey = null, activeOnly = null } = {}) {
    const rows = await fetchAllPages(async (skip, take) => {
      const page = await definitionsApi.get(
        '/GetDefinitions',
        cleanParams({ TargetTypeKey: targetTypeKey, ActiveOnly: activeOnly, Skip: skip, Take: take })
      );
      return { rows: page?.workflows ?? [], total: page?.total ?? 0 };
    });
    return rows.map(mapDefinitionRow);
  },

  /**
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
   * @param {string} code
   * @returns {Promise<Object[]>}
   */
  async getDefinitionVersions(code) {
    const data = await definitionsApi.get('/GetDefinitionVersions', { Code: code });
    return (data?.versions ?? []).map(mapVersionRow);
  },

  /**
   * @param {number} targetTypeKey
   * @returns {Promise<Object[]>}
   */
  async getFields(targetTypeKey) {
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
   * @param {number} [targetTypeKey]
   * @returns {Promise<Object[]>}
   */
  async getEvents(targetTypeKey = null) {
    const data = await definitionsApi.get('/GetEvents', cleanParams({ TargetTypeKey: targetTypeKey }));
    return (data?.events ?? []).map(mapEvent);
  },

  /**
   * @returns {Promise<Object[]>}
   */
  async getActions() {
    const data = await definitionsApi.get('/GetActions');
    return (data?.actions ?? []).map(mapAction);
  },

  /**
   * @returns {Promise<Object[]>}
   */
  async getTargetTypes() {
    const data = await definitionsApi.get('/GetTargetTypes');
    return (data?.targetTypes ?? []).map(mapTargetType);
  },

  /**
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async startInstance(args) {
    const data = await instancesApi.post('/StartInstance', createStartInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async advanceInstance(args) {
    const data = await instancesApi.post('/AdvanceInstance', createAdvanceInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async resumeInstance(args) {
    const data = await instancesApi.post('/ResumeInstance', createResumeInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async pauseInstance(args) {
    const data = await instancesApi.post('/PauseInstance', createPauseInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async cancelInstance(args) {
    const data = await instancesApi.post('/CancelInstance', createCancelInstancePayload(args));
    return mapInstance(data);
  },

  /**
   * @param {string} instanceId
   * @returns {Promise<Object>}
   */
  async getInstance(instanceId) {
    const data = await instancesApi.get('/GetInstance', { InstanceId: instanceId });
    return mapInstance(data);
  },

  /**
   * @param {string} instanceId
   * @returns {Promise<Array<{ name: string, type: string|null, value: * }>>}
   */
  async getInstanceVariables(instanceId) {
    const data = await instancesApi.get('/GetInstanceVariables', cleanParams({ InstanceId: instanceId }));
    return (data?.variables ?? []).map(mapInstanceVariable);
  },

  /**
   * @param {Object} args
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
   * @param {Object} args
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

  /**
   * @param {{ statusKey?: number|null, skip?: number, take?: number }} [args]
   * @returns {Promise<{ items: Object[], total: number, pendingCount: number|null }>}
   */
  async getMyTasks({ instanceId = null, statusKey = null, skip = 0, take = 50 } = {}) {
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
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async completeTask(args) {
    const data = await tasksApi.post('/CompleteTask', createCompleteTaskPayload(args));
    return mapInstance(data);
  },

  /**
   * @param {Object} args
   * @param {Object<string, Array<{ file: File, name: string }>>} filesByField
   * @returns {Promise<Object>}
   */
  async completeTaskWithFiles(args, filesByField) {
    const data = await tasksApi.post('/CompleteTaskWithFiles', createCompleteTaskWithFilesFormData(args, filesByField));
    return mapInstance(data);
  },

  /**
   * @param {Object} args
   * @returns {Promise<{taskId: string, replacedTaskId: string}>}
   */
  async reassignTask(args) {
    const data = await tasksApi.post('/ReassignTask', createReassignTaskPayload(args));
    return {
      taskId: data?.taskId ?? null,
      replacedTaskId: data?.replacedTaskId ?? null,
    };
  },

  /**
   * @returns {Promise<Array>}
   */
  async getSettings() {
    const data = await settingsApi.get('/GetSettings');
    return (data?.settings ?? []).map(mapWorkflowSetting);
  },

  /**
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
   * @param {number} targetTypeKey
   * @param {Array} rows
   * @returns {Promise<Array>}
   */
  async saveFieldSettings(targetTypeKey, rows) {
    const data = await settingsApi.post('/SaveFieldSettings', createSaveFieldSettingsPayload(targetTypeKey, rows));
    return (data?.fields ?? []).map(mapFieldSetting);
  },

  /**
   * @param {Object} args
   * @returns {Promise<Object>}
   */
  async updateSetting(args) {
    const data = await settingsApi.post('/UpdateSetting', createUpdateSettingPayload(args));
    return mapWorkflowSetting(data);
  },

  /**
   * @param {boolean} [enabledOnly]
   * @returns {Promise<Object[]>}
   */
  async getApiDomains(enabledOnly = null) {
    const data = await domainsApi.get('/GetApiDomains', cleanParams({ EnabledOnly: enabledOnly }));
    return (data?.domains ?? []).map(mapApiDomain);
  },

  /**
   * @param {Object} args
   * @returns {Promise<string|null>}
   */
  async approveApiDomain(args) {
    const data = await domainsApi.post('/ApproveApiDomain', createApproveApiDomainPayload(args));
    return data ?? null;
  },

  /**
   * @param {Object} args
   * @returns {Promise<void>}
   */
  async setApiDomainEnabled(args) {
    await domainsApi.post('/SetApiDomainEnabled', createSetApiDomainEnabledPayload(args));
  },

  /**
   * @param {{ area?: string, changedBy?: string, fromDate?: string, toDate?: string, correlationId?: string, skip?: number, take?: number }} [filters]
   */
  async getConfigChanges(filters = {}) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
    const data = await definitionsApi.get('/GetConfigChanges', params);
    return { items: (data?.changes ?? []).map(mapConfigChange), total: data?.total ?? 0 };
  },

  async getCorrelationTrace(correlationId) {
    const data = await instancesApi.get('/GetCorrelationTrace', { correlationId });
    return mapCorrelationTrace(data);
  },
};

export default workflowRepository;
