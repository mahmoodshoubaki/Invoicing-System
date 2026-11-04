'use client';

import AttachmentList from '@/components/common/AttachmentList';
import FieldChangesTable from '@/components/changeRequests/view/FieldChangesTable';
import CycleChangesTable from '@/components/changeRequests/view/CycleChangesTable';
import NewItemsTable from '@/components/changeRequests/view/NewItemsTable';
import TypeAndEffect from '@/components/changeRequests/view/TypeAndEffect';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { CHROME } from '@/theme/vizPalette';

function Part({ title, children }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>{title}</p>
      {children}
    </div>
  );
}

/**
 * @param {{ version: Object, changeRequestId: number|string, projectCode: string }} props
 */
export default function ChangeRequestVersionDetails({ version, changeRequestId, projectCode }) {
  const nothingChanged = version.fieldChanges.length === 0 && version.cycleChanges.length === 0 && version.newItems.length === 0;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-[#fbfaf9] p-4">
      <TypeAndEffect types={version.types} otherTypeText={version.otherTypeText} projectEffect={version.projectEffect} />
      <Part title="Reasons">
        {version.reasons.length === 0 ? (
          <p className="text-xs" style={{ color: CHROME.textMuted }}>None.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {version.reasons.map((reason) => (
              <li key={reason.key} className="rounded-full border border-[#ecebe8] bg-white px-2 py-0.5 text-[11px]" style={{ color: CHROME.textPrimary }}>
                {reason.label}
              </li>
            ))}
          </ul>
        )}
      </Part>
      {version.additionalDetails && (
        <Part title="Additional details">
          <p className="whitespace-pre-line text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>{version.additionalDetails}</p>
        </Part>
      )}
      {nothingChanged && <p className="text-xs" style={{ color: CHROME.textMuted }}>No field, plan or new item changes.</p>}
      {version.fieldChanges.length > 0 && <FieldChangesTable changes={version.fieldChanges} />}
      {version.cycleChanges.length > 0 && <CycleChangesTable changes={version.cycleChanges} />}
      {version.newItems.length > 0 && <NewItemsTable items={version.newItems} projectCode={projectCode} />}
      <Part title="Files">
        <AttachmentList
          files={version.attachments}
          download={(file) => changeRequestRepository.downloadAttachment(changeRequestId, file.contentId, file.fileName)}
        />
      </Part>
    </div>
  );
}
