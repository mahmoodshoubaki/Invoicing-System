import { createApiClient } from '@/lib/apiClient';
import { withBasePath } from '@/constants/appConfig';
import { ROUTES } from '@/constants/routes';
import { uploadWithProgress } from '@/lib/uploadWithProgress';
import { checkFormData, importFormData, mapMigrationResult } from '@/lib/dataMigration';

const api = createApiClient('/api/DataMigration');
const IMPORT_URL = withBasePath(`${ROUTES.BACKEND_PROXY}/api/DataMigration/ImportHistoricalData`);

export const dataMigrationRepository = {
  async checkHistoricalData(workbook, included) {
    return mapMigrationResult(await api.post('/CheckHistoricalData', checkFormData(workbook, included)));
  },

  async importHistoricalData(workbook, included, { onProgress, signal } = {}) {
    return mapMigrationResult(await uploadWithProgress(IMPORT_URL, importFormData(workbook, included), { onProgress, signal }));
  },
};
