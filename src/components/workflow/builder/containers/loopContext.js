import { STEP_TYPE } from '@/constants/workflow';
import { itemFields } from '@/lib/workflowBuilderState';

const NO_LISTS = [];

export function loopItemFields(step, ctx) {
  return itemFields(step, ctx.lists ?? NO_LISTS, ctx.fieldsByTargetType ?? {});
}

export function insideLoop(ctx, bound) {
  return bound.length === 0 ? ctx : { ...ctx, fields: [...(ctx.fields ?? []), ...bound] };
}

/**
 * @param {Object} ctx
 * @param {Array} ancestors
 */
export function contextWithin(ctx, ancestors) {
  return (ancestors ?? []).reduce(
    (inner, step) => (step.type === STEP_TYPE.FOR_EACH ? insideLoop(inner, loopItemFields(step, inner)) : inner),
    ctx
  );
}
