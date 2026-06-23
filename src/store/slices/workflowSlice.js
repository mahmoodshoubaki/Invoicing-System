import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchWorkflows = createAsyncThunk(
  'workflow/fetchWorkflows',
  async (_, { rejectWithValue }) => {
    try {
      return await workflowRepository.getWorkflows();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch workflows.');
    }
  }
);

export const createWorkflow = createAsyncThunk(
  'workflow/createWorkflow',
  async (data, { rejectWithValue }) => {
    try {
      return await workflowRepository.createWorkflow(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create workflow.');
    }
  }
);

export const updateWorkflow = createAsyncThunk(
  'workflow/updateWorkflow',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await workflowRepository.updateWorkflow(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update workflow.');
    }
  }
);

export const deleteWorkflow = createAsyncThunk(
  'workflow/deleteWorkflow',
  async (id, { rejectWithValue }) => {
    try {
      await workflowRepository.deleteWorkflow(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete workflow.');
    }
  }
);

export const toggleWorkflowStatus = createAsyncThunk(
  'workflow/toggleWorkflowStatus',
  async (id, { getState, rejectWithValue }) => {
    try {
      const workflow = getState().workflow.workflows.find((w) => w.id === id);
      if (!workflow) throw new Error('Workflow not found.');

      if (workflow.isActive) {
        return await workflowRepository.deactivateWorkflow(id);
      } else {
        return await workflowRepository.activateWorkflow(id);
      }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to toggle workflow status.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  workflows: [],
  activeWorkflow: null,
  isLoading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setWorkflows(state, action) {
      state.workflows = action.payload;
      state.error = null;
    },

    setActiveWorkflow(state, action) {
      state.activeWorkflow = action.payload;
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },

  extraReducers: (builder) => {
    // fetchWorkflows
    builder
      .addCase(fetchWorkflows.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflows = action.payload;
        // Set the default active workflow if none selected
        if (!state.activeWorkflow) {
          state.activeWorkflow = action.payload.find((w) => w.isDefault && w.isActive) ?? null;
        }
      })
      .addCase(fetchWorkflows.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createWorkflow
    builder
      .addCase(createWorkflow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflows.push(action.payload);
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // updateWorkflow
    builder
      .addCase(updateWorkflow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.workflows.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) {
          state.workflows[idx] = action.payload;
        }
        if (state.activeWorkflow?.id === action.payload.id) {
          state.activeWorkflow = action.payload;
        }
      })
      .addCase(updateWorkflow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // deleteWorkflow
    builder
      .addCase(deleteWorkflow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflows = state.workflows.filter((w) => w.id !== action.payload);
        if (state.activeWorkflow?.id === action.payload) {
          state.activeWorkflow = null;
        }
      })
      .addCase(deleteWorkflow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // toggleWorkflowStatus
    builder
      .addCase(toggleWorkflowStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleWorkflowStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.workflows.findIndex((w) => w.id === action.payload.id);
        if (idx !== -1) {
          state.workflows[idx] = action.payload;
        }
        if (state.activeWorkflow?.id === action.payload.id) {
          state.activeWorkflow = action.payload;
        }
      })
      .addCase(toggleWorkflowStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setWorkflows, setActiveWorkflow, setLoading, setError } =
  workflowSlice.actions;

// Selectors
export const selectWorkflows = (state) => state.workflow.workflows;
export const selectActiveWorkflow = (state) => state.workflow.activeWorkflow;
export const selectWorkflowsLoading = (state) => state.workflow.isLoading;
export const selectWorkflowsError = (state) => state.workflow.error;
export const selectActiveWorkflows = (state) =>
  state.workflow.workflows.filter((w) => w.isActive);

export default workflowSlice.reducer;
