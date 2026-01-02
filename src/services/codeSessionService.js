import { databases, realtime } from '../lib/appwriteConfig';
import { DATABASE_ID, CODE_SESSIONS_COLLECTION_ID } from '../lib/appwriteConfig';
import { ID, Query } from 'appwrite';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const USE_MOCK = !APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID.includes('your');

let codeSessionServiceInstance = null;

if (!USE_MOCK) {
  class CodeSessionService {
  // Create a new code session (IDE instance)
  async createCodeSession({ workspaceId, userId, userName, language, title }) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        CODE_SESSIONS_COLLECTION_ID,
        ID.unique(),
        {
          workspaceId,
          userId,
          userName,
          language,
          title: title || `${language} Session`,
          code: this.getDefaultCode(language),
          // cursorPositions: {}, // Add 'cursorPositions' attribute (String, size 65535) for JSON
          // selections: {}, // Add 'selections' attribute (String, size 65535) for JSON
          // createdAt: new Date().toISOString(), // Add 'createdAt' attribute (DateTime) in Appwrite first
          // lastModified: new Date().toISOString() // Add 'lastModified' attribute (DateTime) in Appwrite first
        }
      );
    } catch (error) {
      console.error('Error creating code session:', error);
      throw error;
    }
  }

  // Get default code template for language
  getDefaultCode(language) {
    const templates = {
      javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
      typescript: '// Write your TypeScript code here\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);',
      python: '# Write your Python code here\nprint("Hello, World!")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
      cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
      go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}',
      rust: 'fn main() {\n    println!("Hello, World!");\n}',
      html: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>',
      css: '/* Write your CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}',
    };
    return templates[language] || '// Start coding...';
  }

  // Get code session by ID
  async getCodeSession(sessionId) {
    try {
      return await databases.getDocument(
        DATABASE_ID,
        CODE_SESSIONS_COLLECTION_ID,
        sessionId
      );
    } catch (error) {
      console.error('Error getting code session:', error);
      throw error;
    }
  }

  // Get all code sessions for a workspace
  async getWorkspaceCodeSessions(workspaceId) {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        CODE_SESSIONS_COLLECTION_ID,
        [
          Query.equal('workspaceId', workspaceId)
          // Note: Removed orderDesc - add lastModified attribute in Appwrite to enable sorting
        ]
      );
    } catch (error) {
      console.error('Error getting workspace code sessions:', error);
      throw error;
    }
  }

  // Update code content
  async updateCode(sessionId, code) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        CODE_SESSIONS_COLLECTION_ID,
        sessionId,
        {
          code,
          // lastModified: new Date().toISOString() // Add 'lastModified' attribute (DateTime) in Appwrite first
        }
      );
    } catch (error) {
      console.error('Error updating code:', error);
      throw error;
    }
  }

  // Update cursor position
  async updateCursorPosition(sessionId, userId, position) {
    // Note: Requires 'cursorPositions' attribute (String, size 65535) in Appwrite
    // Temporarily disabled until attribute is created
    return Promise.resolve();
    
    // try {
    //   const session = await this.getCodeSession(sessionId);
    //   const updatedCursors = {
    //     ...session.cursorPositions,
    //     [userId]: position
    //   };
    //   
    //   return await databases.updateDocument(
    //     DATABASE_ID,
    //     CODE_SESSIONS_COLLECTION_ID,
    //     sessionId,
    //     { cursorPositions: updatedCursors }
    //   );
    // } catch (error) {
    //   console.error('Error updating cursor position:', error);
    //   throw error;
    // }
  }

  // Update selection
  async updateSelection(sessionId, userId, selection) {
    // Note: Requires 'selections' attribute (String, size 65535) in Appwrite
    // Temporarily disabled until attribute is created
    return Promise.resolve();
    
    // try {
    //   const session = await this.getCodeSession(sessionId);
    //   const updatedSelections = {
    //     ...session.selections,
    //     [userId]: selection
    //   };
    //   
    //   return await databases.updateDocument(
    //     DATABASE_ID,
    //     CODE_SESSIONS_COLLECTION_ID,
    //     sessionId,
    //     { selections: updatedSelections }
    //   );
    // } catch (error) {
    //   console.error('Error updating selection:', error);
    //   throw error;
    // }
  }

    // Subscribe to code session updates (real-time)
    subscribeToCodeSession(sessionId, callback) {
      return realtime.subscribe(
        `databases.${DATABASE_ID}.collections.${CODE_SESSIONS_COLLECTION_ID}.documents.${sessionId}`,
        callback
      );
    }

    // Delete code session
    async deleteCodeSession(sessionId) {
    try {
      return await databases.deleteDocument(
        DATABASE_ID,
        CODE_SESSIONS_COLLECTION_ID,
        sessionId
      );
    } catch (error) {
      console.error('Error deleting code session:', error);
      throw error;
    }
  }
  }

  codeSessionServiceInstance = new CodeSessionService();
} else {
  class MockCodeSessionService {
    _storageKey = 'mock_codesessions_v1';

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

    createCodeSession({ workspaceId, userId, userName, language, title, code }) {
      const list = this._read();
      const session = {
        $id: `mock_session_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        workspaceId,
        userId,
        userName,
        language,
        title: title || `${language} Session`,
        code: code || this.getDefaultCode(language),
      };
      list.push(session);
      this._write(list);
      return session;
    }

    getDefaultCode(language) {
      const templates = {
        javascript: '// Write your JavaScript code here\nconsole.log("Hello, World!");',
        typescript: '// Write your TypeScript code here\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);',
        python: '# Write your Python code here\nprint("Hello, World!")',
      };
      return templates[language] || '// Start coding...';
    }

    async getCodeSession(sessionId) {
      const list = this._read();
      return list.find(s => s.$id === sessionId) || null;
    }

    async getWorkspaceCodeSessions(workspaceId) {
      const list = this._read();
      const docs = list.filter(s => s.workspaceId === workspaceId);
      return { documents: docs };
    }

    async updateCode(sessionId, code) {
      const list = this._read();
      const idx = list.findIndex(s => s.$id === sessionId);
      if (idx === -1) throw new Error('Session not found');
      list[idx].code = code;
      this._write(list);
      return list[idx];
    }

    async updateCursorPosition(sessionId, userId, position) {
      const list = this._read();
      const idx = list.findIndex(s => s.$id === sessionId);
      if (idx === -1) return null;
      const session = list[idx];
      session.cursorPositions = session.cursorPositions || {};
      session.cursorPositions[userId] = position;
      list[idx] = session;
      this._write(list);
      return session;
    }

    async updateSelection(sessionId, userId, selection) {
      const list = this._read();
      const idx = list.findIndex(s => s.$id === sessionId);
      if (idx === -1) return null;
      const session = list[idx];
      session.selections = session.selections || {};
      session.selections[userId] = selection;
      list[idx] = session;
      this._write(list);
      return session;
    }

    async deleteCodeSession(sessionId) {
      const list = this._read();
      const newList = list.filter(s => s.$id !== sessionId);
      this._write(newList);
      return { success: true };
    }

    subscribeToCodeSession(sessionId, callback) {
      // No real-time in mock; return a function to match SDK
      return () => {
        // unsubscribe no-op
      };
    }
  }

  codeSessionServiceInstance = new MockCodeSessionService();
}

export default codeSessionServiceInstance;
