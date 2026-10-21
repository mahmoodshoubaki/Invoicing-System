'use client';

/** A repeat on the canvas: the steps it repeats. */

import { memo } from 'react';

import StepList from '@/components/workflow/builder/StepList';

import { nested } from './shared';

export const RepeatBody = memo(function RepeatBody(props) {
  const { step } = props;

  return (
    <StepList
      {...nested(props, 'body')}
      steps={step.body ?? []}
      label="Each pass"
      emptyText="No steps — the loop would do nothing."
    />
  );
});
