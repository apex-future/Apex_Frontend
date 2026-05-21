import db from '../db/apex.db';
import apiClient from './apiClient';

/**
 * Dictionary Service — Category C (hybrid offline) for definitions,
 * Category B (online only) for history.
 */
const dictionaryService = {
  /**
   * Look up a word definition.
   * 1. Check Dexie dictionary_cache first
   * 2. If not cached and online: fetch from backend (which checks Supabase cache → external API)
   * 3. Save to Dexie cache + save to history (fire and forget)
   * 4. If not cached and offline: throw friendly error
   *
   * @param {string} word - The word to look up
   * @param {string} lookupType - 'general' or 'in_reader'
   * @param {string|null} bookId - Book ID if in_reader, null if general
   * @returns {object} The definition data (array from dictionary API)
   */
  lookupWord: async function (word, lookupType = 'general', bookId = null) {
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) throw new Error('No word provided');

    // Step 1: Check Dexie dictionary_cache
    try {
      const cached = await db.dictionary_cache.get(cleanWord);
      if (cached && cached.definition) {
        if (import.meta.env.DEV) console.log(`Dictionary cache hit for "${cleanWord}"`);
        // Fire-and-forget: save to history
        this.saveToHistory(cleanWord, cached.definition, lookupType, bookId);
        return cached.definition;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Dexie cache check failed:', err);
    }

    // Step 2: Check if online
    if (!navigator.onLine) {
      throw new Error('Connect to internet to look up new words');
    }

    // Step 3: Fetch directly from Free Dictionary API to bypass backend dependency
    try {
      const fetchResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
      
      if (!fetchResponse.ok) {
        if (fetchResponse.status === 404) {
          throw new Error('Word not found');
        }
        throw new Error(`Dictionary API error: ${fetchResponse.statusText}`);
      }

      const definition = await fetchResponse.json();

      // Step 4: Save to Dexie cache
      try {
        const phonetic = Array.isArray(definition)
          ? definition[0]?.phonetic || definition[0]?.phonetics?.[0]?.text || ''
          : definition?.phonetic || '';
        const audioUrl = Array.isArray(definition)
          ? definition[0]?.phonetics?.find(p => p.audio)?.audio || ''
          : definition?.phonetics?.find(p => p.audio)?.audio || '';

        await db.dictionary_cache.put({
          word: cleanWord,
          definition,
          phonetic,
          audioUrl,
          cachedAt: new Date().toISOString(),
        });
      } catch (cacheErr) {
        if (import.meta.env.DEV) console.warn('Failed to save to Dexie cache:', cacheErr);
      }

      // Step 5: Fire-and-forget: save to history via backend (if backend is running)
      this.saveToHistory(cleanWord, definition, lookupType, bookId);

      return definition;
    } catch (err) {
      if (err.message === 'Word not found') {
        throw err;
      }
      throw new Error(err.message || 'Failed to look up word');
    }
  },

  /**
   * Save a lookup event to user_dictionary_history via backend.
   * Category B — online only, fire and forget, no Dexie.
   */
  saveToHistory: function (word, definition, lookupType, bookId) {
    if (!navigator.onLine) return; // Skip if offline — no queue, no error

    // Extract metadata from definition
    const defData = Array.isArray(definition) ? definition[0] : definition;
    const firstMeaning = defData?.meanings?.[0];

    const historyPayload = {
      word: word.toLowerCase(),
      lookup_type: lookupType,
      book_id: bookId || null,
      phonetic: defData?.phonetic || defData?.phonetics?.[0]?.text || null,
      audio_url: defData?.phonetics?.find(p => p.audio)?.audio || null,
      part_of_speech: firstMeaning?.partOfSpeech || null,
      short_definition: firstMeaning?.definitions?.[0]?.definition?.substring(0, 200) || null,
    };

    // Fire and forget — don't await
    apiClient.post('/api/dictionary/history', historyPayload).catch(err => {
      if (import.meta.env.DEV) console.warn('Failed to save dictionary history (non-critical):', err.message);
    });
  },

  /**
   * Get dictionary lookup history from backend.
   * Category B — online only.
   *
   * @param {string} lookupType - 'general' or 'in_reader'
   * @param {string|null} bookId - Book ID for in_reader lookups
   * @returns {Array} History entries
   */
  getHistory: async function (lookupType = 'general', bookId = null) {
    if (!navigator.onLine) return [];

    try {
      const params = { type: lookupType };
      if (lookupType === 'in_reader' && bookId) {
        params.book_id = bookId;
      }
      const response = await apiClient.get('/api/dictionary/history/list', { params });
      return response.data || [];
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Failed to fetch dictionary history:', err.message);
      return [];
    }
  },
};

export default dictionaryService;
