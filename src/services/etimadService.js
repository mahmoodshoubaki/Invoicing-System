// REAL INTEGRATION POINT: Replace all method bodies with real Etimad API HTTP calls.
//
// Etimad API notes:
//   - Base URL: Configure via process.env.NEXT_PUBLIC_ETIMAD_API_URL
//   - Authentication: Bearer token from process.env.ETIMAD_API_KEY (server-side only)
//   - All requests should be proxied through Next.js API routes to keep credentials safe.
//   - API docs: https://etimad.sa (obtain access credentials from your MoF liaison)
//
// Example real implementation:
//   async syncInvoices(projectId) {
//     const res = await fetch(`${process.env.NEXT_PUBLIC_ETIMAD_API_URL}/invoices/sync`, {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${process.env.ETIMAD_API_KEY}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({ projectId }),
//     });
//     if (!res.ok) throw new Error(`Etimad API error: ${res.status} ${res.statusText}`);
//     return res.json();
//   }

const delay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulate Etimad reference numbers. */
function generateEtimadRef() {
  return `ETM-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 90000) + 10000
  )}`;
}

export const etimadService = {
  /**
   * Sync approved invoices for a project with the Etimad platform.
   * REAL INTEGRATION POINT: POST to Etimad sync endpoint.
   *
   * @param {string} projectId
   * @returns {Promise<{ synced: number, failed: number, references: string[] }>}
   */
  async syncInvoices(projectId) {
    await delay(1200);

    if (!projectId) throw new Error('projectId is required for Etimad sync.');

    // Mock: simulate 2 invoices synced, 0 failed
    const references = [generateEtimadRef(), generateEtimadRef()];

    return {
      synced: references.length,
      failed: 0,
      references,
      syncedAt: new Date().toISOString(),
    };
  },

  /**
   * Get the current status of an invoice on the Etimad platform.
   * REAL INTEGRATION POINT: GET /invoices/{invoiceNumber}/status
   *
   * @param {string} invoiceNumber  e.g., 'INV-2024-001'
   * @returns {Promise<{ invoiceNumber: string, etimadStatus: string, lastUpdated: string }>}
   */
  async getInvoiceStatus(invoiceNumber) {
    await delay(500);

    if (!invoiceNumber) throw new Error('invoiceNumber is required.');

    const statuses = ['Synced', 'Pending', 'Processing', 'Paid', 'Rejected'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      invoiceNumber,
      etimadStatus: randomStatus,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Retrieve full invoice details as seen by the Etimad platform.
   * REAL INTEGRATION POINT: GET /invoices/{invoiceNumber}
   *
   * @param {string} invoiceNumber
   * @returns {Promise<object>}
   */
  async getInvoiceDetails(invoiceNumber) {
    await delay(700);

    if (!invoiceNumber) throw new Error('invoiceNumber is required.');

    return {
      invoiceNumber,
      etimadReference: generateEtimadRef(),
      status: 'Synced',
      submittedToEtimad: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      approvedByMoF: null,
      paidAt: null,
      paymentReference: null,
      notes: 'Mock Etimad response — replace with real API call.',
      retrievedAt: new Date().toISOString(),
    };
  },

  /**
   * Submit an approved invoice to the Etimad platform for government processing.
   * REAL INTEGRATION POINT: POST /invoices/submit
   *
   * @param {object} invoice  The full invoice object from invoiceRepository.
   * @returns {Promise<{ success: boolean, etimadReference: string, submittedAt: string }>}
   */
  async submitToEtimad(invoice) {
    await delay(1500);

    if (!invoice?.id) throw new Error('A valid invoice object is required.');
    if (!invoice.invoiceNumber) throw new Error('Invoice must have an invoiceNumber.');

    // Mock: randomly simulate a rare submission failure for realism
    const shouldFail = Math.random() < 0.05; // 5% chance
    if (shouldFail) {
      throw new Error(
        'Etimad submission failed: connection timeout. Please retry. (Mock error)'
      );
    }

    const etimadReference = generateEtimadRef();

    return {
      success: true,
      etimadReference,
      submittedAt: new Date().toISOString(),
      message: `Invoice ${invoice.invoiceNumber} successfully submitted to Etimad. Reference: ${etimadReference}.`,
    };
  },

  /**
   * Check connectivity to the Etimad API.
   * REAL INTEGRATION POINT: GET /health or equivalent ping endpoint.
   *
   * @returns {Promise<{ connected: boolean, latencyMs: number }>}
   */
  async checkConnectivity() {
    const start = Date.now();
    await delay(300);
    return {
      connected: true,
      latencyMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  },
};
