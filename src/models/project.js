/**
 * @typedef {Object} Project
 * @property {string} id
 * @property {string|null} projectName
 * @property {string|null} projectName_Focus
 * @property {string|null} contractName
 * @property {string|null} clientName
 * @property {string|null} projectCode
 * @property {number|null} contractNumber
 * @property {string|null} poNumber
 * @property {string|null} invoicingPlatform
 * @property {string|null} businessUnit
 * @property {string|null} status
 * @property {string|null} drm
 * @property {string|null} crp
 * @property {string|null} buHead
 * @property {string|null} bdm
 * @property {number} projectValue
 * @property {number} vatPercentage
 * @property {number} vatValue
 * @property {number} totalRevenue
 * @property {number} revenuePS
 * @property {number} revenueLogistics
 * @property {number} revenueExternalSubs
 * @property {number} revenueTraining
 * @property {number} revenueSWLicenses
 * @property {number} wip
 * @property {number} collectedValue
 * @property {number} nonCollectedValue
 * @property {number} totalInvoicesValue
 * @property {string|null} startDate
 * @property {string|null} endDate
 * @property {number} duration
 * @property {string|null} poDate
 * @property {string|null} contractSignatureDate
 * @property {string|null} siteReceiptDate
 */

/**
 * @typedef {Object} ProjectListItem
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
 */

/**
 * @param {Object} raw
 * @returns {ProjectListItem}
 */
export function mapProjectListItem(raw) {
  const info = raw.projectInformation ?? {};
  return {
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
    isMainProject:         info.isMainProject === true,
  };
}

/**
 * @param {Object} raw
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

const dayOf = (value) => (value ? String(value).slice(0, 10) : null);

/**
 * @param {Object} raw
 * @returns {{ projectCode: string, projectName: string|null, contractName: string|null, contractStartDate: string|null, contractFinishDate: string|null, contractDuration: number|null, projectValue: number|null, bdm: string|null, bdmUsername: string|null, buHead: string|null, buHeadUsername: string|null, crp: string|null, crpUsername: string|null, hasMainProject: boolean, }}
 */
export function mapProjectHeader(raw) {
  return {
    projectCode:        raw.projectCode ?? '',
    projectName:        raw.projectName ?? null,
    contractName:       raw.contractName ?? null,
    contractStartDate:  dayOf(raw.contractStartDate),
    contractFinishDate: dayOf(raw.contractFinishDate),
    contractDuration:   raw.contractDuration ?? null,
    projectValue:       raw.projectValue ?? null,
    bdm:                raw.bdm ?? null,
    bdmUsername:        raw.bdmUsername ?? null,
    buHead:             raw.buHead ?? null,
    buHeadUsername:     raw.buHeadUsername ?? null,
    crp:                raw.crp ?? null,
    crpUsername:        raw.crpUsername ?? null,
    hasMainProject:     raw.hasMainProject === true,
  };
}
