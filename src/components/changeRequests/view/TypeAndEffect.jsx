'use client';

import { useTranslations } from 'next-intl';
import { useSelector } from 'react-redux';
import { selectLanguage } from '@/store/slices/uiSlice';
import { localName } from '@/utils/localName';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * @param {{ types: Array<{ key: number, label: string }>, otherTypeText: string|null, projectEffect: { label: string }|null }} props
 */
export default function TypeAndEffect({ types, otherTypeText, projectEffect }) {
  const t = useTranslations('changeRequests.typeEffect');
  const language = useSelector(selectLanguage);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{t('type')}</p>
        {types.length === 0 ? (
          <p className="text-xs" style={{ color: CHROME.textMuted }}>{t('notSet')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {types.map((type) => (
              <span key={type.key} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: withAlpha(STATUS.info, 0.1), color: STATUS.info }}>
                {localName(type.label, type.labelAr, language)}
              </span>
            ))}
          </div>
        )}
        {otherTypeText && (
          <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>{otherTypeText}</p>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{t('effect')}</p>
        <p className="text-xs" style={{ color: projectEffect ? CHROME.textPrimary : CHROME.textMuted }}>
          {projectEffect ? localName(projectEffect.label, projectEffect.labelAr, language) : t('notSet')}
        </p>
      </div>
    </div>
  );
}
