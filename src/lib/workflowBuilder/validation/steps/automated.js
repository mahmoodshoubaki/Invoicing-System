import { AUTOMATED_MODE, AUTOMATED_MODE_INFO, HTTP_CALL_ACTION } from '@/constants/workflow';
import { INTERNAL_API_LABEL, INTERNAL_API_PREFIX, isInternalApiUrl } from '@/utils/httpCallUrl';
import { readPlaceholder, validatePlaceholderValue } from '@/utils/workflowPlaceholder';

export function checkAutomated(step, { where, actions, errors }) {
  if (step.mode && !Object.values(AUTOMATED_MODE).includes(step.mode)) {
    errors.push(
      `${where} uses "${step.mode}", which is not a mode any more. Choose one of: ${Object.values(AUTOMATED_MODE_INFO).map((m) => m.label).join(', ')}.`
    );
  }

  if (!step.action) {
    errors.push(`${where} has no action chosen.`);
    return;
  }

  if (step.action === HTTP_CALL_ACTION) {
    const url = step.inputs?.url ?? '';
    if (!url.trim()) {
      errors.push(`${where} has no URL.`);
    } else if (isInternalApiUrl(url)) {
      /* ignore */
    } else if (url.startsWith('{{')) {
      errors.push(
        `${where} starts its URL with a placeholder. The only one allowed there is `
        + `${INTERNAL_API_PREFIX} — choose "${INTERNAL_API_LABEL}" instead.`
      );
    } else if (!/^https?:\/\//i.test(url)) {
      errors.push(`${where} needs an absolute http or https URL.`);
    } else if (/^https?:\/\/[^/@]*@/i.test(url)) {
      errors.push(`${where} has credentials in its URL. Use a {{secrets.Name}} header instead.`);
    }
    return;
  }

  const declared = actions.find((a) => a.key === step.action)?.inputs ?? [];
  for (const input of declared) {
    const raw = step.inputs?.[input.name];
    const value = raw == null ? '' : String(raw);

    if (input.required && value.trim() === '') {
      errors.push(`${where} needs "${input.label}".`);
      continue;
    }
    if (value === '') continue;

    errors.push(...validatePlaceholderValue(value, { label: `${where}: "${input.label}"` }));

    const isPlaceholder = readPlaceholder(value).kind !== 'literal';
    if (!isPlaceholder && input.choices?.length > 0 && !input.choices.some((c) => c.value === value)) {
      const offered = input.choices.map((c) => c.label).join(', ');
      errors.push(`${where} sets "${input.label}" to something that is not one of: ${offered}.`);
    }
  }
}
