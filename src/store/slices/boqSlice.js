import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { boqRepository } from '@/repositories/boqRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchBOQByProjectCode = createAsyncThunk(
  'boq/fetchBOQByProjectCode',
  async (projectCode, { rejectWithValue }) => {
    try {
      return await boqRepository.getBOQByProjectCode(projectCode);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch BOQ items.');
    }
  }
);
export const fetchBOQById = createAsyncThunk(
  'boq/fetchBOQById',
  async (boqId, { rejectWithValue }) => {
    try {
      return await boqRepository.getBOQById(boqId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch BOQ items.');
    }
  }
);

export const addBOQItem = createAsyncThunk(
  'boq/addBOQItem',
  async ({ form, boq, cycles }, { rejectWithValue }) => {
    try {
      return await boqRepository.createBOQItem(form, boq, cycles);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create BOQ item.');
    }
  }
);

export const updateBOQItem = createAsyncThunk(
  'boq/updateBOQItem',
  async ({ id, data, cycles }, { rejectWithValue }) => {
    try {
      return await boqRepository.updateBOQItem(id, data, cycles);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update BOQ item.');
    }
  }
);

export const removeBOQItem = createAsyncThunk(
  'boq/removeBOQItem',
  async ({ id, boqId }, { rejectWithValue }) => {
    try {
      await boqRepository.deleteBOQItem(id, boqId);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete BOQ item.');
    }
  }
);

export const bulkRemoveBOQItems = createAsyncThunk(
  'boq/bulkRemoveBOQItems',
  async ({ ids, boqId }, { rejectWithValue }) => {
    try {
      const idList = Array.from(ids, Number);
      await boqRepository.bulkDeleteBOQItems(idList, boqId);
      return idList;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete BOQ item.');
    }
  }
);

export const fetchBOQItemHistory = createAsyncThunk(
  'boq/fetchBOQItemHistory',
  async (boqItemId, { rejectWithValue }) => {
    try {
      return await boqRepository.getBOQItemHistory(boqItemId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch BOQ item history.');
    }
  }
);

export const fetchTrackerCycles = createAsyncThunk(
  'boq/fetchTrackerCycles',
  async (boqItemId, { rejectWithValue }) => {
    try {
      return await boqRepository.getTrackerCycles(boqItemId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch the invoicing plan.');
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
  currentBOQ: null,
  isLoading: false,
  error: null,
  filters: {
    projectCode: null,
    status: '',
  },
  history: {
    items: [],
    isLoading: false,
    error: null,
  },
  trackerCycles: {
    items: [],
    isLoading: false,
    error: null,
  },
};

const boqSlice = createSlice({
  name: 'boq',
  initialState,
  reducers: {
    setCurrentBOQ(state, action) {
      state.currentBOQ = action.payload;
      state.error = null;
    },

    clearBOQ(state) {
      state.currentBOQ = null;
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

    clearBOQItemHistory(state) {
      state.history = initialState.history;
    },

    clearTrackerCycles(state) {
      state.trackerCycles = initialState.trackerCycles;
    },
  },

  extraReducers: (builder) => {
    // fetchBOQByProjectCode
    builder
      .addCase(fetchBOQByProjectCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentBOQ = null;
      })
      .addCase(fetchBOQByProjectCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBOQ = action.payload;
      })
      .addCase(fetchBOQByProjectCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
      // fetchBOQById
    builder
      .addCase(fetchBOQById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentBOQ = null;
      })
      .addCase(fetchBOQById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBOQ = action.payload;
      })
      .addCase(fetchBOQById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // addBOQItem
    builder
      .addCase(addBOQItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addBOQItem.fulfilled, (state) => {
        state.isLoading = false;
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
      .addCase(updateBOQItem.fulfilled, (state) => {
        state.isLoading = false;
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
        if (state.currentBOQ) {
          state.currentBOQ.boqItems = state.currentBOQ.boqItems.filter((item) => item.id !== action.payload);
        }
      })
      .addCase(removeBOQItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
    
    // bulkRemoveBOQItems
    builder
      .addCase(bulkRemoveBOQItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkRemoveBOQItems.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentBOQ) {
          state.currentBOQ.boqItems = state.currentBOQ.boqItems.filter(
            (item) => !action.payload.includes(item.id)
          );
        }
      })
      .addCase(bulkRemoveBOQItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchBOQItemHistory
    builder
      .addCase(fetchBOQItemHistory.pending, (state) => {
        state.history.isLoading = true;
        state.history.error = null;
      })
      .addCase(fetchBOQItemHistory.fulfilled, (state, action) => {
        state.history.isLoading = false;
        state.history.items = action.payload;
      })
      .addCase(fetchBOQItemHistory.rejected, (state, action) => {
        state.history.isLoading = false;
        state.history.error = action.payload;
      });

    // fetchTrackerCycles
    builder
      .addCase(fetchTrackerCycles.pending, (state) => {
        state.trackerCycles.isLoading = true;
        state.trackerCycles.error = null;
      })
      .addCase(fetchTrackerCycles.fulfilled, (state, action) => {
        state.trackerCycles.isLoading = false;
        state.trackerCycles.items = action.payload;
      })
      .addCase(fetchTrackerCycles.rejected, (state, action) => {
        state.trackerCycles.isLoading = false;
        state.trackerCycles.error = action.payload;
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

export const { setCurrentBOQ, clearBOQ, setLoading, setError, setFilters, clearBOQItemHistory, clearTrackerCycles } =
  boqSlice.actions;

// Selectors
export const selectCurrentBOQ  = (state) => state.boq.currentBOQ;
export const selectBOQItems    = (state) => state.boq.currentBOQ?.boqItems ?? [];
export const selectBOQLoading  = (state) => state.boq.isLoading;
export const selectBOQError    = (state) => state.boq.error;
export const selectBOQFilters  = (state) => state.boq.filters;
export const selectBOQItemHistory        = (state) => state.boq.history.items;
export const selectBOQItemHistoryLoading = (state) => state.boq.history.isLoading;
export const selectBOQItemHistoryError   = (state) => state.boq.history.error;
export const selectTrackerCycles         = (state) => state.boq.trackerCycles.items;
export const selectTrackerCyclesLoading  = (state) => state.boq.trackerCycles.isLoading;
export const selectTrackerCyclesError    = (state) => state.boq.trackerCycles.error;

/** BOQ items filtered by current filter state. */
export const selectFilteredBOQ = (state) => {
  const items   = selectBOQItems(state);
  const filters = state.boq.filters;
  return items.filter((item) => {
    if (filters.projectCode && item.projectCode !== filters.projectCode) return false;
    if (filters.status      && item.statusId    !== filters.status)      return false;
    return true;
  });
};

export default boqSlice.reducer;
