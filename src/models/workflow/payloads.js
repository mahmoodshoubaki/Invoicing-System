/**
 * @param {Object} data
 * @param {string|null} [data.code]
 * @param {number|null} [data.stamp]
 */
export function createDefinitionPayload({
  code = null,
  stamp = null,
  name,
  description = '',
  targetTypeKey,
  trigger,
  variables = [],
  graph,
}) {
  return {
    code,
    stamp,
    name,
    description,
    targetTypeKey,
    trigger,
    variables,
    graph,
  };
}

export function createStartInstancePayload({ code, targetIds = [], inputs = {}, values = {} }) {
  return {
    code,
    targetIds: (targetIds ?? []).map((id) => String(id ?? '').trim()).filter(Boolean),
    inputs,
    values,
  };
}

export function createAdvanceInstancePayload({ instanceId, values = {} }) {
  return { instanceId, values };
}

export function createResumeInstancePayload({ instanceId, notes = null, resetStepCount = false, variableChanges = null }) {
  const body = { instanceId, resetStepCount: resetStepCount === true };
  if (notes?.trim()) body.notes = notes.trim();
  if (variableChanges && Object.keys(variableChanges).length > 0) body.variableChanges = variableChanges;
  return body;
}

export function createCancelInstancePayload({ instanceId, reason }) {
  return { instanceId, reason: String(reason ?? '').trim() };
}

export function createPauseInstancePayload({ instanceId, reason }) {
  return { instanceId, reason: String(reason ?? '').trim() };
}

export function createReassignTaskPayload({ instanceId, taskId, toUserIds = [], toRoleIds = [], toGroupIds = [] }) {
  return {
    instanceId,
    taskId,
    toUserIds: [...new Set((toUserIds ?? []).filter(Boolean))],
    toRoleIds: [...new Set((toRoleIds ?? []).filter(Boolean))],
    toGroupIds: [...new Set((toGroupIds ?? []).filter(Boolean))],
  };
}

export function createCompleteTaskPayload({ instanceId, taskId, outcomeKey, comment = null, values = {}, reasonKey = null, otherReason = null }) {
  return {
    instanceId,
    taskId,
    outcomeKey,
    comment,
    values,
    ...(reasonKey ? { reasonKey } : {}),
    ...(otherReason ? { otherReason } : {}),
  };
}

/**
 * @param {Object} args
 * @param {Object<string, Array<{ file: File, name: string }>>} filesByField
 * @returns {FormData}
 */
export function createCompleteTaskWithFilesFormData(args, filesByField = {}) {
  const formData = new FormData();
  formData.append('Request', JSON.stringify(createCompleteTaskPayload(args)));
  for (const [fieldName, files] of Object.entries(filesByField)) {
    for (const entry of files ?? []) formData.append(fieldName, entry.file, entry.name);
  }
  return formData;
}
