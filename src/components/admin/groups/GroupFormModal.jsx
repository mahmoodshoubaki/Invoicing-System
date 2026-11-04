'use client';

import { Save } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { Input, Textarea } from '@/components/forms/FormField';
import UserPicker from '@/components/workflow/builder/UserPicker';
import { STATUS } from '@/theme/vizPalette';
import { useGroupForm } from './useGroupForm';

/**
 * @param {{ group: Object|null, onClose: () => void, onSaved: (result: { gone?: boolean }) => void }} props
 */
export default function GroupFormModal({ group, onClose, onSaved }) {
  const form = useGroupForm(group, onSaved);

  return (
    <Modal
      open
      onClose={onClose}
      title={group ? `Edit ${group.name}` : 'New group'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={form.saving}>Cancel</Button>
          <Button icon={Save} loading={form.saving} onClick={form.save}>{group ? 'Save' : 'Create group'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          placeholder="Year-End Review Team"
          error={form.errors.name}
        />
        <Textarea
          label="Description"
          rows={2}
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">
            Members <span className="font-normal text-gray-400">({form.memberIds.length})</span>
          </p>
          <UserPicker selectedIds={form.memberIds} resolvedById={form.known} onChange={form.setMemberIds} />
        </div>
        {form.errors.general && <p className="text-xs" style={{ color: STATUS.critical }}>{form.errors.general}</p>}
      </div>
    </Modal>
  );
}
