'use client';

/** A for-each on the canvas: the steps run for each item, with the item's fields in reach. */

import { memo, useMemo } from 'react';

import StepList from '@/components/workflow/builder/StepList';

import { insideLoop, loopItemFields } from './loopContext';
import { EMPTY_LISTS, nested } from './shared';

export const ForEachBody = memo(function ForEachBody(props) {
  const { step, ctx } = props;

  // Inside the body — and only inside it — the item's fields join the catalog,
  // so the steps in it can be checked against them.
  const innerCtx = useMemo(() => insideLoop(ctx, loopItemFields(step, ctx)), [ctx, step]);

  // The list header reads as the step's sentence: "For each invoice in Overdue invoices".
  const list = (ctx.lists ?? EMPTY_LISTS).find((l) => l.name === step.source);
  const label = `For each ${step.itemName || 'item'}${list ? ` in ${list.label}` : ''}`;

  return (
    <StepList
      {...nested({ ...props, ctx: innerCtx }, 'body')}
      steps={step.body ?? []}
      label={label}
      emptyText="No steps — the loop would do nothing."
    />
  );
});
