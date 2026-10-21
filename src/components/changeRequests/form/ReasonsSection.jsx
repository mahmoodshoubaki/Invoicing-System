'use client';

import { ListChecks } from 'lucide-react';

import FormSection from '@/components/common/FormSection';
import CheckboxDropdown from '@/components/ui/CheckboxDropdown';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * Why the BOQ changes: one or more of the fixed reasons (from the server, with
 * Arabic), picked from a dropdown of checkboxes (2026-10-20) — each with its
 * fixed justification under it, to be read, never edited.
 *
 * @param {{ form: ReturnType<import('./useChangeRequestForm').useChangeRequestForm>, reasons: Array }} props
 */
export default function ReasonsSection({ form, reasons }) {
  const problem = form.shownProblems.reasons;

  return (
    <FormSection title="Reasons" subtitle="Why the BOQ changes — pick one or more" icon={ListChecks}>
      {reasons.length === 0 ? (
        <p className="text-xs" style={{ color: CHROME.textMuted }}>Loading the reasons…</p>
      ) : (
        <div data-problem-scope>
          <CheckboxDropdown
            label="Reasons"
            options={reasons.map((r) => ({ value: r.key, label: r.label, description: r.justification }))}
            selected={form.reasons}
            onToggle={form.toggleReason}
            placeholder="Choose the reasons…"
            error={problem}
          />
          {problem && <p data-problem className="mt-2 text-xs" style={{ color: STATUS.critical }}>{problem}</p>}
        </div>
      )}
    </FormSection>
  );
}
