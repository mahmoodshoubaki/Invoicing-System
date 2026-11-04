export function mapGroup(raw) {
  return {
    id: raw?.id ?? null,
    name: raw?.name ?? '',
    description: raw?.description ?? '',
    members: (raw?.members ?? []).map((m) => ({
      userId: m.userId ?? null,
      displayName: m.displayName ?? '',
      isActive: m.isActive !== false,
    })),
  };
}

const memberIds = (ids) => [...new Set((ids ?? []).filter(Boolean))];

export function createGroupPayload({ name, description, memberUserIds }) {
  return {
    name: String(name ?? '').trim(),
    description: String(description ?? '').trim() || null,
    memberUserIds: memberIds(memberUserIds),
  };
}

export function updateGroupPayload({ groupId, name, description, memberUserIds }) {
  return { groupId, ...createGroupPayload({ name, description, memberUserIds }) };
}
