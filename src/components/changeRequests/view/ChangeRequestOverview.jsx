'use client';

import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';
import { selectLanguage } from '@/store/slices/uiSlice';
import { localName } from '@/utils/localName';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import { selectChangeRequestReasonsMap } from '@/store/slices/lookupsSlice';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import TypeAndEffect from './TypeAndEffect';

function Count({ value, label }) {
  return (
    <div className="rounded-xl bg-[#f6f5f3] px-3 py-2">
      <p className="text-lg font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{value}</p>
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>{label}</p>
    </div>
  );
}

/**
 * @param {{ changeRequest: Object }} props
 */
export default function ChangeRequestOverview({ changeRequest: cr }) {
  const t = useTranslations('changeRequests.overview');
  const format = useLocaleFormat();
  const areaLabel = useLookupLabel('changeRequests.areas');
  const language = useSelector(selectLanguage);
  const reasonsMap = useSelector(selectChangeRequestReasonsMap);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      <p className="mb-2 text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{t('title')}</p>
      <div className="flex flex-wrap gap-1.5">
        {cr.summary.affectedAreas.map((area) => (
          <span key={area} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: withAlpha(STATUS.info, 0.1), color: STATUS.info }}>
            {areaLabel(area)}
          </span>
        ))}
      </div>
      <TypeAndEffect types={cr.types} otherTypeText={cr.otherTypeText} projectEffect={cr.projectEffect} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Count value={cr.summary.changedItemCount} label={t('itemsChanged')} />
        <Count value={cr.summary.changedProjectFieldCount} label={t('fieldsChanged')} />
        <Count value={cr.summary.changedCycleCount} label={t('cyclesChanged')} />
        <Count value={cr.summary.newItemCount} label={t('newItems')} />
      </div>
      <p className="text-xs" style={{ color: CHROME.textMuted }}>
        {cr.createdOn
          ? t.rich('raisedByOn', { name: cr.requestedByName ?? t('someone'), date: format.dateTime(cr.createdOn), b: (chunks) => <strong style={{ color: CHROME.textPrimary }}>{chunks}</strong> })
          : t.rich('raisedBy', { name: cr.requestedByName ?? t('someone'), b: (chunks) => <strong style={{ color: CHROME.textPrimary }}>{chunks}</strong> })}
      </p>

      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{t('reasons')}</p>
        <ul className="flex flex-col gap-2">
          {cr.reasons.map((reason) => (
            <li key={reason.key} className="rounded-lg border border-[#f1f0ee] px-3 py-2">
              <p className="text-sm font-medium" style={{ color: CHROME.textPrimary }}>{localName(reason.label, reason.labelAr, language)}</p>
              {reasonsMap[reason.key]?.justification && (
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: CHROME.textMuted }}>{reasonsMap[reason.key].justification}</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {cr.additionalDetails && (
        <div>
          <p className="mb-1 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{t('additionalDetails')}</p>
          <p className="whitespace-pre-line text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>{cr.additionalDetails}</p>
        </div>
      )}
    </div>
  );
}
