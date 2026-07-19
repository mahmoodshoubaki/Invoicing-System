/**
 * @typedef {Object} Project
 *
 * — Identity —
 * @property {string}      id
 * @property {string|null} projectName          - Display name (from EPM system)
 * @property {string|null} projectName_Focus    - Name in Focus system
 * @property {string|null} contractName
 * @property {string|null} clientName
 * @property {string|null} projectCode
 * @property {number|null} contractNumber
 * @property {string|null} poNumber
 * @property {string|null} invoicingPlatform
 *
 * — Classification —
 * @property {string|null} businessUnit
 * @property {string|null} status               - e.g. "In Progress", "Completed"
 *
 * — People —
 * @property {string|null} drm                  - Delivery / Project Manager
 * @property {string|null} crp                  - Client Relationship Partner
 * @property {string|null} buHead               - Business Unit Head
 * @property {string|null} bdm                  - Business Development Manager
 *
 * — Financials —
 * @property {number} projectValue
 * @property {number} vatPercentage
 * @property {number} vatValue
 * @property {number} totalRevenue
 * @property {number} revenuePS                 - Revenue: Professional Services
 * @property {number} revenueLogistics          - Revenue: Logistics
 * @property {number} revenueExternalSubs       - Revenue: External Sub-Contractors
 * @property {number} revenueTraining           - Revenue: Training
 * @property {number} revenueSWLicenses         - Revenue: SW Licenses
 * @property {number} wip                       - Work In Progress
 * @property {number} collectedValue
 * @property {number} nonCollectedValue
 * @property {number} totalInvoicesValue
 *
 * — Timeline —
 * @property {string|null} startDate            - Actual start date (ISO string)
 * @property {string|null} endDate              - (ISO string)
 * @property {number}      duration             - Duration in months
 * @property {string|null} poDate               - (ISO string)
 * @property {string|null} contractSignatureDate - (ISO string)
 * @property {string|null} siteReceiptDate     - (ISO string)
 */

/**
 * Maps a raw API response to a Project model.
 * All numeric fields default to 0 and all nullable strings default to null
 * so consumers never need to guard against undefined.
 *
 * @param {Object} raw - Raw response from the projects API
 * @returns {Project}
 */
export function createProject(raw) {
  return {
    // Identity
    id:                    raw.projectUID,
    projectName:           raw.projectName_EPM    ?? null,
    projectName_Focus:     raw.projectName_Focus  ?? null,
    contractName:          raw.contractName       ?? null,
    clientName:            raw.clientName         ?? null,
    projectCode:           raw.projectCode        ?? null,
    contractNumber:        raw.contractNumber     ?? null,
    poNumber:              raw.poNumber != null ? String(raw.poNumber) : null,
    invoicingPlatform:     raw.invoicingPlatform  ?? null,

    // Classification
    businessUnit:          raw.businessUnit       ?? null,
    status:                raw.projectStatus      ?? null,

    // People
    drm:                   raw.drm    ?? null,
    crp:                   raw.crp    ?? null,
    buHead:                raw.buHead ?? null,
    bdm:                   raw.bdm    ?? null,

    // Financials
    projectValue:          raw.projectValue                          ?? 0,
    vatPercentage:         raw.projectVATPercentage                  ?? 0,
    vatValue:              raw.projectVATValue                       ?? 0,
    totalRevenue:          raw.projectTotalRevenue                   ?? 0,
    revenuePS:             raw.projectRevenue_PS                     ?? 0,
    revenueLogistics:      raw.projectRevenueL_Logistics             ?? 0,
    revenueExternalSubs:   raw.projectRevenue_ExternalSubContractors ?? 0,
    revenueTraining:       raw.projectRevenue_Training               ?? 0,
    revenueSWLicenses:     raw.projectRevenue_SWLicenses             ?? 0,
    wip:                   raw.projectWIP                            ?? 0,
    collectedValue:        raw.invoicesCollectedValue                ?? 0,
    nonCollectedValue:     raw.invoicesNonCollectedValue             ?? 0,
    totalInvoicesValue:    raw.totalInvoicesValue                    ?? 0,

    // Timeline
    startDate:             raw.actualStartDate       ?? null,
    endDate:               raw.endDate               ?? null,
    duration:              raw.duration              ?? 0,
    poDate:                raw.poDate                ?? null,
    contractSignatureDate: raw.contractSignatureDate ?? null,
    siteReceiptDate:      raw.siteReceiptDate      ?? null,
  };
}
