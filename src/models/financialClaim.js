/**
 * @param {object} raw
 * @returns {object}
 */
export function createFinancialClaim(raw) {
  return {
    referenceNumber:         raw.referenceNumber ?? null,
    contractReferenceNumber: raw.contractReferenceNumber ?? null,
    contractName:            raw.contractName ?? null,
    dateView:                raw.dateView ?? null,
    statusId:                raw.statusId ?? null,
    status:                  raw.status ?? null,
    agencyName:              raw.agencyName ?? null,
    amountInRiyal:           raw.amountInRiyal ?? null,
    amountInDollars:           raw.amountInDollars ?? null,
  };
}

/**
 * @param {object} raw
 * @returns {object}
 */
export function createFinancialClaimAction(raw) {
  return {
    contractReferenceNumber: raw.contractReferenceNumber ?? null,
    rowNumber:  raw.rowNumber ?? null,
    process:    raw.process ?? null,
    stage:      raw.stage ?? null,
    action:     raw.action ?? null,
    actionDate: raw.actionDate ?? null,
    notes:      raw.notes ?? null,
  };
}

/**
 * @param {object|null} raw
 * @returns {{ isEtimadContract: boolean, contractNumber: number|null, claims: object[] }}
 */
export function createProjectFinancialClaims(raw) {
  return {
    isEtimadContract: raw?.isEtimadContract ?? false,
    contractNumber: raw?.contractNumber ?? null,
    claims:         (raw?.claims ?? []).map(createFinancialClaim),
  };
}

/**
 * @param {object|null} raw
 * @returns {{ isEtimadContract: boolean, financialClaimReference: number|null, claim: object|null }}
 */
export function createInvoiceFinancialClaim(raw) {
  return {
    isEtimadContract:        raw?.isEtimadContract ?? false,
    financialClaimReference: raw?.financialClaimReference ?? null,
    claim:                   raw?.claim ? createFinancialClaim(raw.claim) : null,
  };
}

/**
 * @param {object|null} raw
 * @returns {object[]}
 */
export function createFinancialClaimHistory(raw) {
  return (raw?.history ?? []).map(createFinancialClaimAction);
}

/**
 * @param {object} raw
 * @returns {{ key: number, nameEn: string|null, nameAr: string|null }}
 */
export function createClaimStage(raw) {
  return {
    key: raw.key,
    nameEn: raw.valueEN ?? null,
    nameAr: raw.valueAR ?? null,
  };
}

/**
 * @param {object} raw
 * @returns {object}
 */
export function createClaimLogEntry(raw) {
  return {
    id:            raw.id,
    rowNumber:     raw.rowNumber ?? null,
    stageKey:      raw.stageKey ?? null,
    stageNameEn:   raw.stageNameEN ?? null,
    stageNameAr:   raw.stageNameAR ?? null,
    actionDate:    raw.actionDate ?? null,
    notes:         raw.notes ?? null,
    addedByName:   raw.addedByName ?? null,
    addedOn:       raw.addedOn ?? null,
    updatedByName: raw.updatedByName ?? null,
    updatedOn:     raw.updatedOn ?? null,
  };
}

/**
 * @param {object|null} raw
 * @returns {object[]}
 */
export function createClaimLog(raw) {
  return (raw?.claimActions ?? []).map(createClaimLogEntry);
}

/**
 * @param {{ stageKey: string, actionDate: string, notes: string }} values
 * @returns {{ stageKey: number, actionDate: string|null, notes: string|null }}
 */
export function createClaimActionBody({ stageKey, actionDate, notes }) {
  const text = String(notes ?? '').trim();
  return {
    stageKey: Number(stageKey),
    actionDate: actionDate ? String(actionDate).slice(0, 10) : null,
    notes: text || null,
  };
}
