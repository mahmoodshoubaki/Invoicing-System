'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlarmClock, Info, UserPlus } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import UserPicker from '@/components/workflow/builder/UserPicker';
import AssigneeList from '@/components/workflow/AssigneeList';
import ProjectLink from '@/components/workflow/ProjectLink';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { fetchAllRoles, selectRoles, selectRolesLoading } from '@/store/slices/rolesSlice';
import { resolveAssignees, selectAssigneesById } from '@/store/slices/workflowSlice';

/**
 * Handing an open to-do to somebody else.
 *
 * Three things about this are worth stating on the screen, because all three
 * are assumed wrong by default:
 *
 *   1. **The deadline does not restart.** The replacement keeps the original
 *      due date and escalation clock — a handover is the same piece of work,
 *      not a new one. Somebody passing on an already-overdue task should know
 *      they are not buying time.
 *   2. **The old to-do is not cancelled.** It closes as *Reassigned*, which is
 *      its own task status, so the run's history shows a handover rather than
 *      work that was thrown away.
 *   3. **Anybody named can answer it.** Like any assignee list, the first
 *      person to respond finishes it for everyone.
 */
export default function ReassignDialog({ task, open, busy, onClose, onConfirm }) {
  const dispatch = useDispatch();

  const roles = useSelector(selectRoles);
  const rolesLoading = useSelector(selectRolesLoading);
  const resolvedById = useSelector(selectAssigneesById);

  const [userIds, setUserIds] = useState([]);
  const [roleIds, setRoleIds] = useState([]);

  useEffect(() => {
    dispatch(fetchAllRoles());
  }, [dispatch]);

  /*
   * Chips need names, and the picker resolves them through the same shared
   * lookup the builder uses — `?ids=` returns people whether or not they are
   * still active, which is what stops a departed colleague rendering as a guid.
   */
  const userKey = userIds.join(',');
  useEffect(() => {
    if (userIds.length > 0) dispatch(resolveAssignees(userIds));
    // `userKey` is the real dependency; the array identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, dispatch]);

  // At least one of either, or the server refuses with WF-006. Checked here so
  // that is never how somebody finds out.
  const ready = userIds.length > 0 || roleIds.length > 0;

  const toggleRole = (id) =>
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const overdueNote = useMemo(() => Boolean(task?.dueOn), [task]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hand this task to somebody else"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            icon={UserPlus}
            loading={busy}
            disabled={!ready}
            onClick={() => onConfirm({ toUserIds: userIds, toRoleIds: roleIds })}
          >
            Hand it on
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-medium" style={{ color: CHROME.textPrimary }}>{task?.title}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px]" style={{ color: CHROME.textMuted }}>
            <span>
              {task?.definitionCode}
              {task?.currentStageTitle && ` · ${task.currentStageTitle}`}
            </span>
            <ProjectLink projectCode={task?.projectCode} size="xs" />
          </p>
        </div>

        {/*
          Who holds it now — the thing a person handing work on needs to see
          before choosing who gets it next, and the easiest way to avoid
          "reassigning" a to-do to the people it is already with.

          Current assignees, from the task record: not the definition's, which
          would be wrong for an expression-assigned or already-handed-on to-do.
        */}
        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
            Currently assigned to
          </p>
          <AssigneeList
            users={task?.assignedUsers ?? []}
            roles={task?.assignedRoles ?? []}
            emptyText="Not reported for this to-do."
          />
        </div>

        {/* The deadline surviving the handover is the fact people get wrong,
            so it is shown with the actual date rather than described. */}
        {overdueNote && (
          <p
            className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
            style={{ backgroundColor: withAlpha(STATUS.warning, 0.1), color: CHROME.textSecondary }}
          >
            <AlarmClock size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
            <span>
              The due date stays <strong>{formatDateTime(task.dueOn)}</strong> — a handover is the
              same piece of work, so its clock does not restart.
            </span>
          </p>
        )}

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>People</p>
          <UserPicker selectedIds={userIds} resolvedById={resolvedById} onChange={setUserIds} />
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>Roles</p>
          {rolesLoading && roles.length === 0 ? (
            <p className="text-[11px]" style={{ color: CHROME.textMuted }}>Loading roles…</p>
          ) : roles.length === 0 ? (
            <p className="text-[11px]" style={{ color: CHROME.textMuted }}>No roles available.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {roles.map((role) => {
                const on = roleIds.includes(role.id);
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      aria-pressed={on}
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                      style={{
                        backgroundColor: on ? withAlpha(STATUS.info, 0.14) : '#f1f0ee',
                        color: on ? STATUS.info : CHROME.textSecondary,
                      }}
                    >
                      {role.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p
          className="flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px] leading-snug"
          style={{ backgroundColor: '#fbfaf9', color: CHROME.textSecondary }}
        >
          <Info size={11} className="mt-0.5 shrink-0" style={{ color: CHROME.textMuted }} aria-hidden="true" />
          <span>
            This to-do closes as <strong>Reassigned</strong> — not Cancelled — and a replacement
            appears in their list. Whoever answers first finishes it for everybody named.
          </span>
        </p>

        {!ready && (
          <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
            Name at least one person or role.
          </p>
        )}
      </div>
    </Modal>
  );
}
