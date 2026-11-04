import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_CURRENCY, DEFAULT_LANGUAGE } from '@/constants/appConfig';

const initialState = {
  sidebarOpen: true,
  language: DEFAULT_LANGUAGE, // 'en' | 'ar'
  currency: DEFAULT_CURRENCY,
  currencySymbol: '\u{0024}', // Default symbol for USD
  theme: 'light',       // 'light' | 'dark'
  activeModal: null,    // string modal ID or null
  toasts: [],           // [{ id, type, title, message, duration }]
};

let toastIdCounter = 1;

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },

    setLanguage(state, action) {
      state.language = action.payload;
    },
    setCurrency(state, action) {
      state.currency = action.payload;
    },
    setCurrencySymbol(state, action) {
      state.currencySymbol = action.payload;
    },

    setTheme(state, action) {
      state.theme = action.payload;
    },

    openModal(state, action) {
      state.activeModal = action.payload;
    },

    closeModal(state) {
      state.activeModal = null;
    },

    addToast(state, action) {
      const toast = {
        id: `toast-${toastIdCounter++}`,
        type: action.payload.type ?? 'info',
        title: action.payload.title ?? null,
        message: action.payload.message,
        duration: action.payload.duration ?? 4000,
      };
      state.toasts.push(toast);
    },

    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setLanguage,
  setCurrency,
  setCurrencySymbol,
  setTheme,
  openModal,
  closeModal,
  addToast,
  removeToast,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectLanguage = (state) => state.ui.language;
export const selectTheme = (state) => state.ui.theme;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectToasts = (state) => state.ui.toasts;
export const selectIsRTL = (state) => state.ui.language === 'ar';
export const selectCurrency = (state) => state.ui.currency;
export const selectCurrencySymbol = (state) => state.ui.currencySymbol;

export default uiSlice.reducer;
