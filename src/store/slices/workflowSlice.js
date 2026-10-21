import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { workflowRepository } from '@/repositories/workflowRepository';
import { identityRepository } from '@/repositories/identityRepository';
import { mapBlockedRun, mapProblem } from '@/models/workflow';

/**
 * Workflow definitions and the builder's reference data.
 *
 * Runs and tasks live in their own slices — they are independent domains with
 * their own loading lifecycles, and folding them in here would make every
 * task poll invalidate the builder's state.
 */

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

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
      /*
       * The ONE rejection in this module that is an object rather than a
       * string, because the caller genuinely branches on it: a stale save comes
       * back 409 and needs a different *offer* — reload and reapply — rather
       * than the server's sentence.
       *
       * **So it must never be rendered raw.** `saveDefinition.rejected` puts
       * this in `state.saveError`, which nothing reads today; if something ever
       * does, it has to take `.message`. Passing an object where React expects
       * a child throws, and that is exactly how `completeTask` broke My Tasks
       * on 2026-09-13.
       */
      return rejectWithValue({
        message: err.message || 'Failed to save this workflow.',
        status: err.status ?? null,
        // WF-052: somebody else saved, published or discarded the draft.
        code: err.code ?? null,
      });
    }
  }
);

/**
 * Why a publish or a go-back was refused, as an object the screen branches on
 * (2026-10-11): WF-053 carries the draft's `Problems`, WF-024 the `BlockedRuns`
 * that stopped it. Like saveDefinition's, **never render it raw** — take
 * `.message`.
 */
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

/** The draft becomes the next version, live. Resolves `{ definitionId, version }`. */
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

/** Makes an existing version live again. Rejects with the same object as a publish. */
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

/** Throws the draft away — DeleteDefinition with the draft's id. Rejects with the message. */
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

/**
 * The condition builder's field catalog, cached per target type — the builder
 * switches between them and refetching on every switch would make the operator
 * dropdown flicker for data that does not change.
 */
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

/** Events, actions and target types — the three builder dropdowns, fetched together. */
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

/**
 * Resolves the people a definition's `humanTask` steps are assigned to.
 *
 * Assignees are stored as bare GUIDs, so a loaded workflow arrives with ids and
 * no names. This looks up only the ids not already cached, using the endpoint's
 * `ids=` form — which returns people **whether or not they are still active**,
 * so a task assigned to somebody who has since left still shows their name
 * rather than a raw GUID.
 *
 * Kept apart from `usersSlice`, which holds the admin screen's full directory:
 * the builder's typeahead would otherwise keep overwriting that list with
 * search results.
 */
export const resolveAssignees = createAsyncThunk(
  'workflow/resolveAssignees',
  async (ids, { getState, rejectWithValue }) => {
    const cached = getState().workflow.assigneesById;
    const requested = [...new Set(ids)].filter((id) => id && !cached[id]);
    if (requested.length === 0) return { requested: [], found: [] };

    try {
      const found = await identityRepository.getAuthorizedUsers({ ids: requested });
      // `requested` comes back too, so the reducer can tell an id that resolved
      // to a deactivated person from one the directory no longer knows at all.
      // Both are unusable as assignees, for different reasons worth naming.
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
      // ApproveApiDomain's response body is documented only as "string" and its
      // meaning is unconfirmed, so refetch rather than guess at its shape.
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

/**
 * The engine's own limits.
 *
 * Reading them is `Workflows.Manage` — drawing a workflow needs to know what it
 * will be measured against. Changing one is `Workflows.ManageSettings`.
 */
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

/**
 * Change one limit.
 *
 * Returns just the row that changed, which is what the reducer merges — a
 * refetch would throw away anything else being edited on the same screen.
 */
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

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  definitions: [],
  isLoading: false,
  error: null,

  /** The definition open in the builder. */
  current: null,
  currentLoading: false,
  currentError: null,

  isSaving: false,
  saveError: null,

  versions: [],
  versionsLoading: false,

  /** Field catalog keyed by targetTypeKey — see fetchFields. */
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
  /** key currently being saved — one row spins without freezing the panel. */
  savingSettingKey: null,

  /** Assignee id -> user, filled on demand. See resolveAssignees. */
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

    // saveDefinition returns { id, code, version } — an identity, not a
    // definition. Nothing is merged into `current` from it: the builder either
    // stays on what the user is editing or reloads the saved version by id.
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

    // activateDefinition intentionally has no fulfilled case.
    //
    // Publishing changes two things at once — this version goes live and the
    // previous one stands down — and the id being activated belongs to a
    // *version*, which the definitions list does not carry. There is no row here
    // that can be honestly patched from it, so the caller refetches both the
    // version list and the definitions list instead. Anything less would leave
    // `activeVersion` stale while `isPublished` claimed otherwise.

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
        // Merge the one row that came back rather than refetching: another row
        // may be mid-edit on the same screen.
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

      // Every requested id gets an entry, so an id the directory did not return
      // is recorded as gone rather than looking merely unresolved — otherwise it
      // would be re-requested forever and never reported.
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

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

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

/** Fields for one target type. Returns a stable empty array when not yet loaded. */
const EMPTY_FIELDS = [];
export const makeSelectFields = (targetTypeKey) =>
  createSelector([selectFieldsByTargetType], (byType) => byType[targetTypeKey] ?? EMPTY_FIELDS);

/**
 * Only the fields a query or a schedule scan may search. Reading a field in a
 * condition is always allowed; searching on one is not.
 */
export const makeSelectFilterableFields = (targetTypeKey) =>
  createSelector([makeSelectFields(targetTypeKey)], (fields) => fields.filter((f) => f.filterable));

/** Approved hosts that are currently enabled — what an http.call may reach. */
export const selectEnabledApiDomains = createSelector([selectApiDomains], (domains) =>
  domains.filter((d) => d.isEnabled)
);

export const selectSettings = (state) => state.workflow.settings;
export const selectSettingsLoading = (state) => state.workflow.settingsLoading;
export const selectSettingsError = (state) => state.workflow.settingsError;
export const selectSavingSettingKey = (state) => state.workflow.savingSettingKey;

export default workflowSlice.reducer;
