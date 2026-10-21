import { createApiClient } from '@/lib/apiClient';
import {
  mapLookup,
  mapInboxNotification,
  mapType,
  mapTypeDetails,
  mapTemplateVersion,
  mapPreview,
  mapEmailSender,
  mapSetting,
  mapDeliveryRow,
  mapNotificationDetails,
  mapStatistics,
  mapConfigChange,
  mapSendRequest,
} from '@/models/notification';

const inboxApi = createApiClient('/api/NotificationInbox');
const typesApi = createApiClient('/api/NotificationTypes');
const sendersApi = createApiClient('/api/NotificationEmailSenders');
const settingsApi = createApiClient('/api/NotificationSettings');
const deliveriesApi = createApiClient('/api/NotificationDeliveries');
const auditApi = createApiClient('/api/NotificationAudit');

/**
 * Drops empty filters before they reach URLSearchParams, which would otherwise
 * send the literal strings "null" and "undefined" for the server to bind.
 */
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
}

const list = (value) => (Array.isArray(value) ? value : []);

/**
 * The Notifications module, every endpoint the front end calls.
 *
 * POSTs with nothing to say still send `{}` — the API binds a body on every
 * POST and refuses a missing one.
 */
export const notificationRepository = {
  // =========================================================================
  // The bell — any signed-in user; "me" comes from the token
  // =========================================================================

  async getMyUnseenCount() {
    const data = await inboxApi.get('/GetMyUnseenCount');
    return data?.unseenCount ?? 0;
  },

  /**
   * @param {{ isRead?: boolean|null, priorityKey?: number|null, fromDate?: string, toDate?: string, skip?: number, take?: number }} [query]
   */
  async getMyNotifications({ isRead = null, priorityKey = null, fromDate = null, toDate = null, skip = 0, take = 20 } = {}) {
    const data = await inboxApi.get('/GetMyNotifications', cleanParams({
      isRead, priorityKey, fromDate, toDate, skip, take,
    }));
    return {
      items: list(data?.notifications).map(mapInboxNotification),
      total: data?.total ?? 0,
      unreadCount: data?.unreadCount ?? 0,
    };
  },

  markAllSeen() {
    return inboxApi.post('/MarkAllNotificationsSeen', {});
  },

  markRead(deliveryId) {
    return inboxApi.post('/MarkNotificationRead', { deliveryId });
  },

  markAllRead() {
    return inboxApi.post('/MarkAllNotificationsRead', {});
  },

  // =========================================================================
  // Lookups
  // =========================================================================

  async getChannels() {
    const data = await typesApi.get('/GetChannels');
    return list(data?.channels).map(mapLookup);
  },

  async getPriorities() {
    const data = await typesApi.get('/GetPriorities');
    return list(data?.priorities).map(mapLookup);
  },

  async getLanguages() {
    const data = await typesApi.get('/GetLanguages');
    return list(data?.languages).map(mapLookup);
  },

  async getDeliveryStatuses() {
    const data = await deliveriesApi.get('/GetDeliveryStatuses');
    return list(data?.deliveryStatuses).map(mapLookup);
  },

  async getEmailProviders() {
    const data = await sendersApi.get('/GetEmailProviders');
    return list(data?.emailProviders).map(mapLookup);
  },

  async getSmtpSecurityModes() {
    const data = await sendersApi.get('/GetSmtpSecurityModes');
    return list(data?.smtpSecurityModes).map(mapLookup);
  },

  async getFaultReasons() {
    const data = await sendersApi.get('/GetFaultReasons');
    return list(data?.faultReasons).map(mapLookup);
  },

  // =========================================================================
  // Types — also what the workflow builder's type dropdowns read
  // =========================================================================

  async getTypes() {
    const data = await typesApi.get('/GetTypes');
    return list(data?.types).map(mapType);
  },

  async getTypeDetails(notificationTypeId) {
    const data = await typesApi.get('/GetTypeDetails', { notificationTypeId });
    return mapTypeDetails(data);
  },

  /** @returns {Promise<{ notificationTypeId: string, key: number }>} */
  addType(fields) {
    return typesApi.post('/AddType', fields);
  },

  updateType(notificationTypeId, fields) {
    return typesApi.post('/UpdateType', { notificationTypeId, ...fields });
  },

  setTypePaused(notificationTypeId, isPaused) {
    return typesApi.post('/SetTypePaused', { notificationTypeId, isPaused });
  },

  deleteType(notificationTypeId) {
    return typesApi.post('/DeleteType', { notificationTypeId });
  },

  // =========================================================================
  // Words — versioned per channel
  // =========================================================================

  async getTemplateVersions(notificationTypeId, channelKey) {
    const data = await typesApi.get('/GetTemplateVersions', { notificationTypeId, channelKey });
    return list(data?.versions).map(mapTemplateVersion);
  },

  /** Always a NEW version, never live. @returns {Promise<{ templateId: string, version: number }>} */
  saveTemplate(version) {
    return typesApi.post('/SaveTemplate', version);
  },

  publishTemplate(templateId) {
    return typesApi.post('/PublishTemplate', { templateId });
  },

  unpublishTemplate(notificationTypeId, channelKey) {
    return typesApi.post('/UnpublishTemplate', { notificationTypeId, channelKey });
  },

  /**
   * Fills a saved version, or the editor's unsaved text, with sample values.
   * `problems` not empty is not an error response — show them instead.
   */
  async previewTemplate(body) {
    const data = await typesApi.post('/PreviewTemplate', body);
    return mapPreview(data);
  },

  // =========================================================================
  // Email senders
  // =========================================================================

  async getEmailSenders() {
    const data = await sendersApi.get('/GetEmailSenders');
    return list(data?.emailSenders).map(mapEmailSender);
  },

  addSmtpSender(fields) {
    return sendersApi.post('/AddSmtpEmailSender', fields);
  },

  addSesSender(fields) {
    return sendersApi.post('/AddSesEmailSender', fields);
  },

  updateSmtpSender(emailSenderId, fields) {
    return sendersApi.post('/UpdateSmtpEmailSender', { emailSenderId, ...fields });
  },

  updateSesSender(emailSenderId, fields) {
    return sendersApi.post('/UpdateSesEmailSender', { emailSenderId, ...fields });
  },

  setDefaultSender(emailSenderId) {
    return sendersApi.post('/SetDefaultEmailSender', { emailSenderId });
  },

  removeDefaultSender() {
    return sendersApi.post('/RemoveDefaultEmailSender', {});
  },

  deleteSender(emailSenderId) {
    return sendersApi.post('/DeleteEmailSender', { emailSenderId });
  },

  /**
   * `sent: false` is not an error response — the caller shows `error`, and the
   * fault reason's description when `faultReasonKey` is set.
   *
   * With `templateId` the test is kept in the monitor (marked as a test) and
   * `notificationId` points at it — also when it failed. The short check email
   * (no template) is not kept: `notificationId` is null.
   */
  async sendTestEmail({ emailSenderId, toAddress, templateId = null, sampleValues = null }) {
    const data = await sendersApi.post('/SendTestEmail', { emailSenderId, toAddress, templateId, sampleValues });
    return {
      sent: data?.sent === true,
      externalId: data?.externalId ?? null,
      faultReasonKey: data?.faultReasonKey ?? null,
      error: data?.error ?? null,
      notificationId: data?.notificationId ?? null,
    };
  },

  // =========================================================================
  // Settings
  // =========================================================================

  async getSettings() {
    const data = await settingsApi.get('/GetSettings');
    return list(data?.settings).map(mapSetting);
  },

  /** Values always travel as strings. @returns the saved row */
  async updateSetting(key, value) {
    const data = await settingsApi.post('/UpdateSetting', { key, value: String(value) });
    return mapSetting(data);
  },

  // =========================================================================
  // Delivery monitor
  // =========================================================================

  async getDeliveries(filters = {}) {
    const data = await deliveriesApi.get('/GetDeliveries', cleanParams(filters));
    return {
      items: list(data?.deliveries).map(mapDeliveryRow),
      total: data?.total ?? 0,
    };
  },

  async getNotificationDetails(notificationId) {
    const data = await deliveriesApi.get('/GetNotificationDetails', { notificationId });
    return mapNotificationDetails(data);
  },

  async getStatistics({ fromDate = null, toDate = null } = {}) {
    const data = await deliveriesApi.get('/GetDeliveryStatistics', cleanParams({ fromDate, toDate }));
    return mapStatistics(data);
  },

  /**
   * Anything not in a stopped state is SKIPPED, not refused — compare the
   * answer with what was picked to say "3 of 5 sent again".
   */
  async requeue({ deliveryIds = [], notificationId = null }) {
    const data = await deliveriesApi.post('/RequeueDeliveries', { deliveryIds, notificationId });
    return list(data?.requeuedDeliveryIds);
  },

  /**
   * A new notification from an old one, text edited first — to the person it
   * was for and/or typed To / CC addresses, one copy each (2026-10-13). Refused
   * with 400, keyed by field (`ToEmails`, `CcEmails`, `Deliveries`).
   *
   * @param {Object} body  createResendPayload's
   * @returns {Promise<{ notificationId: string|null, notificationIds: string[] }>} the copies made, first first
   */
  async resend(body) {
    const data = await deliveriesApi.post('/ResendNotification', body);
    const ids = list(data?.notificationIds);
    return { notificationId: data?.notificationId ?? ids[0] ?? null, notificationIds: ids.length ? ids : [data?.notificationId].filter(Boolean) };
  },

  async archive(notificationIds) {
    const data = await deliveriesApi.post('/ArchiveNotifications', { notificationIds });
    return list(data?.archivedNotificationIds);
  },

  // =========================================================================
  // Audit
  // =========================================================================

  async getConfigChanges(filters = {}) {
    const data = await auditApi.get('/GetConfigChanges', cleanParams(filters));
    return { items: list(data?.changes).map(mapConfigChange), total: data?.total ?? 0 };
  },

  async getSendRequests(filters = {}) {
    const data = await auditApi.get('/GetSendRequests', cleanParams(filters));
    return { items: list(data?.requests).map(mapSendRequest), total: data?.total ?? 0 };
  },
};
