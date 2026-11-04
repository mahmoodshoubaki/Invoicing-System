import { CR_OTHER_TYPE_MAX } from '@/constants/changeRequests';

export function needsTypeText(typeKeys, types) {
  return (typeKeys ?? []).some((key) => (types ?? []).find((t) => t.key === key)?.requiresText);
}

/**
 * @param {{ typeKeys?: number[], otherTypeText?: string, projectEffectKey?: number|null }} draft
 * @param {Array<{ key: number, requiresText: boolean }>} types
 * @returns {{ typeKeys: string|null, otherTypeText: string|null, projectEffectKey: string|null }}
 */
export function typeProblems(draft, types) {
  const typeKeys = draft.typeKeys ?? [];
  const text = (draft.otherTypeText ?? '').trim();
  let otherTypeText = null;
  if (needsTypeText(typeKeys, types)) {
    if (!text) otherTypeText = 'Describe the other type.';
    else if (text.length > CR_OTHER_TYPE_MAX) otherTypeText = `At most ${CR_OTHER_TYPE_MAX} characters.`;
  }
  return {
    typeKeys: typeKeys.length === 0 ? 'Pick at least one type.' : null,
    otherTypeText,
    projectEffectKey: draft.projectEffectKey == null ? 'Pick the project effect.' : null,
  };
}

export function typesText(typeKeys, otherTypeText, typesMap) {
  return (typeKeys ?? [])
    .map((key) => {
      const type = typesMap[key];
      const label = type?.label ?? `Type ${key}`;
      return type?.requiresText && otherTypeText?.trim() ? `${label}: ${otherTypeText.trim()}` : label;
    })
    .join(', ');
}
