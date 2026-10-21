import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';
import { INSTANCE_STATUS } from '@/constants/workflow';

/**
 * Workflow runs (instances).
 *
 * There is no live push — SignalR is parked — so everything here refreshes by
 * an explicit fetch or by polling. Nothing in this slice assumes it will be
 * told when a run moves.
 */

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchInstances = createAsyncThunk(
  'workflowRuns/fetchInstances',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await workflowRepository.getInstances(filters);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load runs.');
    }
  }
);

export const fetchInstance = createAsyncThunk(
  'workflowRuns/fetchInstance',
  async (instanceId, { rejectWithValue }) => {
    try {
      return await workflowRepository.getInstance(instanceId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load this run.');
    }
  }
);

/**
 * Pause a run — reversible, unlike cancel.
 *
 * `resumeInstance` is what picks it back up, which is why there is no separate
 * unpause: one Resume button covers both a paused run and a faulted one.
 */
export const pauseInstance = createAsyncThunk(
  'workflowRuns/pauseInstance',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.pauseInstance(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to pause this run.');
    }
  }
);

/**
 * Stop a run for good.
 *
 * Not an alternative to Resume and not the opposite of Advance — it is the end.
 * Every to-do the run was asking is withdrawn, and there is **no way back**:
 * a cancelled run can only be started again from the beginning.
 */
export const cancelInstance = createAsyncThunk(
  'workflowRuns/cancelInstance',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.cancelInstance(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to stop this run.');
    }
  }
);

/**
 * Every task a run has created, whatever became of it.
 *
 * Its own call since 2026-09-13 — `GetInstance` no longer carries tasks at all.
 */
export const fetchInstanceTasks = createAsyncThunk(
  'workflowRuns/fetchInstanceTasks',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.getInstanceTasks(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load this run’s tasks.');
    }
  }
);

/** A run's audit trail. Also its own call since 2026-09-13. */
export const fetchInstanceHistory = createAsyncThunk(
  'workflowRuns/fetchInstanceHistory',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.getInstanceHistory(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load this run’s history.');
    }
  }
);

export const startInstance = createAsyncThunk(
  'workflowRuns/startInstance',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.startInstance(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to start this workflow.');
    }
  }
);

/**
 * Nudge a run. Safe to send twice — a run waiting on a person does not move —
 * and it retries a step parked on a retry immediately, which is the "try now"
 * button.
 *
 * **Does nothing at all on a Faulted run, and still answers 200.** No error, no
 * movement. Use `didAdvance` below rather than reading success as progress; the
 * way back from Faulted is `resumeInstance`.
 */
export const advanceInstance = createAsyncThunk(
  'workflowRuns/advanceInstance',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.advanceInstance(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to advance this run.');
    }
  }
);

/**
 * Bring a faulted run back: un-faults it, gives the failed step its full
 * allowance again, and advances it.
 */
export const resumeInstance = createAsyncThunk(
  'workflowRuns/resumeInstance',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.resumeInstance(args);
    } catch (err) {
      // The sentence stays the payload, as every caller toasts it; a corrected
      // value the server refused (WF-058, by `variableChanges[name]`) rides in
      // `meta`, so the dialog can put it under its box (2026-10-21).
      return rejectWithValue(err.message || 'Failed to resume this run.', { errors: err?.errors ?? null, code: err?.code ?? null });
    }
  }
);

/**
 * Which button a run should show. The whole rule is its status.
 *
 * Running covers a run parked mid-retry — it has not moved, so it still sits on
 * its original stage and step and advancing retries it now.
 */
export function runAction(instance) {
  /*
   * Resume covers TWO statuses since 2026-09-13: a run that gave up (Faulted)
   * and one somebody stopped on purpose (Paused). `ResumeInstance` handles
   * both, so they share one button rather than growing a second that does the
   * same thing — and `resetStepCount` stays a faulted-loop-guard concern only,
   * since a paused run has no retry count to clear.
   */
  const key = instance?.statusKey;
  if (key === INSTANCE_STATUS.FAULTED || key === INSTANCE_STATUS.PAUSED) return 'resume';
  if (key === INSTANCE_STATUS.RUNNING) return 'advance';
  return null;
}

/**
 * Whether an advance actually moved anything.
 *
 * A 200 is not proof: advancing a faulted run is a silent no-op. Comparing the
 * status and the current step across the call is the only way to know, and
 * without it the screen would report success to somebody whose run never
 * budged.
 */
export function didAdvance(before, after) {
  if (!before || !after) return false;
  return before.statusKey !== after.statusKey || before.currentStepId !== after.currentStepId;
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  items: [],
  total: 0,
  isLoading: false,
  error: null,

  /**
   * Whether `items` is an answer yet.
   *
   * An empty list means two completely different things — "nothing matches" and
   * "nothing has been asked yet" — and a screen that cannot tell them apart
   * renders "No runs here" over a request that is still in flight.
   */
  hasLoaded: false,
  /** Which filter `items` belongs to, so another filter's rows never stand in. */
  loadedStatusKey: null,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  /*
   * The selected run's tasks and history, held beside it rather than on it.
   *
   * They arrive from two separate calls now, and each keeps its own `loaded`
   * for the same reason the list does: an empty array is not an answer until
   * something has answered. `forInstance` guards against the far more likely
   * mix-up here — showing one run's history under another run's id.
   */
  tasks: [],
  tasksLoaded: false,
  tasksError: null,

  history: [],
  historyLoaded: false,
  historyError: null,

  /** Which run `tasks` and `history` belong to. */
  detailForInstance: null,

  isAdvancing: false,
};

const workflowRunsSlice = createSlice({
  name: 'workflowRuns',
  initialState,
  reducers: {
    clearSelectedInstance(state) {
      state.selected = null;
      state.selectedError = null;
    },
    /**
     * Adopt an instance returned by another call — CompleteTask hands back the
     * updated run, so the detail view can show it without a second fetch.
     */
    instanceUpdated(state, action) {
      const instance = action.payload;
      if (!instance) return;
      if (state.selected?.instanceId === instance.instanceId) {
        state.selected = instance;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchInstances.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;

        // Switching filters asks a different question, so the previous answer
        // must stop standing in for it — otherwise Faulted's rows sit under the
        // Running tab until the fetch lands. A refresh of the SAME filter keeps
        // its rows, so polling never blanks the page.
        if (state.loadedStatusKey !== (action.meta.arg?.statusKey ?? null)) {
          state.items = [];
          state.total = 0;
          state.hasLoaded = false;
        }
      })
      .addCase(fetchInstances.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hasLoaded = true;
        state.loadedStatusKey = action.meta.arg?.statusKey ?? null;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchInstances.rejected, (state, action) => {
        state.isLoading = false;
        // A failure is an answer too — the screen shows the error rather than
        // spinning forever waiting for one that is not coming.
        state.hasLoaded = true;
        state.error = action.payload;
      });

    builder
      .addCase(fetchInstance.pending, (state) => {
        state.selectedLoading = true;
        state.selectedError = null;
      })
      .addCase(fetchInstance.fulfilled, (state, action) => {
        state.selectedLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchInstance.rejected, (state, action) => {
        state.selectedLoading = false;
        state.selectedError = action.payload;
      });

    /*
     * Tasks and history, each keyed to the run they were asked for.
     *
     * `detailForInstance` is reset the moment a DIFFERENT run is asked about,
     * which drops both lists — otherwise arriving at run B would draw run A's
     * timeline while B's was still in flight, which is the same class of bug as
     * the stale `selected` the detail screen guards against.
     */
    const forRun = (state, instanceId) => {
      if (state.detailForInstance !== instanceId) {
        state.detailForInstance = instanceId;
        state.tasks = [];
        state.tasksLoaded = false;
        state.tasksError = null;
        state.history = [];
        state.historyLoaded = false;
        state.historyError = null;
      }
    };

    builder
      .addCase(fetchInstanceTasks.pending, (state, action) => {
        forRun(state, action.meta.arg?.instanceId ?? null);
      })
      .addCase(fetchInstanceTasks.fulfilled, (state, action) => {
        if (state.detailForInstance !== (action.meta.arg?.instanceId ?? null)) return;
        state.tasks = action.payload.items;
        state.tasksLoaded = true;
        state.tasksError = null;
      })
      .addCase(fetchInstanceTasks.rejected, (state, action) => {
        if (state.detailForInstance !== (action.meta.arg?.instanceId ?? null)) return;
        state.tasksLoaded = true;
        state.tasksError = action.payload;
      });

    builder
      .addCase(fetchInstanceHistory.pending, (state, action) => {
        forRun(state, action.meta.arg?.instanceId ?? null);
      })
      .addCase(fetchInstanceHistory.fulfilled, (state, action) => {
        if (state.detailForInstance !== (action.meta.arg?.instanceId ?? null)) return;
        state.history = action.payload.items;
        state.historyLoaded = true;
        state.historyError = null;
      })
      .addCase(fetchInstanceHistory.rejected, (state, action) => {
        if (state.detailForInstance !== (action.meta.arg?.instanceId ?? null)) return;
        state.historyLoaded = true;
        state.historyError = action.payload;
      });

    // Both start and advance return the full instance, so the detail view is
    // current the moment either resolves.
    builder.addCase(startInstance.fulfilled, (state, action) => {
      state.selected = action.payload;
    });

    builder
      .addCase(advanceInstance.pending, (state) => {
        state.isAdvancing = true;
      })
      .addCase(advanceInstance.fulfilled, (state, action) => {
        state.isAdvancing = false;
        state.selected = action.payload;
      })
      .addCase(advanceInstance.rejected, (state, action) => {
        state.isAdvancing = false;
        state.selectedError = action.payload;
      });

    /*
     * Cancel shares `isAdvancing` with advance and resume deliberately: they
     * are the three things that act on a run, only one can be in flight at a
     * time, and every button that triggers one should be busy while any of
     * them is.
     */
    builder
      .addCase(pauseInstance.pending, (state) => {
        state.isAdvancing = true;
      })
      .addCase(pauseInstance.fulfilled, (state, action) => {
        state.isAdvancing = false;
        state.selected = action.payload;
      })
      .addCase(pauseInstance.rejected, (state, action) => {
        state.isAdvancing = false;
        state.selectedError = action.payload;
      });

    builder
      .addCase(cancelInstance.pending, (state) => {
        state.isAdvancing = true;
      })
      .addCase(cancelInstance.fulfilled, (state, action) => {
        state.isAdvancing = false;
        state.selected = action.payload;
      })
      .addCase(cancelInstance.rejected, (state, action) => {
        state.isAdvancing = false;
        state.selectedError = action.payload;
      });

    builder
      .addCase(resumeInstance.pending, (state) => {
        state.isAdvancing = true;
      })
      .addCase(resumeInstance.fulfilled, (state, action) => {
        state.isAdvancing = false;
        state.selected = action.payload;
      })
      .addCase(resumeInstance.rejected, (state, action) => {
        state.isAdvancing = false;
        state.selectedError = action.payload;
      });
  },
});

export const { clearSelectedInstance, instanceUpdated } = workflowRunsSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectInstances = (state) => state.workflowRuns.items;
export const selectInstancesTotal = (state) => state.workflowRuns.total;
export const selectInstancesLoading = (state) => state.workflowRuns.isLoading;
export const selectInstancesError = (state) => state.workflowRuns.error;
/** False until a result for the current filter has actually arrived. */
export const selectInstancesLoaded = (state) => state.workflowRuns.hasLoaded;

export const selectInstanceTasks = (state) => state.workflowRuns.tasks;
export const selectInstanceTasksLoaded = (state) => state.workflowRuns.tasksLoaded;
export const selectInstanceTasksError = (state) => state.workflowRuns.tasksError;
export const selectInstanceHistory = (state) => state.workflowRuns.history;
export const selectInstanceHistoryLoaded = (state) => state.workflowRuns.historyLoaded;
export const selectInstanceHistoryError = (state) => state.workflowRuns.historyError;
/** Which run the two lists above belong to. */
export const selectDetailForInstance = (state) => state.workflowRuns.detailForInstance;

export const selectInstance = (state) => state.workflowRuns.selected;
export const selectInstanceLoading = (state) => state.workflowRuns.selectedLoading;
export const selectInstanceError = (state) => state.workflowRuns.selectedError;
export const selectIsAdvancing = (state) => state.workflowRuns.isAdvancing;

/**
 * Runs that are asleep on a `delay` step, as an id set.
 *
 * Worth separating from "waiting on a person": a sleeping run is fine and will
 * wake itself, while a run sitting on an unanswered task may be genuinely
 * stuck. They should not look the same in a monitoring list.
 */
export const selectSleepingInstanceIds = createSelector([selectInstances], (items) => {
  const now = Date.now();
  return new Set(
    items
      .filter((i) => i.delayUntil && new Date(i.delayUntil).getTime() > now)
      .map((i) => i.instanceId)
  );
});

/**
 * Running instances whose stage deadline has passed or is imminent, soonest
 * first.
 *
 * NOTE: `GetInstances` takes no sort parameter and pages server-side, so this
 * only ever orders the page already fetched. It is not "the most urgent runs
 * in the system" and must not be labelled as such until the backend can sort.
 */
export const selectPageSortedByDeadline = createSelector([selectInstances], (items) =>
  [...items]
    .filter((i) => i.stageDeadlineOn && i.statusKey === INSTANCE_STATUS.RUNNING)
    .sort((a, b) => new Date(a.stageDeadlineOn) - new Date(b.stageDeadlineOn))
);

export default workflowRunsSlice.reducer;
