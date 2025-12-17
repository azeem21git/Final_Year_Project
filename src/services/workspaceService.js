import { databases, realtime } from '../lib/appwriteConfig';
import { DATABASE_ID, WORKSPACES_COLLECTION_ID } from '../lib/appwriteConfig';
import { ID, Query } from 'appwrite';

const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const USE_MOCK = !APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID.includes('your');

let workspaceServiceInstance = null;

if (!USE_MOCK) {
  class WorkspaceService {
  // Create a new workspace
  async createWorkspace({ name, description, ownerId, ownerName }) {
    try {
      const workspaceId = ID.unique();
      const workspace = await databases.createDocument(
        DATABASE_ID,
        WORKSPACES_COLLECTION_ID,
        workspaceId,
        {
          name,
          // description: description || '', // Add 'description' attribute in Appwrite first
          ownerId,
          ownerName,
          members: [ownerId],
          memberNames: JSON.stringify({ [ownerId]: ownerName }), // Stored as JSON string
          // createdAt: new Date().toISOString(), // Add 'createdAt' attribute (DateTime) in Appwrite first
          settings: JSON.stringify({ // Stored as JSON string
            voiceChatEnabled: true,
            voiceChatMuted: [],
            textChatEnabled: true,
          })
        }
      );
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  // Get workspace by ID
  async getWorkspace(workspaceId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        WORKSPACES_COLLECTION_ID,
        workspaceId
      );
    } catch (error) {
      console.error('Error getting workspace:', error);
      throw error;
    }
  }

  // Get user's workspaces
  async getUserWorkspaces(userId) {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        WORKSPACES_COLLECTION_ID,
        [
          Query.contains('members', userId)
          // Note: Removed orderDesc - add createdAt attribute in Appwrite to enable sorting
        ]
      );
    } catch (error) {
      console.error('Error getting user workspaces:', error);
      throw error;
    }
  }

  // Join workspace
  async joinWorkspace(workspaceId, userId, userName) {
    try {
      const workspace = await this.getWorkspace(workspaceId);
      
      if (!workspace.members.includes(userId)) {
        const updatedMembers = [...workspace.members, userId];
        const currentMemberNames = JSON.parse(workspace.memberNames || '{}');
        const updatedMemberNames = { 
          ...currentMemberNames, 
          [userId]: userName 
        };
        
        return await databases.updateDocument(
          DATABASE_ID,
          WORKSPACES_COLLECTION_ID,
          workspaceId,
          {
            members: updatedMembers,
            memberNames: JSON.stringify(updatedMemberNames)
          }
        );
      }
      return workspace;
    } catch (error) {
      console.error('Error joining workspace:', error);
      throw error;
    }
  }

  // Leave workspace
  async leaveWorkspace(workspaceId, userId) {
    try {
      const workspace = await this.getWorkspace(workspaceId);
      const updatedMembers = workspace.members.filter(id => id !== userId);
      
      const currentMemberNames = JSON.parse(workspace.memberNames || '{}');
      const updatedMemberNames = { ...currentMemberNames };
      delete updatedMemberNames[userId];
      
      return await databases.updateDocument(
        DATABASE_ID,
        WORKSPACES_COLLECTION_ID,
        workspaceId,
        {
          members: updatedMembers,
          memberNames: JSON.stringify(updatedMemberNames)
        }
      );
    } catch (error) {
      console.error('Error leaving workspace:', error);
      throw error;
    }
  }

  // Update workspace settings
  async updateWorkspaceSettings(workspaceId, settings) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        WORKSPACES_COLLECTION_ID,
        workspaceId,
        { settings }
      );
    } catch (error) {
      console.error('Error updating workspace settings:', error);
      throw error;
    }
  }

  // Subscribe to workspace updates (real-time)
  subscribeToWorkspace(workspaceId, callback) {
    return realtime.subscribe(
      `databases.${DATABASE_ID}.collections.${WORKSPACES_COLLECTION_ID}.documents.${workspaceId}`,
      callback
    );
  }

  // Delete workspace (owner only)
  async deleteWorkspace(workspaceId) {
    try {
      return await databases.deleteDocument(
        DATABASE_ID,
        WORKSPACES_COLLECTION_ID,
        workspaceId
      );
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }
  }

  workspaceServiceInstance = new WorkspaceService();
} else {
  // Mock implementation using localStorage for local development
  class MockWorkspaceService {
    _storageKey = 'mock_workspaces_v1';

    _read() {
      try {
        const raw = localStorage.getItem(this._storageKey);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    _write(list) {
      localStorage.setItem(this._storageKey, JSON.stringify(list));
    }

    async createWorkspace({ name, description, ownerId, ownerName }) {
      const list = this._read();
      const workspaceId = `mock_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const workspace = {
        $id: workspaceId,
        name,
        description: description || '',
        ownerId,
        ownerName,
        members: [ownerId],
        memberNames: JSON.stringify({ [ownerId]: ownerName }),
        settings: JSON.stringify({ voiceChatEnabled: true, voiceChatMuted: [], textChatEnabled: true }),
      };
      list.push(workspace);
      this._write(list);
      return workspace;
    }

    async getWorkspace(workspaceId) {
      const list = this._read();
      return list.find(w => w.$id === workspaceId) || null;
    }

    async getUserWorkspaces(userId) {
      const list = this._read();
      const docs = list.filter(w => (w.members || []).includes(userId));
      return { documents: docs };
    }

    async joinWorkspace(workspaceId, userId, userName) {
      const list = this._read();
      const idx = list.findIndex(w => w.$id === workspaceId);
      if (idx === -1) throw new Error('Workspace not found');
      const workspace = list[idx];
      if (!workspace.members.includes(userId)) {
        workspace.members.push(userId);
        const current = JSON.parse(workspace.memberNames || '{}');
        current[userId] = userName;
        workspace.memberNames = JSON.stringify(current);
        list[idx] = workspace;
        this._write(list);
      }
      return workspace;
    }

    async leaveWorkspace(workspaceId, userId) {
      const list = this._read();
      const idx = list.findIndex(w => w.$id === workspaceId);
      if (idx === -1) throw new Error('Workspace not found');
      const workspace = list[idx];
      workspace.members = (workspace.members || []).filter(id => id !== userId);
      const current = JSON.parse(workspace.memberNames || '{}');
      delete current[userId];
      workspace.memberNames = JSON.stringify(current);
      list[idx] = workspace;
      this._write(list);
      return workspace;
    }

    async updateWorkspaceSettings(workspaceId, settings) {
      const list = this._read();
      const idx = list.findIndex(w => w.$id === workspaceId);
      if (idx === -1) throw new Error('Workspace not found');
      const workspace = list[idx];
      workspace.settings = JSON.stringify(settings);
      list[idx] = workspace;
      this._write(list);
      return workspace;
    }

    subscribeToWorkspace(/*workspaceId, callback*/) {
      // No-op for mock; return a function matching the real API
      // The real SDK returns a function-like subscription; keep same shape.
      return () => {
        // unsubscribe no-op
      };
    }

    async deleteWorkspace(workspaceId) {
      const list = this._read();
      const newList = list.filter(w => w.$id !== workspaceId);
      this._write(newList);
      return { success: true };
    }
  }

  workspaceServiceInstance = new MockWorkspaceService();
}

export default workspaceServiceInstance;
