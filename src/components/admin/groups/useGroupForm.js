'use client';

import { useState } from 'react';

import { identityRepository } from '@/repositories/identityRepository';
import { groupFormErrors, groupFormProblems } from '@/lib/groupForm';

const EMPTY = [];

/**
 * @param {Object|null} group
 * @param {(result: { gone?: boolean }) => void} onSaved
 */
export function useGroupForm(group, onSaved) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [memberIds, setMemberIds] = useState(group?.members.map((m) => m.userId) ?? EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [known] = useState(() => Object.fromEntries(
    (group?.members ?? []).map((m) => [m.userId, { id: m.userId, displayName: m.displayName }])
  ));

  const changeName = (text) => {
    setName(text);
    setErrors((prev) => (prev.name ? { ...prev, name: undefined } : prev));
  };

  const save = async () => {
    const problems = groupFormProblems({ name });
    setErrors(problems);
    if (problems.name) return;
    setSaving(true);
    try {
      const body = { name, description, memberUserIds: memberIds };
      if (group) await identityRepository.updateGroup({ groupId: group.id, ...body });
      else await identityRepository.createGroup(body);
      onSaved({});
    } catch (err) {
      const found = groupFormErrors(err);
      if (found.gone) onSaved({ gone: true });
      else setErrors(found);
    } finally {
      setSaving(false);
    }
  };

  return {
    name, setName: changeName, description, setDescription, memberIds, setMemberIds,
    known, errors, saving, save,
  };
}
