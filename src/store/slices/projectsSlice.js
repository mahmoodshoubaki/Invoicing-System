import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectRepository } from '@/repositories/projectRepository';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await projectRepository.getProjects(filters);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch projects.');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id, { getState, rejectWithValue }) => {
    const existing = getState().projects.items.find((p) => p.id === id);
    if (existing) return existing;
    try {
      return await projectRepository.getProject(id);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch project.');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (data, { rejectWithValue }) => {
    try {
      return await projectRepository.createProject(data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create project.');
    }
  }
);

export const updateProjectById = createAsyncThunk(
  'projects/updateProjectById',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await projectRepository.updateProject(id, data);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update project.');
    }
  }
);

export const deleteProjectById = createAsyncThunk(
  'projects/deleteProjectById',
  async (id, { rejectWithValue }) => {
    try {
      await projectRepository.deleteProject(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete project.');
    }
  }
);

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  items: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: '',
    businessUnit: '',
  },
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action) {
      state.items = action.payload;
      state.error = null;
    },

    addProject(state, action) {
      state.items.unshift(action.payload);
    },

    updateProject(state, action) {
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      }
      if (state.selectedProject?.id === action.payload.id) {
        state.selectedProject = { ...state.selectedProject, ...action.payload };
      }
    },

    removeProject(state, action) {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.selectedProject?.id === action.payload) {
        state.selectedProject = null;
      }
    },

    setSelectedProject(state, action) {
      state.selectedProject = action.payload;
    },

    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Payload: Partial<{ search: string, status: string, businessUnit: string }>
     */
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters(state) {
      state.filters = initialState.filters;
    },
  },

  extraReducers: (builder) => {
    // fetchProjectById
    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.selectedProject = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchProjects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createProject
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // updateProjectById
    builder
      .addCase(updateProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
        if (state.selectedProject?.id === action.payload.id) {
          state.selectedProject = action.payload;
        }
      })
      .addCase(updateProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // deleteProjectById
    builder
      .addCase(deleteProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((p) => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload) {
          state.selectedProject = null;
        }
      })
      .addCase(deleteProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setSelectedProject,
  setLoading,
  setError,
  setFilters,
  clearFilters,
} = projectsSlice.actions;

// Selectors
export const selectProjects = (state) => state.projects.items;
export const selectSelectedProject = (state) => state.projects.selectedProject;
export const selectProjectsLoading = (state) => state.projects.isLoading;
export const selectProjectsError = (state) => state.projects.error;
export const selectProjectFilters = (state) => state.projects.filters;

/** Returns projects filtered by the current filters state. */
export const selectFilteredProjects = (state) => {
  const { items, filters } = state.projects;
  return items.filter((p) => {
    if (
      filters.search &&
      !p.projectName?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !p.clientName?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !p.projectCode?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.status && p.status !== filters.status) return false;
    if (filters.businessUnit && p.businessUnit !== filters.businessUnit) return false;
    return true;
  });
};

export default projectsSlice.reducer;
