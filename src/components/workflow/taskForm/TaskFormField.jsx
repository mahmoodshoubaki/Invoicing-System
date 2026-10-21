'use client';

import { FILES_TYPE, INVOICING_PLAN_TYPE, LIST_TYPE } from '@/constants/workflow';
import TaskFieldInput from './TaskFieldInput';
import InvoicingPlanTaskField from './InvoicingPlanTaskField';
import TaskFilesField from './TaskFilesField';
import TaskListField from './TaskListField';

/** The types drawn across both columns of the form. */
const WIDE = new Set([INVOICING_PLAN_TYPE, FILES_TYPE, LIST_TYPE]);

/**
 * One field of a task's form, drawn for its type: a BOQ item's invoicing plan,
 * an invoice's attachments, a read-only list (its lines), or a single box.
 *
 * @param {{
 *   field: Object, form: ReturnType<import('./useTaskForm').useTaskForm>,
 *   disabled: boolean, context: Object|null, options?: Array|null,
 * }} props
 */
export default function TaskFormField({ field, form, disabled, context, options = null }) {
  const common = {
    field,
    value: form.values[field.name],
    onChange: (value) => form.setValue(field.name, value),
    error: form.fieldErrors[field.name],
    disabled,
  };

  let control;
  if (field.typeKey === INVOICING_PLAN_TYPE) {
    control = <InvoicingPlanTaskField {...common} context={context} rebuilding={form.rebuilding} rebuildError={form.rebuildError} />;
  } else if (field.typeKey === FILES_TYPE) {
    control = <TaskFilesField {...common} context={context} />;
  } else if (field.typeKey === LIST_TYPE) {
    control = <TaskListField field={field} value={common.value} />;
  } else {
    return <TaskFieldInput {...common} options={options} />;
  }
  return <div className={WIDE.has(field.typeKey) ? 'sm:col-span-2' : undefined}>{control}</div>;
}
