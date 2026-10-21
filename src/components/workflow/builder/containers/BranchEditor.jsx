'use client';

/** A branch's condition — edited in the side panel. Its two arms stay on the canvas (BranchBody). */

import { memo } from 'react';

import ConditionBuilder from '@/components/workflow/builder/conditions/ConditionBuilder';
import { createFilterGroup } from '@/models/workflow';

import { Label } from './shared';

/** An if, inside a stage. */
export const BranchEditor = memo(function BranchEditor({ step, fields, onChange }) {
  return (
    <div>
      <Label>When</Label>
      <ConditionBuilder
        value={step.condition ?? createFilterGroup()}
        onChange={(condition) => onChange({ condition })}
        fields={fields}
      />
    </div>
  );
});
