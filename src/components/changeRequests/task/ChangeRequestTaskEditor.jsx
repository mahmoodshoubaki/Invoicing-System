'use client';

import { useImperativeHandle, useRef } from 'react';
import { Info } from 'lucide-react';

import Reveal from '@/components/motion/Reveal';
import ReasonsSection from '@/components/changeRequests/form/ReasonsSection';
import DetailsSection from '@/components/changeRequests/form/DetailsSection';
import ProjectChangesSection from '@/components/changeRequests/form/ProjectChangesSection';
import ItemChangesSection from '@/components/changeRequests/form/ItemChangesSection';
import ChangeSummary from '@/components/changeRequests/form/ChangeSummary';
import { useChangeRequestForm } from '@/components/changeRequests/form/useChangeRequestForm';
import { useScrollToProblem } from '@/components/changeRequests/form/useScrollToProblem';
import { asksForChanges, changeRequestTaskValues, splitChangeRequestErrors } from '@/lib/changeRequest/taskFields';
import { CHROME } from '@/theme/vizPalette';

/** Whether a mapped refusal put anything under a box. */
const anyBox = (p) => Boolean(p.reasons || p.details || Object.keys(p.project).length || Object.keys(p.items).length);

/** What the task leaves as the request has it, said once above the changes. */
function lockedNote(asks) {
  if (asks.fieldChanges && !asks.cycleChanges) return 'This task changes the item and project fields only — each item’s invoicing plan stays as the request has it.';
  if (asks.cycleChanges && !asks.fieldChanges) return 'This task changes the invoicing plans only — the item and project fields stay as the request has them.';
  return null;
}

/**
 * A change request's parts in a workflow task (2026-10-20), drawn with the
 * create form's own sections and checked by its own rules — only the parts the
 * task asks for, the rest locked as the request has them.
 *
 * The task's buttons are the task form's, so the form is reached through
 * `handleRef`: `check()` shows what is wrong (scrolling to the first problem)
 * and says whether the answer may go; `values()` is what to send, by the
 * task's field names; `showRefusal(errors, sent)` puts the server's complaints
 * under their boxes and returns the ones about the request as a whole, and the
 * ones that are not the request's.
 *
 * @param {{
 *   parts: Object, asks: Object, reasons: Array, handleRef: { current: Object|null },
 *   data: { boqItems: Array, subProjects: Array, initial: Object, kept: Object, statusNameOf: (statusId) => string|null },
 * }} props
 */
export default function ChangeRequestTaskEditor({ parts, asks, reasons, data, handleRef }) {
  const form = useChangeRequestForm({
    boqItems: data.boqItems,
    statusNameOf: data.statusNameOf,
    subProjects: data.subProjects,
    initial: data.initial,
    asks,
  });
  const rootRef = useRef(null);
  useScrollToProblem(rootRef, form.refusedCount);

  useImperativeHandle(handleRef, () => ({
    check: form.check,
    values: () => changeRequestTaskValues(parts, form.draft, { subProjects: data.subProjects, kept: data.kept }),
    showRefusal: (errors, sent) => {
      const { placed, rest } = splitChangeRequestErrors(errors, sent);
      const { general, ...boxes } = placed;
      form.showServerErrors(boxes);
      return { rest, general, placed: anyBox(boxes) };
    },
  }), [form, parts, data.subProjects, data.kept]);

  const changes = asksForChanges(parts);
  const note = lockedNote(asks);
  const keptCount = data.kept.fieldChanges.length + data.kept.cycleChanges.length;

  return (
    <div ref={rootRef}>
      <Reveal className="flex flex-col gap-4">
        {parts.reasons && <ReasonsSection form={form} reasons={reasons} />}
        {parts.details && <DetailsSection form={form} />}
        {changes && (note || keptCount > 0) && (
          <div className="flex items-start gap-1.5 rounded-xl bg-[#f6f5f3] px-4 py-3 text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
            <Info size={13} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
            <div>
              {note && <p>{note}</p>}
              {keptCount > 0 && (
                <p>
                  {keptCount} change{keptCount === 1 ? '' : 's'} on an item or sub-project this form can&rsquo;t show
                  {keptCount === 1 ? ' is' : ' are'} kept and sent back as {keptCount === 1 ? 'it is' : 'they are'}.
                </p>
              )}
            </div>
          </div>
        )}
        {changes && <ProjectChangesSection form={form} subProjects={data.subProjects} />}
        {changes && <ItemChangesSection form={form} boqItems={data.boqItems} statusNameOf={data.statusNameOf} />}
        {changes && <ChangeSummary form={form} subProjects={data.subProjects} boqItems={data.boqItems} />}
      </Reveal>
    </div>
  );
}
