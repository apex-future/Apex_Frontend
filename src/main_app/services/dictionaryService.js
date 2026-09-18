import db from '../db/apex.db';
import apiClient from './apiClient';
import useXpStore from '../store/useXpStore';
import { XP_VALUES } from '../../config/xpConfig';

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
    const rawClean = word.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    const cleanWord = rawClean.toLowerCase();
    if (!cleanWord) throw new Error('No word provided');

    // Step 1: Check Dexie dictionary_cache
    try {
      const cached = await db.dictionary_cache.get(cleanWord);
      if (cached && cached.definition) {
        if (import.meta.env.DEV) console.log(`Dictionary cache hit for "${cleanWord}"`);
        const defData = Array.isArray(cached.definition) ? cached.definition[0] : cached.definition;
        if (defData) {
          defData.isAiGenerated = !!cached.isAiGenerated;
        }
        // Fire-and-forget: save to history
        this.saveToHistory(cleanWord, cached.definition, lookupType, bookId);
        return cached.definition;
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Dexie cache check failed:', err);
    }

    // Step 2: If offline, check offline_dictionary
    if (!navigator.onLine) {
      try {
        const offlineEntry = await db.offline_dictionary.get(cleanWord);
        if (offlineEntry) {
          if (import.meta.env.DEV) console.log(`Offline dictionary hit for "${cleanWord}"`);
          // Parse the raw Webster's text into a rich, structured format
          return parseWebstersEntry(cleanWord, offlineEntry.definition);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Offline dictionary check failed:', err);
      }
      throw new Error('Connect to internet to look up new words, or download the Offline Dictionary in settings.');
    }

    // Step 3: Fetch standard definition via Backend (checks Supabase cache -> external Free Dictionary API via server-side httpx)
    let definition = null;

    try {
      const response = await apiClient.get(`/api/dictionary/${encodeURIComponent(cleanWord)}`, {
        timeout: 5000,
      });
      if (response.data) {
        const data = Array.isArray(response.data) ? response.data : [response.data];
        if (data.length > 0) {
          definition = data;
        }
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        // If backend route had a non-404 error, try direct fetch as quick fallback with 5s timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const fetchResponse = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            if (Array.isArray(data) && data.length > 0) {
              definition = data;
            }
          }
        } catch (fetchErr) {
          // Direct fetch failed or timed out
        }
      }
    }

    if (!definition) {
      try {
        if (import.meta.env.DEV) console.log(`Routing word "${cleanWord}" to AI dictionary definition fallback...`);
        const aiResponse = await apiClient.post('/api/ai/define', {
          word: cleanWord,
          book_id: bookId || null,
        }, { timeout: 8000 });

        if (aiResponse.data) {
          definition = Array.isArray(aiResponse.data) ? aiResponse.data : [aiResponse.data];
          if (definition[0]) {
            definition[0].isAiGenerated = true;
          }
        }
      } catch (aiErr) {
        if (import.meta.env.DEV) console.warn('AI dictionary fallback failed:', aiErr);
      }
    }

    if (!definition || definition.length === 0) {
      throw new Error(`Couldn't find definition for "${rawClean || word}".`);
    }

    // Step 5: Save to Dexie cache
    try {
      const defData = Array.isArray(definition) ? definition[0] : definition;
      const phonetic = defData?.phonetic || defData?.phonetics?.[0]?.text || '';
      const audioUrl = defData?.phonetics?.find(p => p.audio)?.audio || '';

      await db.dictionary_cache.put({
        word: cleanWord,
        definition,
        phonetic,
        audioUrl,
        isAiGenerated: !!defData?.isAiGenerated,
        cachedAt: new Date().toISOString(),
      });
    } catch (cacheErr) {
      if (import.meta.env.DEV) console.warn('Failed to save to Dexie cache:', cacheErr);
    }

    // Step 6: Fire-and-forget: save to history via backend
    this.saveToHistory(cleanWord, definition, lookupType, bookId);

    return definition;
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

    // Award XP for dictionary lookup
    useXpStore.getState().awardXpOptimistic('dictionary_lookup', {}, XP_VALUES.dictionary_lookup);

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

  /**
   * Check if the offline dictionary is downloaded.
   * @returns {Promise<boolean>}
   */
  checkOfflineDictionaryStatus: async function () {
    try {
      const count = await db.offline_dictionary.count();
      return count > 0;
    } catch (err) {
      return false;
    }
  },

  /**
   * Download the offline dictionary and store it in Dexie.
   * Uses the compact Websters dictionary (~6MB JSON).
   * @param {Function} onProgress - Callback for progress updates (0 to 100)
   */
  downloadOfflineDictionary: async function (onProgress) {
    if (!navigator.onLine) throw new Error('You must be online to download the offline dictionary.');
    
    try {
      onProgress(10);
      // We use the compact Webster's English Dictionary
      const response = await fetch('https://raw.githubusercontent.com/matthewreagan/WebstersEnglishDictionary/master/dictionary_compact.json');
      if (!response.ok) throw new Error('Failed to download dictionary file.');
      
      onProgress(40);
      const data = await response.json(); // This takes a moment
      
      onProgress(60);
      
      // Clear existing offline dictionary to prevent duplicates/errors
      await db.offline_dictionary.clear();
      
      onProgress(70);
      
      // Prepare bulk insert with deduplication
      const entries = [];
      const seenWords = new Set();
      
      for (const [key, value] of Object.entries(data)) {
        const lower = key.toLowerCase();
        if (!seenWords.has(lower)) {
            seenWords.add(lower);
            entries.push({
                word: lower,
                definition: value
            });
        }
      }
      
      onProgress(80);
      
      // Dexie bulkPut is highly optimized for large inserts and handles duplicates without throwing
      await db.offline_dictionary.bulkPut(entries);
      
      onProgress(100);
      return true;
    } catch (err) {
      console.error('Failed to download offline dictionary:', err);
      throw err;
    }
  },
};

/**
 * Parse a raw Webster's compact dictionary text entry into a structured format
 * matching the Free Dictionary API shape (max 3 definitions, examples, synonyms).
 * @param {string} word
 * @param {string} rawText
 * @returns {Array} Structured definition array
 */
function parseWebstersEntry(word, rawText) {
  if (!rawText) return [{ word, phonetic: '', meanings: [{ partOfSpeech: 'definition', definitions: [{ definition: 'No definition available.' }] }] }];

  const sections = rawText.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  const meanings = [];
  let totalDefsCount = 0;

  for (const section of sections) {
    if (totalDefsCount >= 3) break;

    // Detect part of speech
    let partOfSpeech = 'definition';
    if (section.toLowerCase().startsWith('to ')) {
      partOfSpeech = 'verb';
    } else if (/Syn\.\s*--/i.test(section) && !(/\b\d+\.\s/.test(section))) {
      partOfSpeech = 'adjective';
    }

    const definitions = [];
    let rawDefs = [];

    // Split numbered definitions "1. ...", "2. ...", etc.
    if (/\b\d+\.\s/.test(section)) {
      const parts = section.split(/\s*\b\d+\.\s+/);
      rawDefs.push(...parts.slice(1)); // skip pre-number text
    } else {
      rawDefs.push(section);
    }

    for (let rawDef of rawDefs) {
      if (totalDefsCount >= 3) break;
      rawDef = rawDef.trim();
      if (!rawDef) continue;

      let definitionText = rawDef;
      let synonyms = [];

      // Extract Synonyms (e.g. "Syn. -- Handsome; elegant; ...")
      const synMatch = rawDef.match(/Syn\.\s*--\s*([^.]+)\./i);
      if (synMatch) {
        synonyms = synMatch[1].split(/[;,]\s+/).map(s => s.trim()).filter(Boolean);
        definitionText = definitionText.replace(/Syn\.\s*--\s*[^.]+\.\s*/i, '');
      }

      // Split on "--" to separate main definition from notes/sub-phrases
      const segments = definitionText.split(/\s*--\s*/);
      let mainBlock = segments[0] || '';

      // Separate definition sentences from quoted examples (citations like "Shak.", "Milton.", etc.)
      const sentences = mainBlock.split(/(?<=[.!?])\s+(?=[A-Z])/);
      let finalDefText = '';
      let examples = [];

      const authorPattern = /\b(Shak|Milton|Dryden|Locke|Swift|Boyle|Macaulay|Irving|Evelyn|Kames|Hitchcock|Pope|Chaucer|Spenser|Tennyson|Wordsworth|Cowper|Addison|Johnson|Hooker|Bacon|Shakespeare|Gibbon|Scott|Holland|Bartlett|Hallam|Denham|Raleigh)\b/i;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();
        if (!sentence) continue;

        const isQuote = sentence.startsWith('as,') ||
                        sentence.startsWith('for example') ||
                        (i > 0 && authorPattern.test(sentence));

        if (isQuote && examples.length < 2) {
          let cleaned = sentence.replace(/^as,\s*/, '').trim();
          // Strip trailing author citations for cleaner examples
          cleaned = cleaned.replace(/\s+[A-Z][a-z]+\.?\s*$/, '').trim();
          if (cleaned.length > 5) examples.push(cleaned);
        } else {
          if (finalDefText) finalDefText += ' ';
          finalDefText += sentence;
        }
      }

      // Clean up the definition text
      let richDef = finalDefText.trim();
      richDef = richDef.replace(/^\[[a-zA-Z\s.]+\]\s*/, ''); // Remove [Obs.] etc.
      richDef = richDef.replace(/\s*Note:.*$/i, ''); // Strip trailing notes
      if (richDef) {
        richDef = richDef.charAt(0).toUpperCase() + richDef.slice(1);
        if (!richDef.endsWith('.')) richDef += '.';
      }

      if (richDef && richDef.length > 5) {
        definitions.push({
          definition: richDef,
          example: examples[0] || undefined,
          synonyms: synonyms.length > 0 ? synonyms.slice(0, 8) : undefined,
        });
        totalDefsCount++;
      }
    }

    if (definitions.length > 0) {
      meanings.push({ partOfSpeech, definitions });
    }
  }

  // Fallback if parsing yields nothing
  if (meanings.length === 0) {
    const fallbackDef = rawText.split(/\n/)[0].substring(0, 300);
    meanings.push({
      partOfSpeech: 'definition',
      definitions: [{ definition: fallbackDef.endsWith('.') ? fallbackDef : fallbackDef + '.' }]
    });
  }

  return [{ word, phonetic: '', meanings: meanings.slice(0, 2) }];
}

export default dictionaryService;
