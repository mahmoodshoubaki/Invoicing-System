import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { lookupsRepository } from '@/repositories/lookupsRepository';
import { changeRequestRepository } from '@/repositories/changeRequestRepository';
import { invoiceRepository } from '@/repositories/invoiceRepository';
import { localName } from '@/utils/localName';

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

export const fetchChangeRequestReasons = createAsyncThunk(
  'lookups/fetchChangeRequestReasons',
  async (_, { rejectWithValue }) => {
    try {
      return await changeRequestRepository.getReasons();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch change request reasons.');
    }
  }
);

export const fetchChangeRequestTypes = createAsyncThunk(
  'lookups/fetchChangeRequestTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await changeRequestRepository.getTypes();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch change request types.');
    }
  }
);

export const fetchChangeRequestProjectEffects = createAsyncThunk(
  'lookups/fetchChangeRequestProjectEffects',
  async (_, { rejectWithValue }) => {
    try {
      return await changeRequestRepository.getProjectEffects();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch change request project effects.');
    }
  }
);

export const fetchChangeRequestStatuses = createAsyncThunk(
  'lookups/fetchChangeRequestStatuses',
  async (_, { rejectWithValue }) => {
    try {
      return await changeRequestRepository.getStatuses();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch change request statuses.');
    }
  }
);

export const fetchClaimStages = createAsyncThunk(
  'lookups/fetchClaimStages',
  async (_, { rejectWithValue }) => {
    try {
      return await invoiceRepository.getNonEtimadClaimStages();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch financial claim stages.');
    }
  },
  {
    condition: (_, { getState }) => ['idle', 'failed'].includes(getState().lookups.claimStagesStatus),
  }
);

const initialState = {
  claimStages: [],
  claimStagesStatus: 'idle',
  billingFrequencies: [],
  boqItemStatuses: [],
  invoiceStatuses: [],
  trackerCycleStatuses: [],
  changeRequestReasons: [],
  changeRequestTypes: [],
  changeRequestProjectEffects: [],
  changeRequestTypesFailed: false,
  changeRequestStatuses: [],
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
      .addCase(fetchChangeRequestReasons.fulfilled, (state, action) => {
        state.changeRequestReasons = action.payload;
      })
      .addCase(fetchChangeRequestTypes.fulfilled, (state, action) => {
        state.changeRequestTypes = action.payload;
      })
      .addCase(fetchChangeRequestTypes.rejected, (state) => {
        state.changeRequestTypesFailed = true;
      })
      .addCase(fetchChangeRequestProjectEffects.fulfilled, (state, action) => {
        state.changeRequestProjectEffects = action.payload;
      })
      .addCase(fetchChangeRequestProjectEffects.rejected, (state) => {
        state.changeRequestTypesFailed = true;
      })
      .addCase(fetchChangeRequestStatuses.fulfilled, (state, action) => {
        state.changeRequestStatuses = action.payload;
      })
      .addCase(fetchClaimStages.pending, (state) => {
        state.claimStagesStatus = 'loading';
      })
      .addCase(fetchClaimStages.fulfilled, (state, action) => {
        state.claimStages = action.payload;
        state.claimStagesStatus = 'ready';
      })
      .addCase(fetchClaimStages.rejected, (state) => {
        state.claimStagesStatus = 'failed';
      })
      ;
  },

});

export const selectClaimStages = (state) => state.lookups.claimStages;
export const selectClaimStagesStatus = (state) => state.lookups.claimStagesStatus;
export const selectBillingFrequencies = (state) => state.lookups.billingFrequencies;
const selectLanguage = (state) => state.ui.language;
const withLabels = (rows, language) => rows.map((row) => ({ ...row, label: localName(row.labelEn, row.labelAr, language) }));

export const selectBoqItemStatuses = createSelector([(state) => state.lookups.boqItemStatuses, selectLanguage], withLabels);
export const selectBoqItemStatusesEnglish = createSelector([(state) => state.lookups.boqItemStatuses], (rows) => withLabels(rows, 'en'));
export const selectInvoiceStatuses = createSelector([(state) => state.lookups.invoiceStatuses, selectLanguage], withLabels);
export const selectTrackerCycleStatuses = createSelector([(state) => state.lookups.trackerCycleStatuses, selectLanguage], withLabels);
const withChangeRequestLabels = (rows, language) => rows.map((row) => ({
  ...row,
  label: localName(row.label, row.labelAr, language),
  justification: language === 'ar' ? (row.justificationAr || row.justification) : row.justification,
}));

export const selectChangeRequestReasons = createSelector([(state) => state.lookups.changeRequestReasons, selectLanguage], withChangeRequestLabels);
export const selectChangeRequestStatuses = (state) => state.lookups.changeRequestStatuses;
export const selectChangeRequestTypes = createSelector([(state) => state.lookups.changeRequestTypes, selectLanguage], withChangeRequestLabels);
export const selectChangeRequestProjectEffects = createSelector([(state) => state.lookups.changeRequestProjectEffects, selectLanguage], withChangeRequestLabels);
export const selectChangeRequestProjectEffectsEnglish = (state) => state.lookups.changeRequestProjectEffects;
export const selectChangeRequestTypesFailed = (state) => state.lookups.changeRequestTypesFailed;

export const selectChangeRequestTypesMap = createSelector(
  [selectChangeRequestTypes],
  (types) => Object.fromEntries(types.map((t) => [t.key, t]))
);

export const selectChangeRequestProjectEffectsMap = createSelector(
  [selectChangeRequestProjectEffects],
  (effects) => Object.fromEntries(effects.map((e) => [e.key, e]))
);

export const selectChangeRequestStatusesMap = createSelector(
  [selectChangeRequestStatuses],
  (statuses) => Object.fromEntries(statuses.map((s) => [s.key, s]))
);

export const selectChangeRequestReasonsMap = createSelector(
  [selectChangeRequestReasons],
  (reasons) => Object.fromEntries(reasons.map((r) => [r.key, r]))
);

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

export const selectInvoiceStatusColorsMap = createSelector(
  [selectInvoiceStatuses],
  (invoiceStatuses) => Object.fromEntries(invoiceStatuses.map((s) => [s.id, s.colorHex]))
);

export const selectBoqItemStatusColorsMap = createSelector(
  [selectBoqItemStatuses],
  (boqItemStatuses) => Object.fromEntries(boqItemStatuses.map((s) => [s.id, s.colorHex]))
);

export const selectTrackerCycleStatusColorsMap = createSelector(
  [selectTrackerCycleStatuses],
  (trackerCycleStatuses) => Object.fromEntries(trackerCycleStatuses.map((s) => [s.id, s.colorHex]))
);

export default lookupsSlice.reducer;
