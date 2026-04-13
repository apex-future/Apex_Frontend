/**
 * db.js
 * Chat storage — now using ApexDB (Dexie) instead of ApexBooksDB.
 * ApexBooksDB is deprecated and no longer used.
 */
import db from '../db/apex.db';

// Legacy book functions — no longer used but kept to avoid import errors
export const saveBook = async () => {};
export const getAllBooks = async () => [];
export const deleteBook = async () => {};
export const updateBook = async () => {};
export const openDB = async () => {};

// Chat functions — now use ApexDB.chats via Dexie
export const saveChat = async (chat) => {
  try {
    // Use put to upsert — same behavior as before
    const existing = await db.chats.get(chat.id);
    if (existing) {
      await db.chats.update(chat.id, chat);
    } else {
      await db.chats.add(chat);
    }
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Apex] Failed to save chat:', err);
    return false;
  }
};

export const getAllChats = async () => {
  try {
    return await db.chats.toArray();
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Apex] Failed to get chats:', err);
    return [];
  }
};

export const deleteChat = async (id) => {
  try {
    await db.chats.delete(id);
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Apex] Failed to delete chat:', err);
    return false;
  }
};

export const clearAllChats = async () => {
  try {
    await db.chats.clear();
    return true;
  } catch (err) {
    if (import.meta.env.DEV) console.error('[Apex] Failed to clear chats:', err);
    return false;
  }
};
