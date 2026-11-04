import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { invoiceRepository } from '@/repositories/invoiceRepository';

export const fetchInvoicesByProjectCode = createAsyncThunk(
  'invoices/fetchInvoicesByProjectCode',
  async (projectCode, { rejectWithValue }) => {
    try {
      return await invoiceRepository.getInvoicesByProjectCode(projectCode);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoices.');
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'invoices/fetchInvoiceById',
  async (id, { rejectWithValue }) => {
    try {
      return await invoiceRepository.getInvoiceById(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoice.');
    }
  }
);

export const fetchInvoiceableBOQItems = createAsyncThunk(
  'invoices/fetchInvoiceableBOQItems',
  async (projectCode, { rejectWithValue }) => {
    try {
      return await invoiceRepository.getInvoiceableBOQItems(projectCode);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoiceable BOQ items.');
    }
  }
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (data, { rejectWithValue }) => {
    try {
      return await invoiceRepository.createInvoice(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create invoice.');
    }
  }
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async (data, { rejectWithValue }) => {
    try {
      return await invoiceRepository.updateInvoice(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update invoice.');
    }
  }
);

export const fetchInvoiceHistory = createAsyncThunk(
  'invoices/fetchInvoiceHistory',
  async (invoiceId, { rejectWithValue }) => {
    try {
      return await invoiceRepository.getInvoiceHistory(invoiceId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch invoice history.');
    }
  }
);

const initialState = {
  items: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,
  invoiceableItems: {
    items: [],
    isLoading: false,
    error: null,
  },
  history: {
    items: [],
    isLoading: false,
    error: null,
  },
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoices(state, action) {
      state.items = action.payload;
      state.error = null;
    },

    setSelectedInvoice(state, action) {
      state.selectedInvoice = action.payload;
    },

    updateInvoiceInList(state, action) {
      const idx = state.items.findIndex((inv) => inv.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
      if (state.selectedInvoice?.id === action.payload.id) {
        state.selectedInvoice = action.payload;
      }
    },

    removeInvoice(state, action) {
      state.items = state.items.filter((inv) => inv.id !== action.payload);
      if (state.selectedInvoice?.id === action.payload) {
        state.selectedInvoice = null;
      }
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },

    clearError(state) {
      state.error = null;
    },

    clearInvoiceableBOQItems(state) {
      state.invoiceableItems = initialState.invoiceableItems;
    },

    clearInvoiceHistory(state) {
      state.history = initialState.history;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoicesByProjectCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoicesByProjectCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvoicesByProjectCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchInvoiceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedInvoice = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedInvoice = action.payload;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(updateInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchInvoiceHistory.pending, (state) => {
        state.history.isLoading = true;
        state.history.error = null;
      })
      .addCase(fetchInvoiceHistory.fulfilled, (state, action) => {
        state.history.isLoading = false;
        state.history.items = action.payload;
      })
      .addCase(fetchInvoiceHistory.rejected, (state, action) => {
        state.history.isLoading = false;
        state.history.error = action.payload;
      });

    builder
      .addCase(fetchInvoiceableBOQItems.pending, (state) => {
        state.invoiceableItems.isLoading = true;
        state.invoiceableItems.error = null;
      })
      .addCase(fetchInvoiceableBOQItems.fulfilled, (state, action) => {
        state.invoiceableItems.isLoading = false;
        state.invoiceableItems.items = action.payload;
      })
      .addCase(fetchInvoiceableBOQItems.rejected, (state, action) => {
        state.invoiceableItems.isLoading = false;
        state.invoiceableItems.error = action.payload;
      });
  },
});

export const {
  setInvoices,
  setSelectedInvoice,
  updateInvoiceInList,
  removeInvoice,
  setLoading,
  setError,
  clearError,
  clearInvoiceableBOQItems,
  clearInvoiceHistory,
} = invoicesSlice.actions;

// Selectors
export const selectInvoices = (state) => state.invoices.items;
export const selectSelectedInvoice = (state) => state.invoices.selectedInvoice;
export const selectInvoicesLoading = (state) => state.invoices.isLoading;
export const selectInvoicesError = (state) => state.invoices.error;
export const selectInvoiceableBOQItems        = (state) => state.invoices.invoiceableItems.items;
export const selectInvoiceableBOQItemsLoading = (state) => state.invoices.invoiceableItems.isLoading;
export const selectInvoiceableBOQItemsError   = (state) => state.invoices.invoiceableItems.error;
export const selectInvoiceHistory        = (state) => state.invoices.history.items;
export const selectInvoiceHistoryLoading = (state) => state.invoices.history.isLoading;
export const selectInvoiceHistoryError   = (state) => state.invoices.history.error;

export const selectInvoicesByStatus = (status) => (state) =>
  state.invoices.items.filter((inv) => inv.status === status);

export const selectInvoicesByProject = (projectId) => (state) =>
  state.invoices.items.filter((inv) => inv.projectId === projectId);

export default invoicesSlice.reducer;
