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
 * @typedef {Object} ProjectListItem
 * @property {string|null} projectName       - Display name (from EPM system)
 * @property {string|null} projectNameFocus  - Name in Focus system
 * @property {string|null} contractName
 * @property {number|null} contractNumber
 * @property {string|null} clientName
 * @property {string|null} projectCode
 * @property {string|null} poNumber
 * @property {string|null} invoicingPlatform
 * @property {string|null} status
 * @property {string|null} contractStartDate
 * @property {string|null} contractFinishDate
 * @property {string|null} contractSignatureDate
 * @property {string|null} siteReceiptDate
 * @property {number|null} contractDuration
 */

/**
 * Maps a raw `GetProjectsList` entry — which nests every field under
 * `projectInformation` and carries no id — to a ProjectListItem.
 *
 * @param {Object} raw
 * @returns {ProjectListItem}
 */
export function mapProjectListItem(raw) {
  const info = raw.projectInformation ?? {};
  return {
    // The EPM project's id (2026-10-19) — what a change request names when it
    // changes a sub-project's value or contract dates.
    projectUID:            info.projectUID        ?? null,
    projectName:           info.projectName_EPM   ?? null,
    projectNameFocus:      info.projectName_Focus ?? null,
    contractName:          info.contractName      ?? null,
    contractNumber:        info.contractNumber    ?? null,
    clientName:            info.clientName        ?? null,
    projectCode:           info.projectCode       ?? null,
    poNumber:              info.poNumber != null ? String(info.poNumber) : null,
    invoicingPlatform:     info.invoicingPlatform ?? null,
    status:                info.projectStatus     ?? null,
    contractStartDate:     info.contractStartDate     ?? null,
    contractFinishDate:    info.contractFinishDate    ?? null,
    contractSignatureDate: info.contractSignatureDate ?? null,
    siteReceiptDate:       info.siteReceiptDate       ?? null,
    contractDuration:      info.contractDuration      ?? null,
  };
}

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

/**
 * Maps a raw `GetMainProjectDetails` response. Currently only carries
 * ContractName — expand as the backend adds more fields.
 *
 * @param {Object} raw
 * @returns {{ contractName: string|null }}
 */
export function mapMainProjectDetails(raw) {
  return {
    contractName: raw.contractName ?? null,
  };
}

/**
 * @typedef {Object} SubProjectSummary
 * @property {string|null} projectName
 * @property {string|null} projectNameFocus
 * @property {string|null} contractName
 * @property {number|null} contractNumber
 * @property {string|null} clientName
 * @property {string|null} projectCode
 * @property {string|null} poNumber
 * @property {string|null} invoicingPlatform
 * @property {string|null} status
 * @property {string|null} contractStartDate
 * @property {string|null} contractFinishDate
 * @property {string|null} contractSignatureDate
 * @property {string|null} siteReceiptDate
 * @property {number|null} contractDuration
 * @property {number} projectValue
 * @property {number} totalRevenue
 * @property {number} revenuePS
 * @property {number} revenueLogistics
 * @property {number} revenueExternalSubs
 * @property {number} revenueTraining
 * @property {number} revenueSWLicenses
 * @property {number} wip
 * @property {number} vatPercentage
 * @property {number} vatValue
 * @property {number} collectedValue
 * @property {number} nonCollectedValue
 * @property {number} totalInvoicesValue
 */

/**
 * Maps a raw `GetSubProjectsSummary` entry — projectInformation is the same
 * shape as GetProjectsList, plus a financialSummary block.
 *
 * @param {Object} raw
 * @returns {SubProjectSummary}
 */
export function mapSubProjectSummary(raw) {
  const fin = raw.financialSummary ?? {};
  return {
    ...mapProjectListItem(raw),
    projectValue:        fin.projectValue                          ?? 0,
    totalRevenue:         fin.projectTotalRevenue                   ?? 0,
    revenuePS:             fin.projectRevenue_PS                     ?? 0,
    revenueLogistics:      fin.projectRevenue_Logistics              ?? 0,
    revenueExternalSubs:   fin.projectRevenue_ExternalSubContractors ?? 0,
    revenueTraining:       fin.projectRevenue_Training                ?? 0,
    revenueSWLicenses:     fin.projectRevenue_SWLicenses              ?? 0,
    wip:                   fin.projectWIP                             ?? 0,
    vatPercentage:         fin.projectVATPercentage                   ?? 0,
    vatValue:              fin.projectVATValue                        ?? 0,
    collectedValue:        fin.invoicesCollectedValue                 ?? 0,
    nonCollectedValue:     fin.invoicesNonCollectedValue               ?? 0,
    totalInvoicesValue:    fin.totalInvoicesValue                     ?? 0,
  };
  // contractStartDate/contractFinishDate/contractSignatureDate/
  // siteReceiptDate/contractDuration already flow through from
  // mapProjectListItem's spread above — every sub-project under the same
  // main project shares the same contract dates, so any one is a valid
  // source for the invoicing tracker's min/max bounds.
}

const ZERO_SUB_PROJECT_TOTALS = {
  projectValue: 0,
  totalRevenue: 0,
  revenuePS: 0,
  revenueLogistics: 0,
  revenueExternalSubs: 0,
  revenueTraining: 0,
  revenueSWLicenses: 0,
  wip: 0,
  vatValue: 0,
  collectedValue: 0,
  nonCollectedValue: 0,
  totalInvoicesValue: 0,
};

/**
 * Sums the financial fields of a list of SubProjectSummary items — used to
 * derive the project detail page's header KPIs. vatPercentage is a rate, not
 * a summable amount, so it's intentionally left out.
 *
 * @param {SubProjectSummary[]} subProjects
 */
export function aggregateSubProjectFinancials(subProjects) {
  return subProjects.reduce((totals, sp) => ({
    projectValue:        totals.projectValue        + sp.projectValue,
    totalRevenue:         totals.totalRevenue         + sp.totalRevenue,
    revenuePS:             totals.revenuePS             + sp.revenuePS,
    revenueLogistics:      totals.revenueLogistics      + sp.revenueLogistics,
    revenueExternalSubs:   totals.revenueExternalSubs   + sp.revenueExternalSubs,
    revenueTraining:       totals.revenueTraining       + sp.revenueTraining,
    revenueSWLicenses:     totals.revenueSWLicenses     + sp.revenueSWLicenses,
    wip:                   totals.wip                   + sp.wip,
    vatValue:              totals.vatValue              + sp.vatValue,
    collectedValue:        totals.collectedValue        + sp.collectedValue,
    nonCollectedValue:     totals.nonCollectedValue     + sp.nonCollectedValue,
    totalInvoicesValue:    totals.totalInvoicesValue    + sp.totalInvoicesValue,
  }), { ...ZERO_SUB_PROJECT_TOTALS });
}
