import { createDefinitionPayload } from '@/models/workflow';

/** The longest name SaveDefinition accepts. */
export const WORKFLOW_NAME_MAX = 200;
const SUFFIX = ' Copy';

/** "<name> Copy", the name cut so the whole fits. */
export function copyName(name) {
  const base = String(name ?? '').trim() || 'Workflow';
  return `${base.slice(0, WORKFLOW_NAME_MAX - SUFFIX.length).trimEnd()}${SUFFIX}`;
}

/**
 * SaveDefinition's body for a new workflow copied from `definition` (GetDefinition's):
 * no code and no stamp, so the server creates it; everything else as it is.
 */
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
