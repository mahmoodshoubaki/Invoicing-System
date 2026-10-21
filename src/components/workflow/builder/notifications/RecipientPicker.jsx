'use client';

import { memo } from 'react';

import { Label } from '@/components/workflow/builder/containers/shared';
import UserPicker from '@/components/workflow/builder/UserPicker';
import RoleChips from '@/components/workflow/builder/RoleChips';
import EmailListInput from '@/components/workflow/builder/EmailListInput';
import { ExpressionAssignees } from '@/components/workflow/builder/HumanTaskEditor';

/**
 * One line of a Send notification step — To or CC — picked the way a human
 * task's assignees are: roles, people, a person held by the record or a
 * variable, plus typed addresses that are not users. CC takes exactly the
 * same as To (2026-10-08); the fields only differ by their prefix.
 *
 * @param {{ line: 'to'|'cc', step: Object, ctx: Object, onChange: (patch: Object) => void }} props
 */
function RecipientPicker({ line, step, ctx, onChange }) {
  const key = (suffix) => `${line}${suffix}`;
  const set = (suffix) => (value) => onChange({ [key(suffix)]: value });
  const what = line === 'cc' ? 'copy in' : 'send to';

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label hint="— everyone in the role when the step runs">Roles</Label>
        <RoleChips
          roles={ctx.roles ?? []}
          loading={ctx.rolesLoading}
          selectedIds={step[key('RoleIds')] ?? []}
          onChange={set('RoleIds')}
        />
      </div>

      <div>
        <Label>People</Label>
        <UserPicker
          resolvedById={ctx.resolvedById}
          selectedIds={step[key('UserIds')] ?? []}
          onChange={set('UserIds')}
        />
      </div>

      <div>
        <Label hint="— decided when the step runs">A person on the record or in a variable</Label>
        <ExpressionAssignees
          expressions={step[key('Expressions')] ?? []}
          fields={ctx.fields}
          onChange={set('Expressions')}
        />
      </div>

      <div>
        <Label hint="— not users: they get the email only">Addresses</Label>
        <EmailListInput
          values={step[key('Emails')] ?? []}
          onChange={set('Emails')}
          placeholder={line === 'cc' ? 'audit@example.com or {{ClientEmail}}' : undefined}
          ariaLabel={`Email addresses to ${what}`}
        />
      </div>
    </div>
  );
}

export default memo(RecipientPicker);
