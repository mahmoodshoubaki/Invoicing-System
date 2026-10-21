/** Engine limits and approved API hosts: their mappers and request bodies. */

/**
 * One engine limit from GetSettings.
 *
 * `type` decides the control, NOT `key` — all eight are `positiveInteger`
 * today and a future one will not be, so a screen that switches on the key
 * would render the wrong box the day that happens.
 *
 * `description` is the label. Keeping a local copy of what each key means would
 * drift from the engine the moment a limit is reworded.
 *
 * `isKnown: false` is a row the engine no longer reads — shown, never edited.
 *
 * Values travel as strings whatever the type.
 */
export function mapWorkflowSetting(raw) {
  return {
    key:         raw.key,
    value:       raw.value == null ? '' : String(raw.value),
    type:        raw.type ?? 'text',
    description: raw.description ?? null,
    isKnown:     raw.isKnown === true,
  };
}

/**
 * One field on the Workflow fields admin page (2026-10-13): what the builder
 * shows it as, whether it shows at all, and whether a task can fill it.
 * `name` never changes — saved workflows hold it. The "a task can fill it"
 * switch is open only when `cannotFillReason` is null, and "a person" only
 * when `cannotBePersonReason` is (2026-10-13); either reason is shown beside
 * its locked switch. `historyWarning` is a warning only — filling the field is
 * still allowed, its old value is just not kept anywhere.
 */
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

/**
 * Body for SaveFieldSettings: only the rows that changed, but each with all four
 * values, because a row is replaced whole.
 */
export function createSaveFieldSettingsPayload(targetTypeKey, rows) {
  return {
    targetTypeKey,
    fields: (rows ?? []).map((r) => ({
      name: r.name, label: r.label, isOn: r.isOn === true, isUser: r.isUser === true, isFillable: r.fillable === true,
    })),
  };
}

/** Body for UpdateSetting. The value is a string whatever the declared type. */
export function createUpdateSettingPayload({ key, value }) {
  return { key, value: value == null ? '' : String(value) };
}

/** One approved host from GetApiDomains. */
export function mapApiDomain(raw) {
  return {
    id:          raw.id,
    host:        raw.host,
    description: raw.description ?? null,
    isEnabled:   raw.isEnabled === true,
    approvedOn:  raw.approvedOn ?? null,
  };
}

/**
 * Body for ApproveApiDomain.
 *
 * `host` must be a **bare host** — `api.example.com`, with no scheme, port or
 * path. Anything else is WF-032. Approving a withdrawn host re-enables it.
 */
export function createApproveApiDomainPayload({ host, description = '' }) {
  return { host, description };
}

/** Body for SetApiDomainEnabled. */
export function createSetApiDomainEnabledPayload({ domainId, isEnabled }) {
  return { domainId, isEnabled };
}
