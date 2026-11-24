'use client';

import { useTranslations } from 'next-intl';
import Modal from '@/components/common/Modal';
import ClaimHistory from './ClaimHistory';

/**
 * @param {{ reference: number|null, onClose: () => void }} props
 */
export default function ClaimHistoryModal({ reference, onClose }) {
  const t = useTranslations('claims.history');
  return (
    <Modal open={reference != null} onClose={onClose} title={t('modalTitle', { reference: reference ?? '' })} size="full">
      {reference != null && <ClaimHistory reference={reference} />}
    </Modal>
  );
}
