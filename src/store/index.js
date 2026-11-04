import { configureStore } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';

import authReducer from '@/store/slices/authSlice';
import projectsReducer from '@/store/slices/projectsSlice';
import boqReducer from '@/store/slices/boqSlice';
import invoicesReducer from '@/store/slices/invoicesSlice';
import workflowReducer from '@/store/slices/workflowSlice';
import workflowRunsReducer from '@/store/slices/workflowRunsSlice';
import workflowTasksReducer from '@/store/slices/workflowTasksSlice';
import notificationsReducer from '@/store/slices/notificationsSlice';
import uiReducer from '@/store/slices/uiSlice';
import lookupsReducer from '@/store/slices/lookupsSlice';
import rolesReducer from '@/store/slices/rolesSlice';
import usersReducer from '@/store/slices/usersSlice';
import groupsReducer from '@/store/slices/groupsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    boq: boqReducer,
    invoices: invoicesReducer,
    workflow: workflowReducer,
    workflowRuns: workflowRunsReducer,
    workflowTasks: workflowTasksReducer,
    notifications: notificationsReducer,
    ui: uiReducer,
    lookups: lookupsReducer,
    roles: rolesReducer,
    users: usersReducer,
    groups: groupsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: [
          'payload.createdAt',
          'payload.updatedAt',
          'meta.arg.attachments',
          'meta.arg.attachmentsToAdd',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const useAppSelector = useSelector;

export const useAppDispatch = () => useDispatch();
