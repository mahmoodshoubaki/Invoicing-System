'use client';

/** A branch on the canvas: the steps on each side of its condition. */

import { memo } from 'react';

import StepList from '@/components/workflow/builder/StepList';

import { nested } from './shared';

export const BranchBody = memo(function BranchBody(props) {
  const { step } = props;

  return (
    <div className="flex flex-col gap-3">
      <StepList
        {...nested(props, 'whenTrue')}
        steps={step.whenTrue ?? []}
        label="Then"
        emptyText="Nothing happens when the condition holds."
      />

      <StepList
        {...nested(props, 'whenFalse')}
        steps={step.whenFalse ?? []}
        label="Otherwise"
        emptyText="Nothing happens when it does not."
      />
    </div>
  );
});
