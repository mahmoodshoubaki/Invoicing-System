import { createDefinitionPayload } from '@/models/workflow';

export const WORKFLOW_NAME_MAX = 200;
const SUFFIX = ' Copy';

export function copyName(name) {
  const base = String(name ?? '').trim() || 'Workflow';
  return `${base.slice(0, WORKFLOW_NAME_MAX - SUFFIX.length).trimEnd()}${SUFFIX}`;
}

export function duplicatePayload(definition, name) {
  return createDefinitionPayload({
    code: null,
    stamp: null,
    name: name.trim(),
    description: definition.description ?? '',
    targetTypeKey: definition.targetTypeKey,
    trigger: definition.trigger,
    variables: definition.variables ?? [],
    graph: definition.graph,
  });
}
