import { configureStore } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';

import authReducer from '@/store/slices/authSlice';
import projectsReducer from '@/store/slices/projectsSlice';
import boqReducer from '@/store/slices/boqSlice';
import invoicesReducer from '@/store/slices/invoicesSlice';
import workflowReducer from '@/store/slices/workflowSlice';
import notificationsReducer from '@/store/slices/notificationsSlice';
import uiReducer from '@/store/slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    boq: boqReducer,
    invoices: invoicesReducer,
    workflow: workflowReducer,
    notifications: notificationsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow non-serializable values in actions if required (e.g., Date objects
      // in payloads). Tighten this list for production.
      serializableCheck: {
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * Typed useSelector bound to the store's RootState shape.
 * Usage: const user = useAppSelector(selectCurrentUser);
 */
export const useAppSelector = useSelector;

/**
 * Typed useDispatch bound to the store's AppDispatch type.
 * Usage: const dispatch = useAppDispatch();
 */
export const useAppDispatch = () => useDispatch();
