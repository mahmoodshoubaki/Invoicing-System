/**
 * Response mappers for the Notifications module.
 *
 * The API already speaks camelCase; these exist so every screen sees the same
 * field always present (null rather than missing), and so a renamed field is
 * one edit here rather than a hunt across pages. Shapes are the backend's own
 * DTOs (`notifications-frontend-handoff.md`, checked against the source).
 */

const list = (value) => (Array.isArray(value) ? value : []);

/** The shape every lookup shares: channels, priorities, languages, statuses… */
export function mapLookup(raw) {
  return {
    key: raw.key,
    value: raw.value ?? String(raw.key),
    arabicName: raw.arabicName ?? null,
    colorHex: raw.colorHex ?? null,
    description: raw.description ?? null,
    icon: raw.icon ?? null,
    isActive: raw.isActive !== false,
  };
}

// ---------------------------------------------------------------------------
// The bell
// ---------------------------------------------------------------------------

export function mapInboxNotification(raw) {
  return {
    deliveryId: raw.deliveryId,
    notificationId: raw.notificationId ?? null,
    priorityKey: raw.priorityKey ?? null,
    subject: raw.subject ?? '',
    body: raw.body ?? '',
    englishSubject: raw.englishSubject ?? '',
    englishBody: raw.englishBody ?? '',
    arabicSubject: raw.arabicSubject ?? '',
    arabicBody: raw.arabicBody ?? '',
    isHtml: raw.isHtml === true,
    actionUrl: raw.actionUrl ?? null,
    seenAt: raw.seenAt ?? null,
    isRead: raw.isRead === true,
    readAt: raw.readAt ?? null,
    createdOn: raw.createdOn ?? null,
  };
}

// ---------------------------------------------------------------------------
// Types and their words
// ---------------------------------------------------------------------------

export function mapType(raw) {
  return {
    notificationTypeId: raw.notificationTypeId,
    key: raw.key,
    code: raw.code ?? '',
    englishName: raw.englishName ?? '',
    arabicName: raw.arabicName ?? '',
    category: raw.category ?? '',
    priorityKey: raw.priorityKey ?? null,
    isPaused: raw.isPaused === true,
    isSystemType: raw.isSystemType === true,
    // Empty = sends nothing yet (no published words on any channel).
    liveChannelKeys: list(raw.liveChannelKeys),
    // The placeholders of its live words, each name once with its default —
    // what a workflow can type values for. RecipientName and ActionUrl are
    // never listed: the module fills those itself.
    placeholders: list(raw.placeholders).map((p) => ({ key: p.key ?? '', value: p.value ?? '' })),
  };
}

export function mapTypeDetails(raw) {
  return {
    ...mapType(raw),
    description: raw.description ?? '',
    actionUrlPattern: raw.actionUrlPattern ?? '',
    emailSenderId: raw.emailSenderId ?? null,
    createdByName: raw.createdByName ?? null,
    createdOn: raw.createdOn ?? null,
    lastModifiedByName: raw.lastModifiedByName ?? null,
    lastModifiedOn: raw.lastModifiedOn ?? null,
    // Per channel: what is sent today, and the newest version written.
    channels: list(raw.channels).map((c) => ({
      channelKey: c.channelKey,
      liveVersion: c.liveVersion ?? null,
      latestVersion: c.latestVersion ?? null,
    })),
  };
}

export function mapTemplateVersion(raw) {
  return {
    templateId: raw.templateId,
    version: raw.version,
    isActive: raw.isActive === true,
    notificationTypeId: raw.notificationTypeId ?? null,
    channelKey: raw.channelKey,
    priorityKey: raw.priorityKey ?? null,
    languageKey: raw.languageKey ?? null,
    englishSubject: raw.englishSubject ?? '',
    arabicSubject: raw.arabicSubject ?? '',
    englishBody: raw.englishBody ?? '',
    arabicBody: raw.arabicBody ?? '',
    isHtml: raw.isHtml === true,
    placeholders: list(raw.placeholders).map((p) => ({ key: p.key ?? '', value: p.value ?? '' })),
    createdByName: raw.createdByName ?? null,
    createdOn: raw.createdOn ?? null,
    publishedByName: raw.publishedByName ?? null,
    publishedOn: raw.publishedOn ?? null,
  };
}

export function mapPreview(raw) {
  return {
    problems: list(raw?.problems),
    subject: raw?.subject ?? '',
    body: raw?.body ?? '',
    englishSubject: raw?.englishSubject ?? '',
    englishBody: raw?.englishBody ?? '',
    arabicSubject: raw?.arabicSubject ?? '',
    arabicBody: raw?.arabicBody ?? '',
    isHtml: raw?.isHtml === true,
    languageKey: raw?.languageKey ?? null,
    priorityKey: raw?.priorityKey ?? null,
    actionUrl: raw?.actionUrl ?? null,
  };
}

// ---------------------------------------------------------------------------
// Email senders and settings
// ---------------------------------------------------------------------------

export function mapEmailSender(raw) {
  return {
    emailSenderId: raw.emailSenderId,
    name: raw.name ?? '',
    providerKey: raw.providerKey ?? null,
    fromAddress: raw.fromAddress ?? '',
    fromName: raw.fromName ?? '',
    smtp: raw.smtp
      ? {
          host: raw.smtp.host ?? '',
          port: raw.smtp.port ?? null,
          securityKey: raw.smtp.securityKey ?? null,
          userName: raw.smtp.userName ?? '',
        }
      : null,
    ses: raw.ses
      ? {
          region: raw.ses.region ?? '',
          accessKeyId: raw.ses.accessKeyId ?? '',
          configurationSet: raw.ses.configurationSet ?? '',
        }
      : null,
    isDefault: raw.isDefault === true,
    createdByName: raw.createdByName ?? null,
    createdOn: raw.createdOn ?? null,
    lastModifiedByName: raw.lastModifiedByName ?? null,
    lastModifiedOn: raw.lastModifiedOn ?? null,
  };
}

/** One settings row — shared by the Workflow and Notifications settings screens. */
export function mapSetting(raw) {
  return {
    key: raw.key,
    value: raw.value ?? '',
    type: raw.type ?? 'text',
    description: raw.description ?? null,
    isKnown: raw.isKnown !== false,
  };
}

// ---------------------------------------------------------------------------
// Delivery monitor
// ---------------------------------------------------------------------------

export function mapDeliveryRow(raw) {
  return {
    deliveryId: raw.deliveryId,
    notificationId: raw.notificationId,
    createdOn: raw.createdOn ?? null,
    typeKey: raw.typeKey ?? null,
    typeName: raw.typeName ?? '',
    recipientUserId: raw.recipientUserId ?? null,
    recipientName: raw.recipientName ?? null,
    recipientEmail: raw.recipientEmail ?? null,
    channelKey: raw.channelKey ?? null,
    channel: raw.channel ?? '',
    statusKey: raw.statusKey ?? null,
    status: raw.status ?? '',
    statusColorHex: raw.statusColorHex ?? null,
    retryCount: raw.retryCount ?? 0,
    maxRetries: raw.maxRetries ?? 0,
    faultReasonKey: raw.faultReasonKey ?? null,
    faultReason: raw.faultReason ?? null,
    errorMessage: raw.errorMessage ?? null,
    sentAt: raw.sentAt ?? null,
    failedAt: raw.failedAt ?? null,
    nextRetryAt: raw.nextRetryAt ?? null,
    readAt: raw.readAt ?? null,
    openedAt: raw.openedAt ?? null,
    clickedAt: raw.clickedAt ?? null,
    workflowInstanceId: raw.workflowInstanceId ?? null,
    correlationId: raw.correlationId ?? null,
    resentFromNotificationId: raw.resentFromNotificationId ?? null,
    // Sent from the template editor's "Send test email", not by the system.
    isTest: raw.isTest === true,
    isArchived: raw.isArchived === true,
    canBeRequeued: raw.canBeRequeued === true,
  };
}

export function mapNotificationDetails(raw) {
  return {
    notificationId: raw.notificationId,
    createdOn: raw.createdOn ?? null,
    typeKey: raw.typeKey ?? null,
    typeCode: raw.typeCode ?? '',
    typeName: raw.typeName ?? '',
    statusKey: raw.statusKey ?? null,
    status: raw.status ?? '',
    errorMessage: raw.errorMessage ?? null,
    recipientUserId: raw.recipientUserId ?? null,
    recipientName: raw.recipientName ?? null,
    // The one person this copy was delivered to.
    recipientEmail: raw.recipientEmail ?? null,
    // The email's To and Cc lines as the reader saw them, one address per line.
    toEmail: raw.toEmail ?? null,
    ccEmail: raw.ccEmail ?? null,
    actionUrl: raw.actionUrl ?? null,
    valuesJson: raw.valuesJson ?? null,
    createdByName: raw.createdByName ?? null,
    workflowInstanceId: raw.workflowInstanceId ?? null,
    correlationId: raw.correlationId ?? null,
    resentFromNotificationId: raw.resentFromNotificationId ?? null,
    resentAsNotificationIds: list(raw.resentAsNotificationIds),
    // Every copy it was resent as, oldest first (2026-10-13). `recipientName`
    // is empty for a typed address — the email names it then. `line` is "To" or "CC".
    resentAs: list(raw.resentAs).map((r) => ({
      notificationId: r.notificationId,
      createdOn: r.createdOn ?? null,
      recipientUserId: r.recipientUserId ?? null,
      recipientName: r.recipientName || null,
      recipientEmail: r.recipientEmail ?? null,
      line: r.line ?? '',
      statusKey: r.statusKey ?? null,
      status: r.status ?? '',
      createdByName: r.createdByName ?? null,
    })),
    isTest: raw.isTest === true,
    isArchived: raw.isArchived === true,
    archivedOn: raw.archivedOn ?? null,
    canBeArchived: raw.canBeArchived === true,
    deliveries: list(raw.deliveries).map((d) => ({
      deliveryId: d.deliveryId,
      channelKey: d.channelKey,
      channel: d.channel ?? '',
      statusKey: d.statusKey ?? null,
      status: d.status ?? '',
      priorityKey: d.priorityKey ?? null,
      priority: d.priority ?? '',
      retryCount: d.retryCount ?? 0,
      maxRetries: d.maxRetries ?? 0,
      errorMessage: d.errorMessage ?? null,
      faultReasonKey: d.faultReasonKey ?? null,
      faultReason: d.faultReason ?? null,
      whatToFix: d.whatToFix ?? null,
      emailSenderName: d.emailSenderName ?? null,
      sentAt: d.sentAt ?? null,
      deliveredAt: d.deliveredAt ?? null,
      failedAt: d.failedAt ?? null,
      nextRetryAt: d.nextRetryAt ?? null,
      seenAt: d.seenAt ?? null,
      readAt: d.readAt ?? null,
      openedAt: d.openedAt ?? null,
      clickedAt: d.clickedAt ?? null,
      templateId: d.templateId ?? null,
      templateVersion: d.templateVersion ?? null,
      languageKey: d.languageKey ?? null,
      isHtml: d.isHtml === true,
      subject: d.subject ?? '',
      body: d.body ?? '',
      englishSubject: d.englishSubject ?? '',
      englishBody: d.englishBody ?? '',
      arabicSubject: d.arabicSubject ?? '',
      arabicBody: d.arabicBody ?? '',
      canBeRequeued: d.canBeRequeued === true,
    })),
  };
}

export function mapStatistics(raw) {
  const counts = (rows) => list(rows).map((r) => ({ key: r.key, name: r.name ?? String(r.key), count: r.count ?? 0 }));
  return {
    byStatus: counts(raw?.byStatus),
    byChannel: counts(raw?.byChannel),
    byType: counts(raw?.byType),
    byPriority: counts(raw?.byPriority),
    faultedByReason: counts(raw?.faultedByReason),
    inAppRead: raw?.inAppRead ?? 0,
    inAppUnread: raw?.inAppUnread ?? 0,
    emailsOpened: raw?.emailsOpened ?? 0,
    emailsClicked: raw?.emailsClicked ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Audit — config changes are the same shape in Workflow and Notifications
// ---------------------------------------------------------------------------

export function mapConfigChange(raw) {
  return {
    changedOn: raw.changedOn ?? null,
    changedBy: raw.changedBy ?? null,
    changedByName: raw.changedByName ?? null,
    area: raw.area ?? '',
    itemName: raw.itemName ?? '',
    action: raw.action ?? '',
    summary: raw.summary ?? '',
    fields: list(raw.fields).map((f) => ({ field: f.field ?? '', before: f.before ?? null, after: f.after ?? null })),
    correlationId: raw.correlationId ?? null,
  };
}

export function mapSendRequest(raw) {
  return {
    requestId: raw.requestId,
    requestedOn: raw.requestedOn ?? null,
    typeKey: raw.typeKey ?? null,
    typeName: raw.typeName ?? '',
    requestedByName: raw.requestedByName ?? null,
    workflowInstanceId: raw.workflowInstanceId ?? null,
    correlationId: raw.correlationId ?? null,
    skippedCount: raw.skippedCount ?? 0,
    recipients: list(raw.recipients).map((r) => ({
      recipientUserId: r.recipientUserId ?? null,
      recipientName: r.recipientName ?? null,
      recipientEmail: r.recipientEmail ?? null,
      outcomeKey: r.outcomeKey ?? null,
      outcome: r.outcome ?? '',
      notificationId: r.notificationId ?? null,
      reason: r.reason ?? null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Background jobs (every module's) and the correlation trace (Workflow)
// ---------------------------------------------------------------------------

export function mapBackgroundJob(raw) {
  return {
    module: raw.module ?? '',
    jobKey: raw.jobKey,
    name: raw.name ?? raw.jobKey,
    description: raw.description ?? '',
    schedule: raw.schedule ?? '',
    isOn: raw.isOn === true,
    lastRunOn: raw.lastRunOn ?? null,
    lastRunState: raw.lastRunState ?? null,
    lastRunResult: raw.lastRunResult ?? null,
    lastRunError: raw.lastRunError ?? null,
    nextRunOn: raw.nextRunOn ?? null,
  };
}

export function mapCorrelationTrace(raw) {
  const link = (l) => ({
    correlationId: l.correlationId,
    workflowInstanceId: l.workflowInstanceId ?? null,
    linkedOn: l.linkedOn ?? null,
  });
  return {
    correlationId: raw?.correlationId ?? '',
    continues: list(raw?.continues).map(link),
    continuedBy: list(raw?.continuedBy).map(link),
    steps: list(raw?.steps).map((s) => ({
      at: s.at ?? null,
      module: s.module ?? '',
      text: s.text ?? '',
      performedByName: s.performedByName ?? null,
      workflowInstanceId: s.workflowInstanceId ?? null,
      notificationId: s.notificationId ?? null,
    })),
  };
}
