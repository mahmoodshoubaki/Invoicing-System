import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  language: 'en',       // 'en' | 'ar'
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

    /**
     * Payload: 'en' | 'ar'
     */
    setLanguage(state, action) {
      state.language = action.payload;
    },

    /**
     * Payload: 'light' | 'dark'
     */
    setTheme(state, action) {
      state.theme = action.payload;
    },

    /**
     * Open a modal by ID.
     * Payload: string
     */
    openModal(state, action) {
      state.activeModal = action.payload;
    },

    closeModal(state) {
      state.activeModal = null;
    },

    /**
     * Add a toast notification.
     * Payload: { type?: 'success'|'error'|'warning'|'info', title?: string, message: string, duration?: number }
     */
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

    /**
     * Remove a toast by ID.
     * Payload: string (toast id)
     */
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setLanguage,
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

export default uiSlice.reducer;
