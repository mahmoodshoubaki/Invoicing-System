import { AUTOMATED_MODE, AUTOMATED_MODE_INFO, HTTP_CALL_ACTION } from '@/constants/workflow';
import { INTERNAL_API_LABEL, INTERNAL_API_PREFIX, isInternalApiUrl } from '@/utils/httpCallUrl';
import { readPlaceholder, validatePlaceholderValue } from '@/utils/workflowPlaceholder';

/** An automated step's rules: its mode, its action, and that action's inputs. */

export function checkAutomated(step, { where, actions, errors }) {
  /*
   * `waitForSuccess` was renamed to `manualRetry` and is now refused at save
   * with WF-008. Definitions in the database were migrated, so this only
   * catches something the front end is holding — but a step carrying it
   * saves as a 400 rather than as anything readable, so it is named here.
   */
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
      /*
       * This system's own API — the one placeholder allowed to begin an
       * address, and only as exactly `{{secrets.InternalApi}}/`. The server
       * fills it in from configuration, so nothing about the address is
       * checkable here; the host it resolves to is checked against the
       * allowlist when the call runs.
       */
    } else if (url.startsWith('{{')) {
      // Every OTHER placeholder at the start stays refused: a placeholder
      // there decides where the request is sent, and a credential's value
      // must never become a destination.
      errors.push(
        `${where} starts its URL with a placeholder. The only one allowed there is `
        + `${INTERNAL_API_PREFIX} — choose "${INTERNAL_API_LABEL}" instead.`
      );
    } else if (!/^https?:\/\//i.test(url)) {
      errors.push(`${where} needs an absolute http or https URL.`);
    } else if (/^https?:\/\/[^/@]*@/i.test(url)) {
      // WF-032. Credentials in a URL would also be stored in the definition
      // in plain text, which is the thing secrets exist to avoid.
      errors.push(`${where} has credentials in its URL. Use a {{secrets.Name}} header instead.`);
    }
    return;
  }

  /*
   * An action that describes its inputs can be checked here instead of at
   * save — WF-042 for a missing required input, WF-043 for a literal that
   * is not one of the offered choices.
   *
   * A placeholder is never judged against `choices`: what `{{status}}`
   * resolves to is not knowable until the run gets there, and refusing it
   * would make the choice inputs unusable with a variable.
   */
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
