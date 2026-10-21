'use client';

import { useRef } from 'react';
import { Info } from 'lucide-react';

import Reveal from '@/components/motion/Reveal';
import { CR_RULES } from '@/constants/changeRequests';
import { CHROME } from '@/theme/vizPalette';
import ReasonsSection from './ReasonsSection';
import DetailsSection from './DetailsSection';
import ProjectChangesSection from './ProjectChangesSection';
import ItemChangesSection from './ItemChangesSection';
import ChangeSummary from './ChangeSummary';
import ChangeRequestActions from './ChangeRequestActions';
import { useChangeRequestForm } from './useChangeRequestForm';
import { useScrollToProblem } from './useScrollToProblem';

/**
 * A change request on a project's BOQ (2026-10-18; sent to the API
 * 2026-10-19): its reasons, the user's details, the sub-projects' changes, each
 * item's changes, and a summary — mounted once the project, its BOQ and (to
 * edit a returned request) the request are loaded.
 *
 * A refused Submit (2026-10-20) scrolls to the first problem on the page and
 * puts the cursor in its box — opening any folded item that has one first.
 *
 * @param {{
 *   boqItems: Array, statusNameOf: (statusId) => string|null, subProjects: Array, reasons: Array,
 *   initial?: Object|null, onSubmit: (body: Object) => Promise<void>, cancelHref: string, submitLabel: string,
 * }} props
 */
export default function ChangeRequestForm({
  boqItems, statusNameOf, subProjects, reasons, initial = null, onSubmit, cancelHref, submitLabel,
}) {
  const form = useChangeRequestForm({ boqItems, statusNameOf, subProjects, initial, onSubmit });
  const rootRef = useRef(null);
  useScrollToProblem(rootRef, form.refusedCount);

  return (
    <div ref={rootRef}>
      <div className="mb-5 flex items-start gap-1.5 rounded-xl bg-[#f6f5f3] px-4 py-3 text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
        <Info size={13} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <div>
          <p>A formal request to change the approved BOQ. Nothing changes until an approver accepts it.</p>
          <ul className="mt-1 list-disc pl-4" style={{ color: CHROME.textMuted }}>
            {CR_RULES.map((rule) => <li key={rule}>{rule}</li>)}
          </ul>
        </div>
      </div>

      <Reveal className="flex flex-col gap-5">
        <ReasonsSection form={form} reasons={reasons} />
        <DetailsSection form={form} />
        <ProjectChangesSection form={form} subProjects={subProjects} />
        <ItemChangesSection form={form} boqItems={boqItems} statusNameOf={statusNameOf} />
        <ChangeSummary form={form} subProjects={subProjects} boqItems={boqItems} />
      </Reveal>

      <ChangeRequestActions form={form} cancelHref={cancelHref} submitLabel={submitLabel} />
    </div>
  );
}
