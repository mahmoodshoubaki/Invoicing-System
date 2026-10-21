/**
 * What a step can read depends on where it sits: inside a For each, the loop
 * item's fields join the catalog, and only there. The canvas and the side
 * panel both build that context from here, so a step's conditions and value
 * menus offer the same names wherever it is edited.
 */

import { STEP_TYPE } from '@/constants/workflow';
import { itemFields } from '@/lib/workflowBuilderState';

const NO_LISTS = [];

/** A For each's item, as condition fields — from GetFields for the list it walks. */
export function loopItemFields(step, ctx) {
  return itemFields(step, ctx.lists ?? NO_LISTS, ctx.fieldsByTargetType ?? {});
}

/** The context inside a loop's body. Unchanged — same identity — when the item carries nothing. */
export function insideLoop(ctx, bound) {
  return bound.length === 0 ? ctx : { ...ctx, fields: [...(ctx.fields ?? []), ...bound] };
}

/**
 * The context a step is edited in, from the steps it sits inside, outermost
 * first. Each For each among them adds its item; the others add nothing.
 *
 * @param {Object} ctx  the workflow-level context
 * @param {Array} ancestors  the container steps around it
 */
export function contextWithin(ctx, ancestors) {
  return (ancestors ?? []).reduce(
    (inner, step) => (step.type === STEP_TYPE.FOR_EACH ? insideLoop(inner, loopItemFields(step, inner)) : inner),
    ctx
  );
}
