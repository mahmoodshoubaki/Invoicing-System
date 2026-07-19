import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { lookupsRepository } from '@/repositories/lookupsRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchBillingFrequencies = createAsyncThunk(
  'lookups/fetchBillingFrequencies',
  async (_, { rejectWithValue }) => {
    try {
      return await lookupsRepository.getBillingFrequencies();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch billing frequencies.');
    }
  }
);

export const fetchBoqItemStatuses = createAsyncThunk(
  'lookups/fetchBoqItemStatuses',
  async (_, { rejectWithValue }) => {
    try {
      return await lookupsRepository.getBoqItemStatuses();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch BOQ item statuses.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  billingFrequencies: [],
  boqItemStatuses: [],
  isLoading: false,
  error: null,
};

const lookupsSlice = createSlice({
  name: 'lookups',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // billing frequencies
    builder
      .addCase(fetchBillingFrequencies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBillingFrequencies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.billingFrequencies = action.payload;
      })
      .addCase(fetchBillingFrequencies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
      
      // boq item statuses
      builder.addCase(fetchBoqItemStatuses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoqItemStatuses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boqItemStatuses = action.payload;
      })
      .addCase(fetchBoqItemStatuses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      ;
  },

});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectBillingFrequencies = (state) => state.lookups.billingFrequencies;
export const selectBoqItemStatuses = (state) => state.lookups.boqItemStatuses;

/**
 * Returns a plain object keyed by id for O(1) resolution.
 * Usage: const map = useSelector(selectBillingFrequenciesMap);
 *        map[item.billingFrequencyId] → "Monthly"
 */
export const selectBillingFrequenciesMap = (state) =>
  Object.fromEntries(
    state.lookups.billingFrequencies.map((f) => [f.id, f.label])
  );
export const selectBoqItemStatusesMap = (state) =>
  Object.fromEntries(
    state.lookups.boqItemStatuses.map((s) => [s.id, s.label])
  );

export default lookupsSlice.reducer;
