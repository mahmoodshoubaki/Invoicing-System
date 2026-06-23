import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { boqRepository } from '@/repositories/boqRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchBOQByProject = createAsyncThunk(
  'boq/fetchBOQByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      return await boqRepository.getBOQByProject(projectId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch BOQ items.');
    }
  }
);

export const addBOQItem = createAsyncThunk(
  'boq/addBOQItem',
  async (data, { rejectWithValue }) => {
    try {
      return await boqRepository.createBOQItem(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create BOQ item.');
    }
  }
);

export const updateBOQItem = createAsyncThunk(
  'boq/updateBOQItem',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await boqRepository.updateBOQItem(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update BOQ item.');
    }
  }
);

export const removeBOQItem = createAsyncThunk(
  'boq/removeBOQItem',
  async (id, { rejectWithValue }) => {
    try {
      await boqRepository.deleteBOQItem(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete BOQ item.');
    }
  }
);

export const approveBOQItem = createAsyncThunk(
  'boq/approveBOQItem',
  async (id, { rejectWithValue }) => {
    try {
      return await boqRepository.approveBOQItem(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve BOQ item.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  filters: {
    projectId: null,
    status: '',
  },
};

const boqSlice = createSlice({
  name: 'boq',
  initialState,
  reducers: {
    setBOQItems(state, action) {
      state.items = action.payload;
      state.error = null;
    },

    clearBOQ(state) {
      state.items = [];
      state.error = null;
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Payload: Partial<{ projectId: string|null, status: string }>
     */
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    // fetchBOQByProject
    builder
      .addCase(fetchBOQByProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBOQByProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchBOQByProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // addBOQItem
    builder
      .addCase(addBOQItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addBOQItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.push(action.payload);
      })
      .addCase(addBOQItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // updateBOQItem
    builder
      .addCase(updateBOQItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBOQItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(updateBOQItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // removeBOQItem
    builder
      .addCase(removeBOQItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeBOQItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(removeBOQItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // approveBOQItem
    builder
      .addCase(approveBOQItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveBOQItem.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(approveBOQItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setBOQItems, clearBOQ, setLoading, setError, setFilters } =
  boqSlice.actions;

// Selectors
export const selectBOQItems = (state) => state.boq.items;
export const selectBOQLoading = (state) => state.boq.isLoading;
export const selectBOQError = (state) => state.boq.error;
export const selectBOQFilters = (state) => state.boq.filters;

/** Filtered by current filter state. */
export const selectFilteredBOQ = (state) => {
  const { items, filters } = state.boq;
  return items.filter((item) => {
    if (filters.projectId && item.projectId !== filters.projectId) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });
};

export default boqSlice.reducer;
