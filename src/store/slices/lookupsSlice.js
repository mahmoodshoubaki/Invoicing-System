import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
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

export const fetchInvoiceStatuses = createAsyncThunk(
  'lookups/fetchInvoiceStatuses',
  async (_, { rejectWithValue }) => {
    try {
      return await lookupsRepository.getInvoiceStatuses();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoice statuses.');
    }
  }
);

export const fetchTrackerCycleStatuses = createAsyncThunk(
  'lookups/fetchTrackerCycleStatuses',
  async (_, { rejectWithValue }) => {
    try {
      return await lookupsRepository.getTrackerCycleStatuses();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch tracker cycle statuses.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  billingFrequencies: [],
  boqItemStatuses: [],
  invoiceStatuses: [],
  trackerCycleStatuses: [],
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

      // invoice statuses
      builder.addCase(fetchInvoiceStatuses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoiceStatuses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoiceStatuses = action.payload;
      })
      .addCase(fetchInvoiceStatuses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      ;

      // tracker cycle statuses
      builder.addCase(fetchTrackerCycleStatuses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrackerCycleStatuses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.trackerCycleStatuses = action.payload;
      })
      .addCase(fetchTrackerCycleStatuses.rejected, (state, action) => {
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
export const selectInvoiceStatuses = (state) => state.lookups.invoiceStatuses;
export const selectTrackerCycleStatuses = (state) => state.lookups.trackerCycleStatuses;

/**
 * Returns a plain object keyed by id for O(1) resolution.
 * Usage: const map = useSelector(selectBillingFrequenciesMap);
 *        map[item.billingFrequencyId] → "Monthly"
 *
 * Built with createSelector (not a plain `(state) => ...` function) so it
 * only recomputes — and only returns a new object — when
 * `state.lookups.billingFrequencies` itself changes. A plain function here
 * would call Object.fromEntries fresh on every single invocation, handing
 * out a new object reference to every render regardless of whether the data
 * actually changed, which silently defeats React.memo on any component that
 * receives it as a prop (memo's shallow-equality check sees "changed" every
 * time). Same reasoning for every other Map/color selector below.
 */
export const selectBillingFrequenciesMap = createSelector(
  [selectBillingFrequencies],
  (billingFrequencies) => Object.fromEntries(billingFrequencies.map((f) => [f.id, f.label]))
);
export const selectBoqItemStatusesMap = createSelector(
  [selectBoqItemStatuses],
  (boqItemStatuses) => Object.fromEntries(boqItemStatuses.map((s) => [s.id, s.label]))
);
export const selectInvoiceStatusesMap = createSelector(
  [selectInvoiceStatuses],
  (invoiceStatuses) => Object.fromEntries(invoiceStatuses.map((s) => [s.id, s.label]))
);
export const selectTrackerCycleStatusesMap = createSelector(
  [selectTrackerCycleStatuses],
  (trackerCycleStatuses) => Object.fromEntries(trackerCycleStatuses.map((s) => [s.id, s.label]))
);

/**
 * Returns a plain object keyed by id → hex color, for rendering StatusBadge
 * with the API-provided color instead of the static variant map.
 * Usage: const colors = useSelector(selectInvoiceStatusColorsMap);
 *        <StatusBadge status={label} colors={colors[item.statusId]} />
 */
export const selectInvoiceStatusColorsMap = createSelector(
  [selectInvoiceStatuses],
  (invoiceStatuses) => Object.fromEntries(invoiceStatuses.map((s) => [s.id, s.colorHex]))
);

/**
 * Same as selectInvoiceStatusColorsMap but for BOQ item statuses — kept as
 * its own selector, not shared, since the two lookups are independent.
 * Usage: const colors = useSelector(selectBoqItemStatusColorsMap);
 *        <StatusBadge status={label} colors={colors[item.statusId]} />
 */
export const selectBoqItemStatusColorsMap = createSelector(
  [selectBoqItemStatuses],
  (boqItemStatuses) => Object.fromEntries(boqItemStatuses.map((s) => [s.id, s.colorHex]))
);

/**
 * Same idea as selectBoqItemStatusColorsMap but for tracker cycle statuses.
 * Usage: const colors = useSelector(selectTrackerCycleStatusColorsMap);
 *        <StatusBadge status={label} colors={colors[cycle.statusId]} />
 */
export const selectTrackerCycleStatusColorsMap = createSelector(
  [selectTrackerCycleStatuses],
  (trackerCycleStatuses) => Object.fromEntries(trackerCycleStatuses.map((s) => [s.id, s.colorHex]))
);

export default lookupsSlice.reducer;
