'use client';

import { useImperativeHandle, useRef } from 'react';
import { Info } from 'lucide-react';

import Reveal from '@/components/motion/Reveal';
import ReasonsSection from '@/components/changeRequests/form/ReasonsSection';
import TypeAndEffectSection from '@/components/changeRequests/form/TypeAndEffectSection';
import DetailsSection from '@/components/changeRequests/form/DetailsSection';
import ProjectChangesSection from '@/components/changeRequests/form/ProjectChangesSection';
import ItemChangesSection from '@/components/changeRequests/form/ItemChangesSection';
import ChangeSummary from '@/components/changeRequests/form/ChangeSummary';
import { useChangeRequestForm } from '@/components/changeRequests/form/useChangeRequestForm';
import { useScrollToProblem } from '@/components/changeRequests/form/useScrollToProblem';
import { asksForChanges, changeRequestTaskValues, splitChangeRequestErrors } from '@/lib/changeRequest/taskFields';
import { CHROME } from '@/theme/vizPalette';

const anyBox = (p) => Boolean(
  p.reasons || p.typeKeys || p.otherTypeText || p.projectEffectKey || p.details
  || Object.keys(p.project).length || Object.keys(p.items).length
);

function lockedNote(asks) {
  if (asks.fieldChanges && !asks.cycleChanges) return 'This task changes the item and project fields only — each item’s invoicing plan stays as the request has it.';
  if (asks.cycleChanges && !asks.fieldChanges) return 'This task changes the invoicing plans only — the item and project fields stay as the request has them.';
  return null;
}

/**
 * @param {{ parts: Object, asks: Object, reasons: Array, handleRef: { current: Object|null }, data: { boqItems: Array, subProjects: Array, initial: Object, kept: Object, statusNameOf: (statusId) => string|null }, }} props
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
        {(parts.types || parts.otherType || parts.effect) && <TypeAndEffectSection form={form} />}
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
