import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { identityRepository } from '@/repositories/identityRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchAllPermissions = createAsyncThunk(
  'roles/fetchAllPermissions',
  async (_, { rejectWithValue }) => {
    try {
      return await identityRepository.getAllPermissions();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch permissions.');
    }
  }
);

export const fetchAllRoles = createAsyncThunk(
  'roles/fetchAllRoles',
  async (_, { rejectWithValue }) => {
    try {
      return await identityRepository.getAllRoles();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch roles.');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async (data, { rejectWithValue }) => {
    try {
      return await identityRepository.updateRole(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update role.');
    }
  }
);

export const createRole = createAsyncThunk(
  'roles/createRole',
  async (data, { rejectWithValue }) => {
    try {
      return await identityRepository.createRole(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create role.');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (roleId, { rejectWithValue }) => {
    try {
      return await identityRepository.deleteRole(roleId);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete role.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  permissions: [],
  permissionsLoading: false,
  permissionsError: null,
  roles: [],
  rolesLoading: false,
  rolesError: null,
};

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPermissions.pending, (state) => {
        state.permissionsLoading = true;
        state.permissionsError = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.permissionsLoading = false;
        state.permissionsError = action.payload;
      })
      .addCase(fetchAllRoles.pending, (state) => {
        state.rolesLoading = true;
        state.rolesError = null;
      })
      .addCase(fetchAllRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchAllRoles.rejected, (state, action) => {
        state.rolesLoading = false;
        state.rolesError = action.payload;
      })
      .addCase(updateRole.pending, (state) => {
        state.rolesError = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.rolesError = action.payload;
      })
      .addCase(createRole.pending, (state) => {
        state.rolesError = null;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.rolesError = action.payload;
      })
      .addCase(deleteRole.pending, (state) => {
        state.rolesError = null;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.rolesError = action.payload;
      });
  },
});

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectPermissions = (state) => state.roles.permissions;
export const selectPermissionsLoading = (state) => state.roles.permissionsLoading;
export const selectRoles = (state) => state.roles.roles;
export const selectRolesLoading = (state) => state.roles.rolesLoading;

/**
 * Permissions grouped by their module, in the order they arrive from the
 * API — no fixed module list on the frontend.
 * Usage: const grouped = useSelector(selectPermissionsByModule);
 */
export const selectPermissionsByModule = (state) => {
  const groups = {};
  state.roles.permissions.forEach((perm) => {
    if (!groups[perm.module]) groups[perm.module] = [];
    groups[perm.module].push(perm);
  });
  return groups;
};

export default rolesSlice.reducer;
