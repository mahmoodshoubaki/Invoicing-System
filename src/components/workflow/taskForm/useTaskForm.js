'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import { workflowRepository } from '@/repositories/workflowRepository';
import { boqRepository } from '@/repositories/boqRepository';
import { INVOICING_PLAN_TYPE } from '@/constants/workflow';
import {
  checkBeforeSubmit, filesToSend, hasFilesField, initialValues, splitServerErrors, valuesToSend,
} from '@/lib/taskFieldValues';
import { planValueFromPreview } from '@/lib/invoicingPlanValue';
import { reasonProblem, reasonToSend } from '@/lib/taskReasons';
import { changeRequestFieldNames, changeRequestTaskParts } from '@/lib/changeRequest/taskFields';

const MANY_RECORDS = 'WF-056';

const NO_FIELDS = [];

const PLAN_ANCHORS = ['billingFrequencyId', 'expectedInvoicingDate'];

/**
 * @param {Object} task
 * @param {(result: { task: Object, button: Object, instance: Object }) => void} onCompleted
 * @param {{ boqItemId, contractStartDate, contractFinishDate, expectedInvoicingDate, billingFrequencyId }|null} [context]
 */
export function useTaskForm(task, onCompleted, context = null) {
  const fields = task?.fields ?? NO_FIELDS;
  const requestParts = useMemo(() => changeRequestTaskParts(task), [task]);
  const ownFields = useMemo(() => {
    const names = changeRequestFieldNames(requestParts);
    return names.size ? fields.filter((f) => !names.has(f.name)) : fields;
  }, [fields, requestParts]);
  const asksForRequest = ownFields.length !== fields.length;
  const [values, setValues] = useState(() => initialValues(fields));
  const [comment, setComment] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [commentError, setCommentError] = useState(null);
  const [errors, setErrors] = useState([]);
  const [pressing, setPressing] = useState(null);
  const [rebuild, setRebuild] = useState({ busy: false, error: null });
  // Only the newest rebuild lands — an older answer arriving late is dropped.
  const rebuildSeq = useRef(0);
  const requestRef = useRef(null);
  const planField = fields.find((f) => f.typeKey === INVOICING_PLAN_TYPE) ?? null;

  const rebuildPlan = useCallback(async (next) => {
    if (!planField || !context?.boqItemId) return;
    const anchorDate = next.expectedInvoicingDate || context.expectedInvoicingDate;
    const billingFrequencyId = next.billingFrequencyId || context.billingFrequencyId;
    if (!anchorDate || !billingFrequencyId || !context.contractStartDate || !context.contractFinishDate) return;

    rebuildSeq.current += 1;
    const mine = rebuildSeq.current;
    setRebuild({ busy: true, error: null });
    try {
      const preview = await boqRepository.previewInvoicingPlan({
        anchorDate: String(anchorDate).slice(0, 10),
        billingFrequencyId,
        contractStartDate: context.contractStartDate,
        contractFinishDate: context.contractFinishDate,
        boqItemId: context.boqItemId,
      });
      if (mine !== rebuildSeq.current) return;
      setValues((prev) => ({ ...prev, [planField.name]: planValueFromPreview(preview) }));
      setRebuild({ busy: false, error: null });
    } catch (err) {
      if (mine !== rebuildSeq.current) return;
      setRebuild({ busy: false, error: err?.message || 'Could not rebuild the invoicing plan.' });
    }
  }, [context, planField]);

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: typeof value === 'function' ? value(prev[name]) : value }));
    if (PLAN_ANCHORS.includes(name)) rebuildPlan({ ...values, [name]: value });
    // An edit answers that box's complaint; the others stand until the next press.
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, [rebuildPlan, values]);

  const changeComment = useCallback((text) => {
    setComment(text);
    setCommentError(null);
  }, []);

  const press = useCallback(async (button, reason = null) => {
    const checked = checkBeforeSubmit(ownFields, values, button, comment);
    setFieldErrors(checked.fieldErrors);
    setCommentError(checked.commentError);
    const reasonError = reasonProblem(button, reason ?? undefined);
    setErrors(reasonError ? [reasonError] : []);
    if (reasonError) return;
    const request = button.requiresFields && asksForRequest ? requestRef.current : null;
    if (button.requiresFields && asksForRequest && !request) {
      setErrors(['The change request above is not loaded yet — wait for it, or press Retry.']);
      return;
    }
    const requestReady = request ? request.check() : true;
    if (Object.keys(checked.fieldErrors).length > 0 || checked.commentError || !requestReady) return;
    const sent = request ? request.values() : null;

    setPressing(button.key);
    try {
      const args = {
        instanceId: task.instanceId,
        taskId: task.taskId,
        outcomeKey: button.key,
        comment: comment.trim() || null,
        values: { ...valuesToSend(ownFields, values, button), ...(sent?.values ?? {}) },
        ...reasonToSend(button, reason ?? undefined),
      };
      const instance = button.requiresFields && hasFilesField(ownFields)
        ? await workflowRepository.completeTaskWithFiles(args, filesToSend(ownFields, values, button))
        : await workflowRepository.completeTask(args);
      onCompleted?.({ task, button, instance });
    } catch (err) {
      const refusal = sent ? request.showRefusal(err?.errors, sent) : { rest: err?.errors, general: [], placed: false };
      const split = splitServerErrors(refusal.rest, ownFields);
      setFieldErrors(split.fieldErrors);
      const general = [...refusal.general, ...split.other];
      const placed = refusal.placed || Object.keys(split.fieldErrors).length > 0 || general.length > 0;
      if (!placed || err?.code === MANY_RECORDS) general.unshift(err?.message || 'Could not answer this task.');
      setErrors(general);
    } finally {
      setPressing(null);
    }
  }, [asksForRequest, comment, onCompleted, ownFields, task, values]);

  return {
    fields,
    ownFields,
    requestParts,
    asksForRequest,
    requestRef,
    values,
    setValue,
    comment,
    setComment: changeComment,
    fieldErrors,
    commentError,
    errors,
    pressing,
    press,
    rebuilding: rebuild.busy,
    rebuildError: rebuild.error,
  };
}
