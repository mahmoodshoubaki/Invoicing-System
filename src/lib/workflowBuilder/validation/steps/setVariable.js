import { BUILDER_LIMITS } from '@/constants/workflow';
import { validatePlaceholderValue } from '@/utils/workflowPlaceholder';

/** A Set variable step's rules. */

/*
 * Writes one value into a declared variable.
 *
 * The name has to match a variable or a manual-trigger input EXACTLY —
 * matching is case-sensitive server-side, so `Total` will not save against
 * a declared `total` (WF-040). That is why the editor offers a dropdown of
 * declared names rather than a text box: a typed name would produce a
 * save-time refusal for what looks like a correct spelling.
 */
export function checkSetVariable(step, { where, declaredNames, errors }) {
  const name = step.name ?? '';

  if (!name.trim()) {
    errors.push(`${where} does not say which variable to set.`);
  } else if (name.startsWith(BUILDER_LIMITS.RESERVED_VARIABLE_PREFIX)) {
    // WF-041.
    errors.push(`${where} writes to "${name}", but names starting with __ are reserved by the engine.`);
  } else if (declaredNames.size > 0 && !declaredNames.has(name)) {
    // WF-040. Guarded like the stage check above: a step validated on its
    // own has no list of declared names and must not report every one.
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
