import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';
import { identityRepository } from '@/repositories/identityRepository';
import { mapBlockedRun, mapProblem } from '@/models/workflow';

export const fetchDefinitions = createAsyncThunk(
  'workflow/fetchDefinitions',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return await workflowRepository.getDefinitions(filters);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load workflows.');
    }
  }
);

export const fetchDefinition = createAsyncThunk(
  'workflow/fetchDefinition',
  async (query, { rejectWithValue }) => {
    try {
      return await workflowRepository.getDefinition(query);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load this workflow.');
    }
  }
);

export const fetchDefinitionVersions = createAsyncThunk(
  'workflow/fetchDefinitionVersions',
  async (code, { rejectWithValue }) => {
    try {
      return await workflowRepository.getDefinitionVersions(code);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load version history.');
    }
  }
);

export const saveDefinition = createAsyncThunk(
  'workflow/saveDefinition',
  async (payload, { rejectWithValue }) => {
    try {
      return await workflowRepository.saveDefinition(payload);
    } catch (err) {
      return rejectWithValue({
        message: err.message || 'Failed to save this workflow.',
        status: err.status ?? null,
        code: err.code ?? null,
      });
    }
  }
);

function publishRefusal(err, fallback) {
  const body = err.body ?? {};
  return {
    message: err.message || fallback,
    status: err.status ?? null,
    code: err.code ?? null,
    problems: (body.Problems ?? body.problems ?? []).map(mapProblem),
    blockedRuns: (body.BlockedRuns ?? body.blockedRuns ?? []).map(mapBlockedRun),
  };
}

export const publishDefinition = createAsyncThunk(
  'workflow/publishDefinition',
  async (code, { rejectWithValue }) => {
    try {
      return await workflowRepository.publishDefinition(code);
    } catch (err) {
      return rejectWithValue(publishRefusal(err, 'Failed to publish this workflow.'));
    }
  }
);

export const activateDefinition = createAsyncThunk(
  'workflow/activateDefinition',
  async (definitionId, { rejectWithValue }) => {
    try {
      await workflowRepository.activateDefinition(definitionId);
      return definitionId;
    } catch (err) {
      return rejectWithValue(publishRefusal(err, 'Failed to make this version live.'));
    }
  }
);

export const discardDraft = createAsyncThunk(
  'workflow/discardDraft',
  async (draftId, { rejectWithValue }) => {
    try {
      await workflowRepository.deleteDefinition(draftId);
      return draftId;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to discard the draft.');
    }
  }
);

export const fetchFields = createAsyncThunk(
  'workflow/fetchFields',
  async (targetTypeKey, { rejectWithValue }) => {
    try {
      const fields = await workflowRepository.getFields(targetTypeKey);
      return { targetTypeKey, fields };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load the field catalog.');
    }
  }
);

export const fetchBuilderCatalogs = createAsyncThunk(
  'workflow/fetchBuilderCatalogs',
  async (_, { rejectWithValue }) => {
    try {
      const [events, actions, targetTypes] = await Promise.all([
        workflowRepository.getEvents(),
        workflowRepository.getActions(),
        workflowRepository.getTargetTypes(),
      ]);
      return { events, actions, targetTypes };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load builder options.');
    }
  }
);

export const resolveAssignees = createAsyncThunk(
  'workflow/resolveAssignees',
  async (ids, { getState, rejectWithValue }) => {
    const cached = getState().workflow.assigneesById;
    const requested = [...new Set(ids)].filter((id) => id && !cached[id]);
    if (requested.length === 0) return { requested: [], found: [] };

    try {
      const found = await identityRepository.getAuthorizedUsers({ ids: requested });
      return { requested, found };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to look up assignees.');
    }
  }
);

export const fetchApiDomains = createAsyncThunk(
  'workflow/fetchApiDomains',
  async (enabledOnly = null, { rejectWithValue }) => {
    try {
      return await workflowRepository.getApiDomains(enabledOnly);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load approved API domains.');
    }
  }
);

export const approveApiDomain = createAsyncThunk(
  'workflow/approveApiDomain',
  async (args, { dispatch, rejectWithValue }) => {
    try {
      await workflowRepository.approveApiDomain(args);
      return await dispatch(fetchApiDomains()).unwrap();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to approve this host.');
    }
  }
);

export const setApiDomainEnabled = createAsyncThunk(
  'workflow/setApiDomainEnabled',
  async (args, { rejectWithValue }) => {
    try {
      await workflowRepository.setApiDomainEnabled(args);
      return args;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update this host.');
    }
  }
);

export const fetchSettings = createAsyncThunk(
  'workflow/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await workflowRepository.getSettings();
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to load the engine settings.');
    }
  }
);

export const updateSetting = createAsyncThunk(
  'workflow/updateSetting',
  async (args, { rejectWithValue }) => {
    try {
      return await workflowRepository.updateSetting(args);
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to save this setting.');
    }
  }
);

const initialState = {
  definitions: [],
  isLoading: false,
  error: null,

  current: null,
  currentLoading: false,
  currentError: null,

  isSaving: false,
  saveError: null,

  versions: [],
  versionsLoading: false,

  fieldsByTargetType: {},
  fieldsLoading: false,

  events: [],
  actions: [],
  targetTypes: [],
  catalogsLoaded: false,

  apiDomains: [],
  apiDomainsLoading: false,

  settings: [],
  settingsLoading: false,
  settingsError: null,
  savingSettingKey: null,

  assigneesById: {},
};

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    clearCurrentDefinition(state) {
      state.current = null;
      state.currentError = null;
    },
    clearSaveError(state) {
      state.saveError = null;
    },
    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchDefinitions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDefinitions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.definitions = action.payload;
      })
      .addCase(fetchDefinitions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchDefinition.pending, (state) => {
        state.currentLoading = true;
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchDefinition.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchDefinition.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError = action.payload;
      });

    builder
      .addCase(fetchDefinitionVersions.pending, (state) => {
        state.versionsLoading = true;
      })
      .addCase(fetchDefinitionVersions.fulfilled, (state, action) => {
        state.versionsLoading = false;
        state.versions = action.payload;
      })
      .addCase(fetchDefinitionVersions.rejected, (state) => {
        state.versionsLoading = false;
      });

    builder
      .addCase(saveDefinition.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(saveDefinition.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(saveDefinition.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload;
      });

    builder
      .addCase(fetchFields.pending, (state) => {
        state.fieldsLoading = true;
      })
      .addCase(fetchFields.fulfilled, (state, action) => {
        state.fieldsLoading = false;
        state.fieldsByTargetType[action.payload.targetTypeKey] = action.payload.fields;
      })
      .addCase(fetchFields.rejected, (state) => {
        state.fieldsLoading = false;
      });

    builder.addCase(fetchBuilderCatalogs.fulfilled, (state, action) => {
      state.events = action.payload.events;
      state.actions = action.payload.actions;
      state.targetTypes = action.payload.targetTypes;
      state.catalogsLoaded = true;
    });

    builder
      .addCase(fetchApiDomains.pending, (state) => {
        state.apiDomainsLoading = true;
      })
      .addCase(fetchApiDomains.fulfilled, (state, action) => {
        state.apiDomainsLoading = false;
        state.apiDomains = action.payload;
      })
      .addCase(fetchApiDomains.rejected, (state) => {
        state.apiDomainsLoading = false;
      });

    builder
      .addCase(fetchSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload;
      });

    builder
      .addCase(updateSetting.pending, (state, action) => {
        state.savingSettingKey = action.meta.arg.key;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.savingSettingKey = null;
        state.settings = state.settings.map((row) =>
          row.key === action.payload.key ? action.payload : row
        );
      })
      .addCase(updateSetting.rejected, (state) => {
        state.savingSettingKey = null;
      });

    builder.addCase(resolveAssignees.fulfilled, (state, action) => {
      const { requested, found } = action.payload;

      for (const user of found) {
        if (user.id) state.assigneesById[user.id] = user;
      }

      for (const id of requested) {
        if (!state.assigneesById[id]) state.assigneesById[id] = { id, missing: true };
      }
    });

    builder.addCase(approveApiDomain.fulfilled, (state, action) => {
      state.apiDomains = action.payload;
    });

    builder.addCase(setApiDomainEnabled.fulfilled, (state, action) => {
      const row = state.apiDomains.find((d) => d.id === action.payload.domainId);
      if (row) row.isEnabled = action.payload.isEnabled;
    });
  },
});

export const { clearCurrentDefinition, clearSaveError, clearError } = workflowSlice.actions;

export const selectDefinitions = (state) => state.workflow.definitions;
export const selectDefinitionsLoading = (state) => state.workflow.isLoading;
export const selectDefinitionsError = (state) => state.workflow.error;

export const selectCurrentDefinition = (state) => state.workflow.current;
export const selectCurrentDefinitionLoading = (state) => state.workflow.currentLoading;
export const selectCurrentDefinitionError = (state) => state.workflow.currentError;

export const selectIsSaving = (state) => state.workflow.isSaving;
export const selectSaveError = (state) => state.workflow.saveError;

export const selectVersions = (state) => state.workflow.versions;
export const selectVersionsLoading = (state) => state.workflow.versionsLoading;

export const selectEvents = (state) => state.workflow.events;
export const selectActions = (state) => state.workflow.actions;
export const selectTargetTypes = (state) => state.workflow.targetTypes;
export const selectCatalogsLoaded = (state) => state.workflow.catalogsLoaded;

export const selectAssigneesById = (state) => state.workflow.assigneesById;
export const selectApiDomains = (state) => state.workflow.apiDomains;
export const selectApiDomainsLoading = (state) => state.workflow.apiDomainsLoading;

export const selectFieldsByTargetType = (state) => state.workflow.fieldsByTargetType;

const EMPTY_FIELDS = [];
export const makeSelectFields = (targetTypeKey) =>
  createSelector([selectFieldsByTargetType], (byType) => byType[targetTypeKey] ?? EMPTY_FIELDS);

export const makeSelectFilterableFields = (targetTypeKey) =>
  createSelector([makeSelectFields(targetTypeKey)], (fields) => fields.filter((f) => f.filterable));

export const selectEnabledApiDomains = createSelector([selectApiDomains], (domains) =>
  domains.filter((d) => d.isEnabled)
);

export const selectSettings = (state) => state.workflow.settings;
export const selectSettingsLoading = (state) => state.workflow.settingsLoading;
export const selectSettingsError = (state) => state.workflow.settingsError;
export const selectSavingSettingKey = (state) => state.workflow.savingSettingKey;

export default workflowSlice.reducer;
