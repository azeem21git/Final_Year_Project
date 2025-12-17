import { account, client } from '../lib/appwriteConfig';
import { ID, OAuthProvider } from 'appwrite';

const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const USE_MOCK = !APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID.includes('your');

// Simple in-memory mock user for local development when Appwrite isn't configured
const MOCK_USER = {
  $id: 'mock_user',
  name: 'Local Dev',
  email: 'dev@example.com',
};

let authServiceInstance = null;

if (USE_MOCK) {
  class MockAuthService {
    async createAccount({ email, password, name }) {
      console.warn('Using MockAuthService.createAccount — Appwrite not configured');
      // pretend account was created and log the user in
      localStorage.setItem('mock_user', JSON.stringify({ ...MOCK_USER, name, email }));
      return { ...MOCK_USER, name, email };
    }

    async login({ email }) {
      console.warn('Using MockAuthService.login — Appwrite not configured');
      const user = { ...MOCK_USER, email };
      localStorage.setItem('mock_user', JSON.stringify(user));
      return user;
    }

    async loginWithGithub() {
      console.warn('Using MockAuthService.loginWithGithub — Appwrite not configured');
      // emulate redirect by directly setting a mock user
      const user = { ...MOCK_USER, name: 'GitHub Dev' };
      localStorage.setItem('mock_user', JSON.stringify(user));
      window.location.href = `${window.location.origin}/workspaces`;
    }

    async getCurrentUser() {
      try {
        const raw = localStorage.getItem('mock_user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    async logout() {
      localStorage.removeItem('mock_user');
      return true;
    }

    async getUserPreferences() {
      return {};
    }

    async updateUserPreferences(prefs) {
      return prefs;
    }
  }

  authServiceInstance = new MockAuthService();
} else {
  class AuthService {
    // Create account with email and password
    async createAccount({ email, password, name }) {
      try {
        const userAccount = await account.create(
          ID.unique(),
          email,
          password,
          name
        );
        
        if (userAccount) {
          return await this.login({ email, password });
        }
        return userAccount;
      } catch (error) {
        console.error('Error creating account:', error);
        throw error;
      }
    }

    // Login with email and password
    async login({ email, password }) {
      try {
        return await account.createEmailPasswordSession(email, password);
      } catch (error) {
        console.error('Error logging in:', error);
        throw error;
      }
    }

    // Login with GitHub OAuth
    async loginWithGithub() {
      try {
        // Redirect to GitHub OAuth
        account.createOAuth2Session(
          OAuthProvider.Github,
          `${window.location.origin}/workspaces`, // Success redirect
          `${window.location.origin}/login`, // Failure redirect
        );
      } catch (error) {
        console.error('Error with GitHub login:', error);
        throw error;
      }
    }

    // Get current user
    async getCurrentUser() {
      try {
        return await account.get();
      } catch (error) {
        console.error('Error getting current user:', error);
        return null;
      }
    }

    // Logout
    async logout() {
      try {
        await account.deleteSession('current');
      } catch (error) {
        console.error('Error logging out:', error);
        throw error;
      }
    }

    // Get user preferences
    async getUserPreferences() {
      try {
        return await account.getPrefs();
      } catch (error) {
        console.error('Error getting preferences:', error);
        throw error;
      }
    }

    // Update user preferences
    async updateUserPreferences(prefs) {
      try {
        return await account.updatePrefs(prefs);
      } catch (error) {
        console.error('Error updating preferences:', error);
        throw error;
      }
    }
  }

  authServiceInstance = new AuthService();
}

export default authServiceInstance;
