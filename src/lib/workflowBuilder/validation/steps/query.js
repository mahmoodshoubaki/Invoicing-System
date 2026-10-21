import { BUILDER_LIMITS, PICKED_TARGETS_LIST, SEARCHABLE_TARGET_TYPES, isComparableField } from '@/constants/workflow';
import { validateFilterGroup } from '@/lib/filterDescription';

/** A query's rules: where its results go, what it searches, and its filter. */

export function checkQuery(step, { where, fieldsByTargetType, errors }) {
  if (!step.into?.trim()) {
    errors.push(`${where} has no variable to put the results in.`);
  } else if (step.into.startsWith(BUILDER_LIMITS.RESERVED_VARIABLE_PREFIX)) {
    errors.push(`${where} writes to "${step.into}", but names starting with __ are reserved by the engine.`);
  } else if (step.into === PICKED_TARGETS_LIST) {
    errors.push(`${where} writes to "${PICKED_TARGETS_LIST}", which the engine fills with the records a run was started on. Rename the step.`);
  }

  if (step.max != null && step.max <= 0) errors.push(`${where} is limited to zero results.`);

  if (step.targetTypeKey == null) {
    errors.push(`${where} has no record type chosen.`);
  } else if (!SEARCHABLE_TARGET_TYPES.includes(step.targetTypeKey)) {
    // WF-029.
    errors.push(`${where} searches a record type that cannot be searched.`);
  }

  /*
   * The filter's fields are the SEARCHED type's — an invoice workflow
   * looking for BOQ items filters on BOQ item fields. Checked only once
   * that catalog has arrived; until then nothing here is judged, rather
   * than every field being reported unknown for a moment.
   *
   * A query SEARCHES, so it may only name fields the module indexed —
   * WF-030. Reading a field in an ordinary condition is always allowed.
   */
  const searched = (fieldsByTargetType[step.targetTypeKey] ?? []).filter(isComparableField);
  if (searched.length > 0) {
    for (const problem of validateFilterGroup(step.filter, searched, { filterableOnly: true })) {
      errors.push(`${where}: ${problem}`);
    }
  }
}
