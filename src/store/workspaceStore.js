import { create } from 'zustand';
import workspaceService from '../services/workspaceService';

export const useWorkspaceStore = create((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  loading: false,
  error: null,
  realtimeSubscription: null,

  // Create workspace
  createWorkspace: async (workspaceData) => {
    try {
      set({ loading: true, error: null });
      const workspace = await workspaceService.createWorkspace(workspaceData);
      const normalized = normalizeWorkspace(workspace);
      set((state) => ({
        workspaces: [normalized, ...state.workspaces],
        currentWorkspace: normalized,
        loading: false,
      }));
      return workspace;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Get workspace
  getWorkspace: async (workspaceId) => {
    try {
      set({ loading: true, error: null });
      const workspace = await workspaceService.getWorkspace(workspaceId);
      const normalized = normalizeWorkspace(workspace);
      set({ currentWorkspace: normalized, loading: false });
      return normalized;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Get user workspaces
  getUserWorkspaces: async (userId) => {
    try {
      set({ loading: true, error: null });
      const response = await workspaceService.getUserWorkspaces(userId);
      const docs = (response.documents || []).map(normalizeWorkspace);
      set({ workspaces: docs, loading: false });
      return docs;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Join workspace
  joinWorkspace: async (workspaceId, userId, userName) => {
    try {
      set({ loading: true, error: null });
      const workspace = await workspaceService.joinWorkspace(workspaceId, userId, userName);
      const normalized = normalizeWorkspace(workspace);
      set({ currentWorkspace: normalized, loading: false });
      return normalized;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Leave workspace
  leaveWorkspace: async (workspaceId, userId) => {
    try {
      await workspaceService.leaveWorkspace(workspaceId, userId);
      set({ currentWorkspace: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete workspace (owner only)
  deleteWorkspace: async (workspaceId) => {
    try {
      set({ loading: true, error: null });
      await workspaceService.deleteWorkspace(workspaceId);
      set((state) => ({
        workspaces: state.workspaces.filter(w => w.$id !== workspaceId),
        currentWorkspace: null,
        loading: false,
      }));
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Update workspace settings
  updateWorkspaceSettings: async (workspaceId, settings) => {
    try {
      const workspace = await workspaceService.updateWorkspaceSettings(workspaceId, settings);
      const normalized = normalizeWorkspace(workspace);
      set({ currentWorkspace: normalized });
      return normalized;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Subscribe to workspace updates
  subscribeToWorkspace: (workspaceId) => {
    const unsubscribe = get().realtimeSubscription;
    if (unsubscribe) unsubscribe();

    const subscription = workspaceService.subscribeToWorkspace(workspaceId, (response) => {
      if (response.events.includes('databases.*.collections.*.documents.*.update')) {
        set({ currentWorkspace: response.payload });
      }
    });

    set({ realtimeSubscription: () => subscription() });
  },

  // Unsubscribe from workspace updates
  unsubscribeFromWorkspace: () => {
    const unsubscribe = get().realtimeSubscription;
    if (unsubscribe) {
      unsubscribe();
      set({ realtimeSubscription: null });
    }
  },

  // Set current workspace
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  // Clear error
  clearError: () => set({ error: null }),
}));

// Helper to normalize workspace data (parse JSON fields)
function normalizeWorkspace(workspace) {
  if (!workspace) return workspace;

  const copy = { ...workspace };

  try {
    if (typeof copy.settings === 'string') {
      copy.settings = JSON.parse(copy.settings);
    }
  } catch (e) {
    copy.settings = copy.settings || {};
  }

  // memberNames should remain a string (components parse it), but ensure it's defined
  if (!copy.memberNames) copy.memberNames = JSON.stringify({});

  return copy;
}
