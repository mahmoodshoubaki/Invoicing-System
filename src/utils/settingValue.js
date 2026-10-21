import { SETTING_TYPE } from '@/constants/workflow';

/**
 * Why a value will not do, in the words the server would use.
 *
 * Values travel as strings and are parsed against the row's `type`. A value the
 * reader cannot parse leaves it quietly running on a built-in default with the
 * wrong number on screen — so it is checked here rather than left to the save.
 */
export function settingProblem(value, type) {
  const text = String(value ?? '').trim();
  if (text === '') return 'Needs a value.';

  switch (type) {
    case SETTING_TYPE.POSITIVE_INTEGER:
    case SETTING_TYPE.WHOLE_NUMBER: {
      const n = Number(text);
      if (!/^-?\d+$/.test(text) || !Number.isInteger(n)) return 'Whole numbers only.';
      if (type === SETTING_TYPE.POSITIVE_INTEGER && n < 1) return 'Must be at least 1.';
      if (type === SETTING_TYPE.WHOLE_NUMBER && n < 0) return 'Must be 0 or more.';
      return null;
    }
    case SETTING_TYPE.BOOLEAN:
      return ['true', 'false'].includes(text.toLowerCase()) ? null : 'Must be true or false.';
    case SETTING_TYPE.URL:
      try {
        const url = new URL(text);
        return ['http:', 'https:'].includes(url.protocol) ? null : 'Must start with http:// or https://';
      } catch {
        return 'Must be a full address, like https://invoicing.example.com';
      }
    default:
      return null;
  }
}
