import { Client, Account, Databases, Functions, Storage } from "appwrite";

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const WORKSPACES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_WORKSPACES_COLLECTION_ID;
export const MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID;
export const CODE_SESSIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CODE_SESSIONS_COLLECTION_ID;

const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const USE_MOCK = !APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID.includes('your');

let client = null;
let account = null;
let databases = null;
let functions = null;
let storage = null;
let realtime = null;

if (!USE_MOCK) {
    client = new Client()
        .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
        .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

    account = new Account(client);
    databases = new Databases(client);
    functions = new Functions(client);
    storage = new Storage(client);
    realtime = client;
} else {
    // Mock implementations using localStorage to avoid network calls during local dev
    client = null;

    account = {
        get: async () => null,
        create: async () => null,
        createEmailPasswordSession: async () => null,
        createOAuth2Session: async () => null,
        deleteSession: async () => null,
        getPrefs: async () => ({}),
        updatePrefs: async () => ({}),
    };

    const _read = (key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    };

    const _write = (key, list) => localStorage.setItem(key, JSON.stringify(list));

    const makeKey = (collectionId) => `mock_appwrite_${collectionId}`;

    databases = {
        createDocument: async (_db, collectionId, docId, payload) => {
            const key = makeKey(collectionId);
            const list = _read(key);
            const doc = { $id: docId, ...payload };
            list.push(doc);
            _write(key, list);
            return doc;
        },
        listDocuments: async (_db, collectionId) => {
            const key = makeKey(collectionId);
            const list = _read(key);
            return { documents: list };
        },
        getDocument: async (_db, collectionId, docId) => {
            const key = makeKey(collectionId);
            const list = _read(key);
            return list.find(d => d.$id === docId) || null;
        },
        updateDocument: async (_db, collectionId, docId, payload) => {
            const key = makeKey(collectionId);
            const list = _read(key);
            const idx = list.findIndex(d => d.$id === docId);
            if (idx === -1) throw new Error('Document not found');
            list[idx] = { ...list[idx], ...payload };
            _write(key, list);
            return list[idx];
        },
        deleteDocument: async (_db, collectionId, docId) => {
            const key = makeKey(collectionId);
            const list = _read(key);
            const newList = list.filter(d => d.$id !== docId);
            _write(key, newList);
            return { success: true };
        }
    };

    realtime = {
        // channel, callback
        subscribe: (channel, callback) => {
            // no real-time in mock; return an unsubscribe function
            return () => {};
        }
    };

    functions = {};
    storage = {};
}

export { client, account, databases, functions, storage, realtime };
