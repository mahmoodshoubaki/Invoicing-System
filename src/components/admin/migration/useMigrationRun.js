'use client';

import { useCallback, useRef, useState } from 'react';

import { dataMigrationRepository } from '@/repositories/dataMigrationRepository';
import { identityRepository } from '@/repositories/identityRepository';

const IDLE = { status: 'idle', result: null, error: null, signature: null };

/**
 * Checking and importing one folder pick. A check counts only for the pick it
 * was run on; the import is allowed after a clean check of the same pick.
 *
 * @param {ReturnType<import('./useMigrationFolder').useMigrationFolder>} folder
 */
export function useMigrationRun(folder) {
  const [check, setCheck] = useState(IDLE);
  const [upload, setUpload] = useState({ ...IDLE, progress: null });
  const abortRef = useRef(null);

  const checkIsCurrent = check.signature !== null && check.signature === folder.signature;
  const canCheck = Boolean(folder.workbook) && check.status !== 'running' && upload.status !== 'running';
  const canImport = checkIsCurrent && check.status === 'done' && check.result.problems.length === 0
    && !folder.tooBig && upload.status !== 'running';

  const runCheck = useCallback(async () => {
    const { workbook, included, signature } = folder;
    if (!workbook) return;
    setCheck({ status: 'running', result: null, error: null, signature });
    setUpload({ ...IDLE, progress: null });
    try {
      setCheck({ status: 'done', result: await dataMigrationRepository.checkHistoricalData(workbook, included), error: null, signature });
    } catch (error) {
      setCheck({ status: 'error', result: null, error, signature });
    }
  }, [folder]);

  const runImport = useCallback(async () => {
    const { workbook, included, signature } = folder;
    if (!workbook) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setUpload({ status: 'running', result: null, error: null, signature, progress: { loaded: 0, total: folder.uploadBytes, uploaded: false } });
    try {
      // A fresh session before minutes of uploading; an expired one is renewed here.
      await identityRepository.getMe();
      const result = await dataMigrationRepository.importHistoricalData(workbook, included, {
        signal: controller.signal,
        onProgress: (progress) => setUpload((prev) => ({ ...prev, progress })),
      });
      setUpload((prev) => ({ ...prev, status: 'done', result }));
    } catch (error) {
      setUpload((prev) => ({ ...prev, status: 'error', error }));
    } finally {
      abortRef.current = null;
    }
  }, [folder]);

  const stopImport = useCallback(() => abortRef.current?.abort(), []);

  return {
    check: checkIsCurrent || check.status === 'running' ? check : IDLE,
    upload: upload.signature === folder.signature ? upload : { ...IDLE, progress: null },
    canCheck,
    canImport,
    runCheck,
    runImport,
    stopImport,
  };
}
