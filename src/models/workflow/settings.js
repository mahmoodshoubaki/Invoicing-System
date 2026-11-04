export function mapWorkflowSetting(raw) {
  return {
    key:         raw.key,
    value:       raw.value == null ? '' : String(raw.value),
    type:        raw.type ?? 'text',
    description: raw.description ?? null,
    isKnown:     raw.isKnown === true,
  };
}

export function mapFieldSetting(raw) {
  return {
    name:             raw.name,
    label:            raw.label ?? raw.name,
    typeKey:          raw.typeKey ?? 'text',
    isOn:             raw.isOn === true,
    isUser:           raw.isUser === true,
    filterable:       raw.filterable === true,
    fillable:         raw.fillable === true,
    cannotFillReason: raw.cannotFillReason ?? null,
    cannotBePersonReason: raw.cannotBePersonReason ?? null,
    historyWarning:   raw.historyWarning ?? null,
    isFromDatabase:   raw.isFromDatabase === true,
  };
}

export function createSaveFieldSettingsPayload(targetTypeKey, rows) {
  return {
    targetTypeKey,
    fields: (rows ?? []).map((r) => ({
      name: r.name, label: r.label, isOn: r.isOn === true, isUser: r.isUser === true, isFillable: r.fillable === true,
    })),
  };
}

export function createUpdateSettingPayload({ key, value }) {
  return { key, value: value == null ? '' : String(value) };
}

export function mapApiDomain(raw) {
  return {
    id:          raw.id,
    host:        raw.host,
    description: raw.description ?? null,
    isEnabled:   raw.isEnabled === true,
    approvedOn:  raw.approvedOn ?? null,
  };
}

export function createApproveApiDomainPayload({ host, description = '' }) {
  return { host, description };
}

export function createSetApiDomainEnabledPayload({ domainId, isEnabled }) {
  return { domainId, isEnabled };
}
