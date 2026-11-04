'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { useToast } from '@/hooks/useToast';
import { duplicatePayload } from '@/lib/workflowDuplicate';
import { workflowRepository } from '@/repositories/workflowRepository';

export function useDuplicateWorkflow() {
  const router = useRouter();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const open = useCallback((workflow, version = null) => {
    setError(null);
    setTarget({ workflow, version });
  }, []);

  const close = useCallback(() => {
    if (!busy) setTarget(null);
  }, [busy]);

  const confirm = useCallback(async (name) => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const definition = await workflowRepository.getDefinition({ code: target.workflow.code, version: target.version });
      const saved = await workflowRepository.saveDefinition(duplicatePayload(definition, name));
      toast.success('Workflow copied', `${name.trim()} is a draft until it is published.`);
      setTarget(null);
      router.push(`${ROUTES.WORKFLOW_BUILDER}?code=${encodeURIComponent(saved.code)}`);
    } catch (err) {
      setError(err?.message || 'The workflow could not be copied.');
    } finally {
      setBusy(false);
    }
  }, [router, target, toast]);

  return { target, busy, error, open, close, confirm };
}
