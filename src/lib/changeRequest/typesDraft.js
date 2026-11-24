import { CR_OTHER_TYPE_MAX } from '@/constants/changeRequests';

export function needsTypeText(typeKeys, types) {
  return (typeKeys ?? []).some((key) => (types ?? []).find((t) => t.key === key)?.requiresText);
}

/**
 * @param {{ typeKeys?: number[], otherTypeText?: string, projectEffectKey?: number|null }} draft
 * @param {Array<{ key: number, requiresText: boolean }>} types
 * @returns {{ typeKeys: string|null, otherTypeText: string|null, projectEffectKey: string|null }}
 */
export function typeProblems(draft, types, t) {
  const typeKeys = draft.typeKeys ?? [];
  const text = (draft.otherTypeText ?? '').trim();
  let otherTypeText = null;
  if (needsTypeText(typeKeys, types)) {
    if (!text) otherTypeText = t('describeOther');
    else if (text.length > CR_OTHER_TYPE_MAX) otherTypeText = t('atMost', { max: CR_OTHER_TYPE_MAX });
  }
  return {
    typeKeys: typeKeys.length === 0 ? t('pickType') : null,
    otherTypeText,
    projectEffectKey: draft.projectEffectKey == null ? t('pickEffect') : null,
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
