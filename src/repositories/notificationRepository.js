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

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
}

const list = (value) => (Array.isArray(value) ? value : []);

export const notificationRepository = {

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

  async getTemplateVersions(notificationTypeId, channelKey) {
    const data = await typesApi.get('/GetTemplateVersions', { notificationTypeId, channelKey });
    return list(data?.versions).map(mapTemplateVersion);
  },

  saveTemplate(version) {
    return typesApi.post('/SaveTemplate', version);
  },

  publishTemplate(templateId) {
    return typesApi.post('/PublishTemplate', { templateId });
  },

  unpublishTemplate(notificationTypeId, channelKey) {
    return typesApi.post('/UnpublishTemplate', { notificationTypeId, channelKey });
  },

  async previewTemplate(body) {
    const data = await typesApi.post('/PreviewTemplate', body);
    return mapPreview(data);
  },

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

  async getSettings() {
    const data = await settingsApi.get('/GetSettings');
    return list(data?.settings).map(mapSetting);
  },

  async updateSetting(key, value) {
    const data = await settingsApi.post('/UpdateSetting', { key, value: String(value) });
    return mapSetting(data);
  },

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

  async requeue({ deliveryIds = [], notificationId = null }) {
    const data = await deliveriesApi.post('/RequeueDeliveries', { deliveryIds, notificationId });
    return list(data?.requeuedDeliveryIds);
  },

  /**
   * @param {Object} body
   * @returns {Promise<{ notificationId: string|null, notificationIds: string[] }>}
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

  async getConfigChanges(filters = {}) {
    const data = await auditApi.get('/GetConfigChanges', cleanParams(filters));
    return { items: list(data?.changes).map(mapConfigChange), total: data?.total ?? 0 };
  },

  async getSendRequests(filters = {}) {
    const data = await auditApi.get('/GetSendRequests', cleanParams(filters));
    return { items: list(data?.requests).map(mapSendRequest), total: data?.total ?? 0 };
  },
};
