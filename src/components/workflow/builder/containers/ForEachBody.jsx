'use client';

import { memo, useMemo } from 'react';

import StepList from '@/components/workflow/builder/StepList';

import { insideLoop, loopItemFields } from './loopContext';
import { EMPTY_LISTS, nested } from './shared';

export const ForEachBody = memo(function ForEachBody(props) {
  const { step, ctx } = props;

  const innerCtx = useMemo(() => insideLoop(ctx, loopItemFields(step, ctx)), [ctx, step]);

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
