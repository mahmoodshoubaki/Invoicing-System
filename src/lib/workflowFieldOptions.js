/**
 * What the builder knows about a field's VALUES that `GetFields` does not say.
 *
 * GetFields describes a field's name, type and operators. Two things it leaves
 * to the front end, by agreement with the backend:
 *
 * - **Lookup ids.** A BOQ item's `statusId` and `billingFrequencyId` are plain
 *   numbers. The author should pick "Submitted", not type 3 — so these fields
 *   carry `valueOptions` drawn from the same lookup lists the BOQ screens use.
 *   The id is still what is saved and compared.
 * - **People.** A person is stored as a user id (a guid). Person fields carry
 *   `valueLabels`, an id → name map, so a condition reads "approver is Ahmad"
 *   rather than a guid.
 *
 * Both are attached once, on the page, so every reader of a field — the value
 * box, the "Reads as" sentence, a step's collapsed summary, a loop item's
 * fields — sees the same thing without each having to look it up.
 */

import { TARGET_TYPE, VARIABLE_TYPE } from '@/constants/workflow';

/** A user id as the directory issues them. Anything else is not a person. */
export const PERSON_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a field holds one person.
 *
 * Two ways in: a record field the catalog flags `isUser` (an invoice's
 * `submittedBy`, which stays `typeKey: "text"`), and a variable of the person
 * type.
 */
export function isPersonField(field) {
  return field?.isUser === true || field?.typeKey === VARIABLE_TYPE.USER;
}

/**
 * Which record fields hold a lookup id, and which lookup list names them.
 * The backend named these two; nothing else is mapped.
 */
const LOOKUP_FIELDS = {
  [TARGET_TYPE.BOQ_ITEM]: {
    statusId: 'boqItemStatuses',
    billingFrequencyId: 'billingFrequencies',
  },
};

/**
 * The catalog with lookup names attached where a field holds a lookup id.
 *
 * A list that has not loaded (or could not be read) leaves its field alone, so
 * the value box falls back to an ordinary number box rather than an empty
 * dropdown nobody can choose from.
 *
 * @param {Object} fieldsByTargetType GetFields results, keyed by target type
 * @param {Object} lists `{ boqItemStatuses, billingFrequencies }`, each `[{ id, label }]`
 */
export function withLookupOptions(fieldsByTargetType, lists) {
  let changed = false;
  const next = { ...fieldsByTargetType };

  for (const [typeKey, mapped] of Object.entries(LOOKUP_FIELDS)) {
    const fields = fieldsByTargetType[typeKey];
    if (!fields?.length) continue;

    next[typeKey] = fields.map((field) => {
      const list = lists?.[mapped[field.name]];
      if (!list?.length) return field;
      changed = true;
      return {
        ...field,
        // Strings, because every condition value travels as a string.
        valueOptions: list.map((row) => ({ key: String(row.id), label: row.label ?? String(row.id) })),
      };
    });
  }

  return changed ? next : fieldsByTargetType;
}

/**
 * Person fields with the names of the people they may hold.
 *
 * @param {Array} fields
 * @param {Object} namesById lower-cased user id → display name, from `personNames`
 */
export function withPersonNames(fields, namesById) {
  if (!fields?.some(isPersonField)) return fields;
  return fields.map((field) => (isPersonField(field) ? { ...field, valueLabels: namesById } : field));
}

/** The same, for every target type's catalog. */
export function withPersonNamesByType(fieldsByTargetType, namesById) {
  const next = {};
  for (const [typeKey, fields] of Object.entries(fieldsByTargetType)) {
    next[typeKey] = withPersonNames(fields, namesById);
  }
  return next;
}

/**
 * What a literal value reads as for this field: an outcome's or a lookup's
 * label, a person's name — or null when it should be shown as typed.
 */
export function valueLabel(field, value) {
  if (value == null || value === '') return null;
  const option = (field?.valueOptions ?? field?.outcomeValues)?.find((o) => String(o.key) === String(value));
  if (option) return option.label;
  // Keys are lower-cased: the engine compares ids ignoring case, so a guid
  // saved in capitals is the same person.
  return field?.valueLabels?.[String(value).toLowerCase()] ?? null;
}

/**
 * id → display name for every person the directory has answered for, keyed in
 * lower case to match `valueLabel`. Keyed by username too (2026-10-20): a
 * person field may hold a username like DOMAIN\jdoe rather than a user id.
 *
 * @param {Object} resolvedById the builder's assignee cache
 */
export function personNames(resolvedById) {
  const names = {};
  for (const user of Object.values(resolvedById ?? {})) {
    if (user?.id && user.displayName) names[String(user.id).toLowerCase()] = user.displayName;
    if (user?.username && user.displayName) names[String(user.username).toLowerCase()] = user.displayName;
  }
  return names;
}
