'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FileDiff, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import ErrorNote from '@/components/ui/ErrorNote';
import ChangeRequestStatusBadge from '@/components/changeRequests/view/ChangeRequestStatusBadge';
import { useBoqChangeRequests } from '@/components/changeRequests/useBoqChangeRequests';
import { CR_RULE_KEYS } from '@/constants/changeRequests';
import { ROUTES } from '@/constants/routes';
import {
  selectChangeRequestProjectEffectsMap, selectChangeRequestReasonsMap, selectChangeRequestTypesMap,
} from '@/store/slices/lookupsSlice';
import { CHROME } from '@/theme/vizPalette';

/**
 * @param {{ projectCode: string, boqId: string|null, canCreate: boolean }} props
 */
function ChangeRequestsTab({ projectCode, boqId, canCreate }) {
  const t = useTranslations('changeRequests.tab');
  const tr = useTranslations('changeRequests.rules');
  const format = useLocaleFormat();
  const areaLabel = useLookupLabel('changeRequests.areas');
  const router = useRouter();
  const reasonsMap = useSelector(selectChangeRequestReasonsMap);
  const typesMap = useSelector(selectChangeRequestTypesMap);
  const effectsMap = useSelector(selectChangeRequestProjectEffectsMap);
  const list = useBoqChangeRequests(boqId, true);
  const encoded = encodeURIComponent(projectCode);

  const columns = [
    { key: 'number', label: t('columns.request'), render: (number) => <span className="text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{number}</span> },
    { key: 'statusId', label: t('columns.status'), render: (statusId) => <ChangeRequestStatusBadge statusId={statusId} /> },
    {
      key: 'reasonKeys',
      label: t('columns.reasons'),
      render: (keys) => <span className="text-xs">{keys.map((k) => reasonsMap[k]?.label ?? k).join(', ') || '—'}</span>,
    },
    {
      key: 'typeKeys',
      label: t('columns.type'),
      render: (keys) => <span className="text-xs">{keys.map((k) => typesMap[k]?.label ?? k).join(', ') || '—'}</span>,
    },
    {
      key: 'projectEffectKey',
      label: t('columns.effect'),
      render: (key) => <span className="text-xs">{key != null ? effectsMap[key]?.label ?? key : '—'}</span>,
    },
    { key: 'affectedAreas', label: t('columns.changes'), render: (areas) => <span className="text-xs" style={{ color: CHROME.textMuted }}>{areas.map(areaLabel).join(', ') || '—'}</span> },
    { key: 'requestedByName', label: t('columns.raisedBy'), render: (name) => <span className="text-xs">{name ?? '—'}</span> },
    { key: 'createdOn', label: t('columns.raisedOn'), render: (on) => <span className="text-xs">{on ? format.dateTime(on) : '—'}</span> },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold" style={{ color: CHROME.textPrimary }}>{t('title')}</h3>
          <ul className="mt-1 list-disc ps-4 text-xs" style={{ color: CHROME.textMuted }}>
            {CR_RULE_KEYS.map((rule) => <li key={rule}>{tr(rule)}</li>)}
          </ul>
        </div>
        {canCreate && (
          list.open ? (
            <p className="max-w-xs text-end text-xs" style={{ color: CHROME.textMuted }}>
              {t('openNote', { number: list.open.number })}
            </p>
          ) : (
            <Link href={ROUTES.PROJECT_CHANGE_REQUEST_NEW(encoded)}>
              <Button size="sm" icon={Plus} disabled={!boqId || !list.ready}>{t('new')}</Button>
            </Link>
          )
        )}
      </div>

      {list.error ? (
        <ErrorNote error={list.error} onRetry={list.reload} />
      ) : (
        <Table
          columns={columns}
          data={list.rows}
          rowKey="id"
          isLoading={!list.ready}
          sortable={false}
          compact
          onRowClick={(row) => router.push(ROUTES.PROJECT_CHANGE_REQUEST(encoded, row.id))}
          emptyMessage={
            <span className="inline-flex flex-col items-center gap-2">
              <FileDiff size={22} className="text-gray-300" aria-hidden="true" />
              {t('empty')}
            </span>
          }
        />
      )}
    </div>
  );
}

export default memo(ChangeRequestsTab);
