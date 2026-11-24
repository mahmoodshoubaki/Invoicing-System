'use client';

import { memo, useCallback, useState } from 'react';
import { Plus, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { ConfirmModal } from '@/components/common/Modal';
import { FINANCIAL_CLAIM_PERMISSIONS } from '@/constants/financialClaims';
import { STATUS } from '@/theme/vizPalette';
import { allow } from '@/constants/workflowPermissions';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/useToast';
import ClaimActionDialog from './ClaimActionDialog';
import ClaimLogTable from './ClaimLogTable';
import { useClaimLog } from './useClaimLog';
import { useDeleteClaimAction } from './useDeleteClaimAction';

/**
 * @param {{ invoiceId: string }} props
 */
function ManualClaimCard({ invoiceId }) {
  const t = useTranslations('claims.manual');
  const { can } = usePermission();
  const toast = useToast();
  const canAdd = allow(can, FINANCIAL_CLAIM_PERMISSIONS.ADD_ACTION);
  const canEdit = allow(can, FINANCIAL_CLAIM_PERMISSIONS.EDIT_ACTION);
  const canDelete = allow(can, FINANCIAL_CLAIM_PERMISSIONS.DELETE_ACTION);
  const { entries, loading, error, reload } = useClaimLog(invoiceId);
  const [dialog, setDialog] = useState(null);

  const openEdit = useCallback((entry) => setDialog({ entry }), []);

  const handleSaved = ({ gone, message }) => {
    setDialog(null);
    reload();
    if (gone) toast.warning(t('notFound'), message);
  };

  const removal = useDeleteClaimAction(({ warning }) => {
    reload();
    if (warning) toast.warning(t('notDeleted'), warning);
    else toast.success(t('deleted'));
  });
  const askDelete = removal.ask;

  return (
    <>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-gray-700">{t('title')}</h3>
            <span className="text-xs text-gray-400">{t('manualLog')}</span>
          </div>
          {canAdd && (
            <Button variant="outline" size="xs" icon={Plus} onClick={() => setDialog({ entry: null })}>
              {t('addEntry')}
            </Button>
          )}
        </div>

        {error ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2.5">
            <p className="text-sm text-red-700">{error.message || t('loadFailed')}</p>
            <Button variant="ghost" size="xs" icon={RotateCw} loading={loading} onClick={reload}>{t('tryAgain')}</Button>
          </div>
        ) : (
          <ClaimLogTable
            entries={entries}
            loading={loading}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={openEdit}
            onDelete={askDelete}
          />
        )}
      </Card>

      <ConfirmModal
        open={removal.entry != null}
        onClose={removal.cancel}
        onConfirm={removal.confirm}
        title={t('deleteTitle', { number: removal.entry?.rowNumber ?? '' })}
        message={(
          <>
            {t('deleteMessage')}
            {removal.error && (
              <span className="mt-2 block text-xs" style={{ color: STATUS.critical }}>{removal.error}</span>
            )}
          </>
        )}
        confirmLabel={t('delete')}
        loading={removal.deleting}
      />

      {dialog && (
        <ClaimActionDialog
          invoiceId={invoiceId}
          entry={dialog.entry}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
          onConflict={reload}
        />
      )}
    </>
  );
}

export default memo(ManualClaimCard);
