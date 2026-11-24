'use client';

import { useRef } from 'react';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import Reveal from '@/components/motion/Reveal';
import { CR_RULE_KEYS } from '@/constants/changeRequests';
import { CHROME } from '@/theme/vizPalette';
import ReasonsSection from './ReasonsSection';
import TypeAndEffectSection from './TypeAndEffectSection';
import DetailsSection from './DetailsSection';
import ProjectChangesSection from './ProjectChangesSection';
import ItemChangesSection from './ItemChangesSection';
import RequestFilesSection from './RequestFilesSection';
import ChangeSummary from './ChangeSummary';
import ChangeRequestActions from './ChangeRequestActions';
import { useChangeRequestForm } from './useChangeRequestForm';
import { useScrollToProblem } from './useScrollToProblem';

/**
 * @param {{ boqItems: Array, statusNameOf: (statusId) => string|null, subProjects: Array, reasons: Array, initial?: Object|null, onSubmit: (body: Object) => Promise<void>, cancelHref: string, submitLabel: string, }} props
 */
export default function ChangeRequestForm({
  boqItems, statusNameOf, subProjects, reasons, initial = null, onSubmit, cancelHref, submitLabel,
  changeRequestId = null,
}) {
  const form = useChangeRequestForm({ boqItems, statusNameOf, subProjects, initial, onSubmit });
  const t = useTranslations('changeRequests.form');
  const tr = useTranslations('changeRequests.rules');
  const rootRef = useRef(null);
  useScrollToProblem(rootRef, form.refusedCount);

  return (
    <div ref={rootRef}>
      <div className="mb-5 flex items-start gap-1.5 rounded-xl bg-[#f6f5f3] px-4 py-3 text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
        <Info size={13} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
        <div>
          <p>{t('intro')}</p>
          <ul className="mt-1 list-disc ps-4" style={{ color: CHROME.textMuted }}>
            {CR_RULE_KEYS.map((rule) => <li key={rule}>{tr(rule)}</li>)}
          </ul>
        </div>
      </div>

      <Reveal className="flex flex-col gap-5">
        <TypeAndEffectSection form={form} />
        <ReasonsSection form={form} reasons={reasons} />
        <DetailsSection form={form} />
        <ProjectChangesSection form={form} subProjects={subProjects} />
        <ItemChangesSection form={form} boqItems={boqItems} statusNameOf={statusNameOf} />
        <RequestFilesSection form={form} changeRequestId={changeRequestId} />
        <ChangeSummary form={form} subProjects={subProjects} boqItems={boqItems} />
      </Reveal>

      <ChangeRequestActions form={form} cancelHref={cancelHref} submitLabel={submitLabel} />
    </div>
  );
}
