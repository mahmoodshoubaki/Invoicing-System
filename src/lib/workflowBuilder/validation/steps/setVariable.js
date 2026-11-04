import { BUILDER_LIMITS } from '@/constants/workflow';
import { validatePlaceholderValue } from '@/utils/workflowPlaceholder';

export function checkSetVariable(step, { where, declaredNames, errors }) {
  const name = step.name ?? '';

  if (!name.trim()) {
    errors.push(`${where} does not say which variable to set.`);
  } else if (name.startsWith(BUILDER_LIMITS.RESERVED_VARIABLE_PREFIX)) {
    errors.push(`${where} writes to "${name}", but names starting with __ are reserved by the engine.`);
  } else if (declaredNames.size > 0 && !declaredNames.has(name)) {
    const nearby = [...declaredNames].find((n) => n.toLowerCase() === name.toLowerCase());
    errors.push(
      nearby
        ? `${where} writes to "${name}", but the variable is spelled "${nearby}". Names are case-sensitive.`
        : `${where} writes to "${name}", which is not a declared variable.`
    );
  }

  // "" is legal — it clears the variable. A missing field is not.
  if (step.value == null) errors.push(`${where} has no value to write.`);
  else errors.push(...validatePlaceholderValue(step.value, { label: where }));
}
