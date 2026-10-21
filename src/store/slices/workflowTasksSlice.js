import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';
import { INSTANCE_STATUS, TASK_STATUS } from '@/constants/workflow';

/**
 * The current user's workflow to-do list.
 *
 * Its own slice because it polls on a cadence of its own — folding it into the
 * definitions slice would have every badge refresh invalidate the builder.
 */

/**
 * One page of the list, for the My Tasks screen — and only that screen.
 *
 * @param {{ statusKey?: number|null, skip?: number, take?: number }} query
 */
export const fetchMyTasks = createAsyncThunk(
  'workflowTasks/fetchMyTasks',
  async (query = {}, { rejectWithValue }) => {
    try {
      return await workflowRepository.getMyTasks(query);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load your tasks.');
    }
  }
);

/**
 * The sidebar badge's number, and nothing else.
 *
 * This used to be the WHOLE list, downloaded every two minutes on every page of
 * the app to count its pending rows. Now it is one row, read only for its
 * counts — and it never touches `items`: the list belongs to the My Tasks
 * screen, and a background poll writing into it would throw somebody off
 * page 3 of Completed and back onto page 1 of everything.
 *
 * `pendingCount` is on every response whatever the filter; `total` of a
 * Pending-filtered call is the same number, and stands in if it is ever absent.
 */
export const fetchPendingCount = createAsyncThunk(
  'workflowTasks/fetchPendingCount',
  async (_, { rejectWithValue }) => {
    try {
      const { total, pendingCount } = await workflowRepository.getMyTasks({
        statusKey: TASK_STATUS.PENDING,
        take: 1,
      });
      return pendingCount ?? total;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to count your tasks.');
    }
  }
);

/** Which question a list of rows answers — the filter and the page. */
function queryKey(query) {
  return `${query?.statusKey ?? 'all'}:${query?.skip ?? 0}`;
}

/**
 * Hand a to-do to somebody else.
 *
 * **Deliberately does not touch `items`.** The response is `{ taskId,
 * replacedTaskId }` — a NEW to-do with a NEW id, not the old row updated — and
 * the replacement may or may not belong in this caller's list depending on who
 * it went to. Patching the row would leave a stale id on screen that no longer
 * answers, and removing it would be wrong for somebody who can see everybody's
 * to-dos. Re-reading the list is the only correct move, and the caller does it.
 *
 * There is no ownership check on the endpoint: `WorkflowTasks.Reassign` exists
 * so somebody covering for a colleague can pass work on without `ActAll`, which
 * would also let them decide the outcome.
 */
export const reassignTask = createAsyncThunk(
  'workflowTasks/reassignTask',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.reassignTask(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to hand this task on.');
    }
  }
);

/**
 * Answer a task.
 *
 * Returns the updated instance, and the completed task is removed locally so
 * the row disappears immediately rather than after the next poll. A refetch
 * still follows in the caller: completing one task can cancel others — a
 * `parallel` step's `joinWhen`, or a stage deadline firing, both clear pending
 * to-dos that this response says nothing about.
 *
 * **A 200 here does not mean the run is healthy.** The answer is recorded, and
 * then the engine walks on — and a step after this one can fail: a placeholder
 * that resolves to nothing, a condition that matches no transition, a step that
 * was deleted from under a running instance. That comes back as a successful
 * completion carrying a Faulted instance, so the status has to be read rather
 * than assumed. Answering "Approve" and being told nothing while the run is
 * dead is the exact failure this guards against.
 *
 * The other shape — a straight error response — still arrives as a rejection,
 * so both paths are handled.
 */
export const completeTask = createAsyncThunk(
  'workflowTasks/completeTask',
  async (args, { rejectWithValue }) => {
    try {
      const instance = await workflowRepository.completeTask(args);
      return { taskId: args.taskId, instance };
    } catch (err) {
      /*
       * A STRING, like every other thunk in this module.
       *
       * It rejected with `{message, code, status}` until 2026-09-13, left over
       * from the deleted error map, and the callers had stopped unwrapping it —
       * so a failed completion put an object into a toast body and React threw
       * "Objects are not valid as a React child". The commonest way to hit it is
       * answering a to-do on a run that has been paused: WF-001, every time.
       *
       * Nothing reads the code or the status from here, and the server's own
       * sentence is what gets shown.
       */
      return rejectWithValue(err.message || 'Failed to complete this task.');
    }
  }
);

/**
 * The run failed after the answer was recorded, if it did.
 *
 * `failureReason` is written to be read by a person, so it is surfaced as-is
 * rather than being mapped to a code or reworded.
 */
export function faultAfterCompleting(instance) {
  /*
   * `statusKey`, the number — NOT `status`, the display string.
   *
   * This compared `instance.status` ("Faulted") with `INSTANCE_STATUS.FAULTED`
   * (4) until 2026-09-14. A string never equals a number, so the check always
   * returned null and this warning never once fired: somebody whose answer
   * pushed a run straight into a fault was told "Task completed" and walked
   * away believing the work had moved on — the exact failure this exists for.
   */
  if (!instance || instance.statusKey !== INSTANCE_STATUS.FAULTED) return null;
  return {
    message:
      instance.failureReason ||
      'Your answer was recorded, but the run stopped with an error straight afterwards.',
    code: null,
    status: null,
    afterCompleting: true,
  };
}

const initialState = {
  /** The rows of ONE page — see `loadedQuery` for which. */
  items: [],
  /** Every task matching the loaded filter, across all pages. */
  total: 0,
  /**
   * Every pending task, whatever the filter. Feeds the Pending tab and the
   * sidebar badge. Null until something has said.
   */
  pendingCount: null,
  /** The filter and page `items` answers, so a poll of it refreshes in place. */
  loadedQuery: null,
  /**
   * The newest list request. A slower, older one landing after it — a poll of
   * page 2 finishing after a click through to page 3 — is thrown away rather
   * than put on screen under the wrong page number.
   */
  latestRequestId: null,
  isLoading: false,
  error: null,
  /** taskId currently being submitted — lets one row spin without freezing the list. */
  completingTaskId: null,
  lastFetchedAt: null,
  /**
   * Whether `items` is an answer yet. An empty list means both nothing to do and
   * nothing asked yet, and the screen used to render the first as the second.
   */
  hasLoaded: false,
};

const workflowTasksSlice = createSlice({
  name: 'workflowTasks',
  initialState,
  reducers: {
    clearTasksError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMyTasks.pending, (state, action) => {
        state.latestRequestId = action.meta.requestId;
        state.error = null;
        // A poll of the page on screen refreshes it in place and must not blank
        // it. A different filter or page is a different question: the table
        // shows it is loading rather than the old rows under the new page number.
        if (state.loadedQuery !== queryKey(action.meta.arg)) state.isLoading = true;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) return;
        state.isLoading = false;
        state.hasLoaded = true;
        state.items = action.payload.items;
        state.total = action.payload.total;
        if (action.payload.pendingCount != null) state.pendingCount = action.payload.pendingCount;
        state.loadedQuery = queryKey(action.meta.arg);
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) return;
        state.isLoading = false;
        state.hasLoaded = true;
        state.error = action.payload;
      });

    // Only the count. A failed badge poll is not worth an error on screen —
    // the badge keeps its last number until the next one succeeds.
    builder.addCase(fetchPendingCount.fulfilled, (state, action) => {
      state.pendingCount = action.payload ?? 0;
    });

    builder
      .addCase(completeTask.pending, (state, action) => {
        state.completingTaskId = action.meta.arg.taskId;
        state.error = null;
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        state.completingTaskId = null;
        // The to-do is answered either way — it is gone from this list even when
        // the run faulted a step later, and leaving it would invite a second
        // answer the engine would refuse.
        const answered = state.items.find((t) => t.taskId === action.payload.taskId);
        state.items = state.items.filter((t) => t.taskId !== action.payload.taskId);
        // The badge drops now rather than when the refetch lands; the refetch's
        // own `pendingCount` then settles the exact number.
        if (answered && isPendingTask(answered) && state.pendingCount > 0) state.pendingCount -= 1;
        // …but a fault after the answer still has to be told, or the person
        // walks away believing the run moved on.
        state.error = faultAfterCompleting(action.payload.instance);
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.completingTaskId = null;
        state.error = action.payload;
      });

    /*
     * Reassign shares `completingTaskId` so the row it acts on spins, and
     * touches `items` in NEITHER the fulfilled nor the rejected case. The
     * handover produces a new id; the caller refetches. See the thunk.
     */
    builder
      .addCase(reassignTask.pending, (state, action) => {
        state.completingTaskId = action.meta.arg?.taskId ?? null;
        state.error = null;
      })
      .addCase(reassignTask.fulfilled, (state) => {
        state.completingTaskId = null;
      })
      .addCase(reassignTask.rejected, (state, action) => {
        state.completingTaskId = null;
        state.error = action.payload;
      });
  },
});

export const { clearTasksError } = workflowTasksSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** The rows of the page on screen — in the server's order, which is the order shown. */
export const selectMyTasks = (state) => state.workflowTasks.items;
/** Every task matching the loaded filter, across all pages. */
export const selectMyTasksTotal = (state) => state.workflowTasks.total;
/** Every pending task, whatever the filter; null until something has said. */
export const selectPendingTaskCount = (state) => state.workflowTasks.pendingCount;
export const selectMyTasksLoading = (state) => state.workflowTasks.isLoading;
export const selectMyTasksError = (state) => state.workflowTasks.error;
export const selectCompletingTaskId = (state) => state.workflowTasks.completingTaskId;
/** False until the first answer — success or failure — has arrived. */
export const selectMyTasksLoaded = (state) => state.workflowTasks.hasLoaded;

/**
 * Whether a to-do is still waiting on somebody.
 *
 * `GetMyTasks` is documented as returning pending to-dos only, so a row with no
 * `statusKey` is read as pending — absent means "still open", not "unknown".
 * The same rule the My Tasks table uses to decide whether a row can be answered.
 */
export function isPendingTask(task) {
  return task?.statusKey == null || task.statusKey === TASK_STATUS.PENDING;
}

/**
 * The sidebar badge: **pending to-dos only**, counted by the server.
 *
 * A badge is a claim that there is something to do. Counting a Completed,
 * Cancelled or Reassigned row makes that claim false — the number never reaches
 * zero once the list carries settled work, and a badge that is always lit stops
 * being read at all.
 *
 * Read-only rows still count: a pending to-do the user can follow but not
 * answer is still on their plate, and may be theirs to hand on.
 *
 * It is NOT counted from `items` any more. Those are one page, so counting them
 * capped the badge at the page size and got it wrong for anybody with more.
 *
 * Nothing here re-sorts or re-counts rows either — `selectOverdueTaskCount` and
 * `selectMyTasksByUrgency` went for the same reason: over one page, both
 * answered a question about the page rather than about the person's work.
 */
export const selectMyTaskCount = (state) => state.workflowTasks.pendingCount ?? 0;

export default workflowTasksSlice.reducer;
