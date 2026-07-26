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

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  billingFrequencies: [],
  boqItemStatuses: [],
  invoiceStatuses: [],
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
  },

});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectBillingFrequencies = (state) => state.lookups.billingFrequencies;
export const selectBoqItemStatuses = (state) => state.lookups.boqItemStatuses;
export const selectInvoiceStatuses = (state) => state.lookups.invoiceStatuses;

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
export const selectInvoiceStatusesMap = (state) =>
  Object.fromEntries(
    state.lookups.invoiceStatuses.map((s) => [s.id, s.label])
  );

/**
 * Returns a plain object keyed by id → hex color, for rendering StatusBadge
 * with the API-provided color instead of the static variant map.
 * Usage: const colors = useSelector(selectInvoiceStatusColorsMap);
 *        <StatusBadge status={label} colors={colors[item.statusId]} />
 */
export const selectInvoiceStatusColorsMap = (state) =>
  Object.fromEntries(
    state.lookups.invoiceStatuses.map((s) => [s.id, s.colorHex])
  );

/**
 * Same as selectInvoiceStatusColorsMap but for BOQ item statuses — kept as
 * its own selector, not shared, since the two lookups are independent.
 * Usage: const colors = useSelector(selectBoqItemStatusColorsMap);
 *        <StatusBadge status={label} colors={colors[item.statusId]} />
 */
export const selectBoqItemStatusColorsMap = (state) =>
  Object.fromEntries(
    state.lookups.boqItemStatuses.map((s) => [s.id, s.colorHex])
  );

export default lookupsSlice.reducer;
