'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { decodeRouteParam } from '@/lib/routeParam';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  Banknote, CheckCircle, ChevronLeft, Edit2, Eye, FileDiff, History, LayoutList, Plus, Trash2, X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import SubPageHeader from '@/components/common/SubPageHeader';
import TabToolbar from '@/components/projects/TabToolbar';
import Button from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import Table from '@/components/common/Table';
import { ConfirmModal } from '@/components/common/Modal';
import BOQItemHistoryModal from '@/components/boq/BOQItemHistoryModal';
import BoqFilesPanel from '@/components/boq/BoqFilesPanel';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { CHROME, SERIES_ROLE, STATUS } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useLookupLabel } from '@/hooks/useLookupLabel';
import { waitingOnText } from '@/lib/waitingOn';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants/routes';
import {
  bulkRemoveBOQItems, fetchBOQByProjectCode, removeBOQItem,
  selectBOQItems, selectBOQLoading, selectCurrentBOQ,
} from '@/store/slices/boqSlice';
import {
  fetchMainProjectDetails, fetchSubProjectsSummary, selectMainProjectDetails, selectMainDetailsLoading, selectSubProjects,
} from '@/store/slices/projectsSlice';
import { hasMainProject } from '@/lib/changeRequest/projectDraft';
import {
  selectBillingFrequenciesMap, selectBoqItemStatusesMap, selectBoqItemStatusColorsMap,
} from '@/store/slices/lookupsSlice';
import { useToast } from '@/hooks/useToast';

const ltr = (chunks) => <span dir="ltr">{chunks}</span>;

export default function ProjectBOQPage() {
  const t = useTranslations('boq');
  const tn = useTranslations('nav');
  const th = useTranslations('projects');
  const tp = useTranslations('workflowProgress');
  const tf = useTranslations('files');
  const locale = useLocale();
  const format = useLocaleFormat();
  const frequencyLabel = useLookupLabel('billingFrequency');
  const { id: rawId } = useParams();
  const projectCode = decodeRouteParam(rawId);
  const encoded = encodeURIComponent(projectCode);
  const { can } = usePermission();
  const toast = useToast();

  const dispatch = useDispatch();
  const project = useSelector(selectMainProjectDetails);
  const subProjects = useSelector(selectSubProjects);
  const projectLoading = useSelector(selectMainDetailsLoading);
  const currentBOQ = useSelector(selectCurrentBOQ);
  const boqItems = useSelector(selectBOQItems);
  const boqLoading = useSelector(selectBOQLoading);
  const currency = useSelector((s) => s.ui.currency);
  const billingFrequenciesMap = useSelector(selectBillingFrequenciesMap);
  const boqStatusesMap = useSelector(selectBoqItemStatusesMap);
  const boqStatusColorsMap = useSelector(selectBoqItemStatusColorsMap);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);

  const canCreate = can('Boqs', 'Create');
  const canUpdate = can('Boqs', 'Update');
  const canEditItem = can('System', 'Administrator');
  const canDelete = can('Boqs', 'Delete');
  const money = (v) => formatCurrency(v, currency);

  useEffect(() => {
    dispatch(fetchMainProjectDetails(projectCode));
    dispatch(fetchSubProjectsSummary(projectCode));
    dispatch(fetchBOQByProjectCode(projectCode));
  }, [dispatch, projectCode]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(selected.size === boqItems.length ? new Set() : new Set(boqItems.map((i) => i.id)));
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      await dispatch(removeBOQItem({ id: deletingId, boqId: currentBOQ?.id })).unwrap();
      setDeleteModal(false);
      setDeletingId(null);
      toast.success(t('toasts.deleted'), t('toasts.deletedBody'));
    } catch (err) {
      toast.error(t('toasts.deleteFailed'), err ?? tf('pleaseTryAgain'));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    setSaving(true);
    try {
      const count = selected.size;
      await dispatch(bulkRemoveBOQItems({ ids: Array.from(selected), boqId: currentBOQ?.id })).unwrap();
      setSelected(new Set());
      setBulkDeleteModal(false);
      toast.success(t('toasts.manyDeleted'), t('toasts.manyDeletedBody', { count }));
    } catch (err) {
      toast.error(t('toasts.manyFailed'), err ?? tf('pleaseTryAgain'));
    } finally {
      setSaving(false);
    }
  };

  const totalCost = boqItems.reduce((s, i) => s + (i.totalCost || 0), 0);

  const stats = useMemo(() => [
    { label: t('stats.items'), value: boqItems.length, icon: LayoutList, accent: SERIES_ROLE.wip },
    { label: t('stats.totalValue'), value: money(totalCost), icon: Banknote, accent: SERIES_ROLE.revenue },
    {
      label: t('stats.selected'),
      value: t('fraction', { done: selected.size, total: boqItems.length }),
      icon: CheckCircle,
      accent: selected.size > 0 ? STATUS.good : STATUS.neutral,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [boqItems.length, totalCost, selected.size, currency, t]);

  const breadcrumbs = useMemo(() => [
    { label: th('home'), href: '/' },
    { label: tn('projects'), href: '/projects' },
    { label: project?.contractName ?? projectCode, href: `/projects/${encoded}` },
    { label: t('breadcrumb') },
  ], [project?.contractName, projectCode, encoded, t, th, tn]);

  const columns = useMemo(() => [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selected.size === boqItems.length && boqItems.length > 0}
          onChange={toggleSelectAll}
          onClick={(e) => e.stopPropagation()}
          className="accent-[#f8485e]"
          aria-label={t('selectAll')}
        />
      ),
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="accent-[#f8485e]"
          aria-label={t('selectOne', { name: row.englishName })}
        />
      ),
    },
    {
      key: 'englishName',
      label: t('columns.item'),
      render: (val, row) => (
        <div className="min-w-0 max-w-xs">
          <Link
            href={ROUTES.PROJECT_BOQ_ITEM(encoded, row.id)}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold leading-tight underline-offset-2 hover:underline"
            style={{ color: CHROME.textPrimary }}
          >
            {val}
          </Link>
          {row.arabicName && (
            <p className="mt-0.5 truncate text-xs" dir="rtl" style={{ color: CHROME.textMuted }}>{row.arabicName}</p>
          )}
          {row.notes && (
            <p className="mt-0.5 truncate text-xs" style={{ color: CHROME.textMuted }}>{row.notes}</p>
          )}
        </div>
      ),
    },
    { key: 'quantity', label: t('columns.qty'), align: 'center' },
    {
      key: 'unitCost',
      label: t('columns.unitCost'),
      align: 'right',
      render: (val) => <span className="text-sm tabular-nums">{money(val)}</span>,
    },
    {
      key: 'totalCost',
      label: t('columns.totalCost'),
      align: 'right',
      render: (val) => (
        <span className="text-sm font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>{money(val)}</span>
      ),
    },
    {
      key: 'statusId',
      label: t('columns.status'),
      sortable: false,
      render: (val, row) => {
        const waiting = waitingOnText(row.waitingOn, tp, locale);
        return (
          <div className="flex min-w-0 flex-col items-start gap-1">
            <StatusBadge status={boqStatusesMap[val] ?? String(val)} colors={boqStatusColorsMap[val]} />
            {waiting && (
              <span className="max-w-[14rem] truncate text-[11px]" style={{ color: CHROME.textMuted }} title={tp('waitingOnValue', { names: waiting })}>
                {tp('waitingOn')} <bdi>{waiting}</bdi>
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'expectedInvoicingDate',
      label: t('columns.expectedDate'),
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{format.date(val) || '—'}</span>
      ),
    },
    {
      key: 'billingFrequencyId',
      label: t('columns.billing'),
      render: (val) => (
        <span className="text-sm" style={{ color: CHROME.textSecondary }}>{frequencyLabel(billingFrequenciesMap[val]) ?? '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      resizable: false,
      render: (_, row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Link href={ROUTES.PROJECT_BOQ_ITEM(encoded, row.id)}>
            <Button variant="ghost" size="xs" icon={Eye} title={t('actions.view')} />
          </Link>
          <Button variant="ghost" size="xs" icon={History} onClick={() => setHistoryItemId(row.id)} title={t('actions.history')} />
          {canEditItem && (
            <Link href={`/projects/${encoded}/boq/${row.id}/edit`}>
              <Button variant="ghost" size="xs" icon={Edit2} title={t('actions.edit')} />
            </Link>
          )}
          {canDelete && (
            <Button
              variant="ghost" size="xs" icon={Trash2}
              className="text-red-500 hover:bg-red-50"
              onClick={() => { setDeletingId(row.id); setDeleteModal(true); }}
              title={t('actions.delete')}
            />
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [selected, boqItems.length, currency, boqStatusesMap, boqStatusColorsMap, billingFrequenciesMap, canEditItem, canDelete, encoded, t, tp, locale, format, frequencyLabel]);

  if (projectLoading || boqLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <p style={{ color: CHROME.textMuted }}>{t('projectNotFound')}</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">{t('backToProjects')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div>
        <ConfirmModal
          open={deleteModal}
          onClose={() => { setDeleteModal(false); setDeletingId(null); }}
          onConfirm={handleDelete}
          title={t('deleteOne.title')}
          message={t('deleteOne.message')}
          confirmLabel={t('deleteOne.confirm')}
          loading={saving}
        />

        <ConfirmModal
          open={bulkDeleteModal}
          onClose={() => setBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          title={t('deleteMany.title')}
          message={t('deleteMany.message', { count: selected.size })}
          confirmLabel={t('deleteMany.confirm', { count: selected.size })}
          loading={saving}
        />

        <BOQItemHistoryModal
          open={historyItemId != null}
          onClose={() => setHistoryItemId(null)}
          boqItemId={historyItemId}
        />

        <SubPageHeader
          eyebrow={t('eyebrow')}
          title={project.contractName ?? projectCode}
          subtitle={t.rich('projectCode', { value: projectCode, code: ltr })}
          icon={LayoutList}
          breadcrumbs={breadcrumbs}
          actions={
            <>
              <Link href={`/projects/${encoded}`}>
                <Button variant="ghost" icon={ChevronLeft} iconClassName="rtl:-scale-x-100" size="sm">{t('actions.back')}</Button>
              </Link>
              {can('ChangeRequests', 'Create') && hasMainProject(subProjects) && (
                <Link href={ROUTES.PROJECT_CHANGE_REQUEST_NEW(encoded)}>
                  <Button variant="outline" icon={FileDiff} size="sm">{t('actions.newChangeRequest')}</Button>
                </Link>
              )}
              {canCreate && (
                <Link href={`/projects/${encoded}/boq/new`}>
                  <Button icon={Plus} size="sm">{t('actions.addItem')}</Button>
                </Link>
              )}
            </>
          }
        />

        <TabToolbar stats={stats} />

        {/* Bulk action bar — slides in only when a selection exists */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#f8485e]/25 bg-[#f8485e]/6 px-4 py-3">
                <span className="text-sm font-semibold text-[#d9304a]">
                  {t('selectedCount', { count: selected.size })}
                </span>
                <div className="ms-auto flex items-center gap-2">
                  {canDelete && (
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => setBulkDeleteModal(true)}>
                      {t('actions.deleteSelected')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={X} onClick={() => setSelected(new Set())}>
                    {t('actions.clear')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Table
          columns={columns}
          data={boqItems}
          rowKey="id"
          isLoading={boqLoading}
          emptyMessage={t('pageEmpty')}
          sortable
        />

        {currentBOQ?.id && (
          <BoqFilesPanel
            boq={currentBOQ}
            canUpdate={canUpdate}
            onChanged={() => dispatch(fetchBOQByProjectCode(projectCode))}
          />
        )}
      </div>
    </MotionConfig>
  );
}
