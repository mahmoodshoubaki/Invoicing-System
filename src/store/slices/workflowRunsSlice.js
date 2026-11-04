import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';
import { INSTANCE_STATUS } from '@/constants/workflow';

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

export const resumeInstance = createAsyncThunk(
  'workflowRuns/resumeInstance',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.resumeInstance(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to resume this run.', { errors: err?.errors ?? null, code: err?.code ?? null });
    }
  }
);

export function runAction(instance) {
  const key = instance?.statusKey;
  if (key === INSTANCE_STATUS.FAULTED || key === INSTANCE_STATUS.PAUSED) return 'resume';
  if (key === INSTANCE_STATUS.RUNNING) return 'advance';
  return null;
}

export function didAdvance(before, after) {
  if (!before || !after) return false;
  return before.statusKey !== after.statusKey || before.currentStepId !== after.currentStepId;
}

const initialState = {
  items: [],
  total: 0,
  isLoading: false,
  error: null,

  hasLoaded: false,
  loadedStatusKey: null,

  selected: null,
  selectedLoading: false,
  selectedError: null,

  tasks: [],
  tasksLoaded: false,
  tasksError: null,

  history: [],
  historyLoaded: false,
  historyError: null,

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

export const selectInstances = (state) => state.workflowRuns.items;
export const selectInstancesTotal = (state) => state.workflowRuns.total;
export const selectInstancesLoading = (state) => state.workflowRuns.isLoading;
export const selectInstancesError = (state) => state.workflowRuns.error;
export const selectInstancesLoaded = (state) => state.workflowRuns.hasLoaded;

export const selectInstanceTasks = (state) => state.workflowRuns.tasks;
export const selectInstanceTasksLoaded = (state) => state.workflowRuns.tasksLoaded;
export const selectInstanceTasksError = (state) => state.workflowRuns.tasksError;
export const selectInstanceHistory = (state) => state.workflowRuns.history;
export const selectInstanceHistoryLoaded = (state) => state.workflowRuns.historyLoaded;
export const selectInstanceHistoryError = (state) => state.workflowRuns.historyError;
export const selectDetailForInstance = (state) => state.workflowRuns.detailForInstance;

export const selectInstance = (state) => state.workflowRuns.selected;
export const selectInstanceLoading = (state) => state.workflowRuns.selectedLoading;
export const selectInstanceError = (state) => state.workflowRuns.selectedError;
export const selectIsAdvancing = (state) => state.workflowRuns.isAdvancing;

export const selectSleepingInstanceIds = createSelector([selectInstances], (items) => {
  const now = Date.now();
  return new Set(
    items
      .filter((i) => i.delayUntil && new Date(i.delayUntil).getTime() > now)
      .map((i) => i.instanceId)
  );
});

export const selectPageSortedByDeadline = createSelector([selectInstances], (items) =>
  [...items]
    .filter((i) => i.stageDeadlineOn && i.statusKey === INSTANCE_STATUS.RUNNING)
    .sort((a, b) => new Date(a.stageDeadlineOn) - new Date(b.stageDeadlineOn))
);

export default workflowRunsSlice.reducer;
