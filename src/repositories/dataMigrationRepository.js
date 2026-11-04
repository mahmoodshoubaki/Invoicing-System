import { createApiClient } from '@/lib/apiClient';
import { uploadWithProgress } from '@/lib/uploadWithProgress';
import { checkFormData, importFormData, mapMigrationResult } from '@/lib/dataMigration';

const api = createApiClient('/api/DataMigration');
const IMPORT_URL = '/api/backend/api/DataMigration/ImportHistoricalData';

/** Historical data migration (System.Administrator). */
export const dataMigrationRepository = {
  /** Checks the workbook and the file list; saves nothing. */
  async checkHistoricalData(workbook, included) {
    return mapMigrationResult(await api.post('/CheckHistoricalData', checkFormData(workbook, included)));
  },

  /** Uploads everything and saves it in one transaction, or saves nothing. */
  async importHistoricalData(workbook, included, { onProgress, signal } = {}) {
    return mapMigrationResult(await uploadWithProgress(IMPORT_URL, importFormData(workbook, included), { onProgress, signal }));
  },
};
