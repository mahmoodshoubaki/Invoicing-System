import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';
import { INSTANCE_STATUS, TASK_STATUS } from '@/constants/workflow';

/**
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

function queryKey(query) {
  return `${query?.statusKey ?? 'all'}:${query?.skip ?? 0}`;
}

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

export const completeTask = createAsyncThunk(
  'workflowTasks/completeTask',
  async (args, { rejectWithValue }) => {
    try {
      const instance = await workflowRepository.completeTask(args);
      return { taskId: args.taskId, instance };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to complete this task.');
    }
  }
);

export function faultAfterCompleting(instance) {
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
  items: [],
  total: 0,
  pendingCount: null,
  loadedQuery: null,
  latestRequestId: null,
  isLoading: false,
  error: null,
  completingTaskId: null,
  lastFetchedAt: null,
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
        const answered = state.items.find((t) => t.taskId === action.payload.taskId);
        state.items = state.items.filter((t) => t.taskId !== action.payload.taskId);
        if (answered && isPendingTask(answered) && state.pendingCount > 0) state.pendingCount -= 1;
        state.error = faultAfterCompleting(action.payload.instance);
      })
      .addCase(completeTask.rejected, (state, action) => {
        state.completingTaskId = null;
        state.error = action.payload;
      });

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

export const selectMyTasks = (state) => state.workflowTasks.items;
export const selectMyTasksTotal = (state) => state.workflowTasks.total;
export const selectPendingTaskCount = (state) => state.workflowTasks.pendingCount;
export const selectMyTasksLoading = (state) => state.workflowTasks.isLoading;
export const selectMyTasksError = (state) => state.workflowTasks.error;
export const selectCompletingTaskId = (state) => state.workflowTasks.completingTaskId;
export const selectMyTasksLoaded = (state) => state.workflowTasks.hasLoaded;

export function isPendingTask(task) {
  return task?.statusKey == null || task.statusKey === TASK_STATUS.PENDING;
}

export const selectMyTaskCount = (state) => state.workflowTasks.pendingCount ?? 0;

export default workflowTasksSlice.reducer;
