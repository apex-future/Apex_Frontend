/**
 * settingsStore.js
 * Single source of truth for all user preferences.
 * Persisted locally via Zustand persist + synced to Supabase when online.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      settingsLastSyncedAt: null,  // server-generated updated_at from last successful save

      // ── Appearance ──
      theme: 'system',

      // ── Reading ──
      autoSaveProgress: true,   // If false, skip Supabase sync for progress (still saves locally)
      pageAnimations: true,     // Master toggle for all page transition animations

      // ── AI ──
      saveChatHistory: true,    // If false, skip persisting chat sessions
      autoExplain: false,       // If true, highlight opens AI automatically

      // ── Notifications ──
      notifications: {
        readingReminders: true,
        studyTips: false,
      },
      reminderTime: '18:00',  // HH:MM — default 6PM

      // ── Reader ──
      scrollOrientation: 'vertical',    // 'vertical' | 'horizontal'
      scrollAnimation: 'none',          // 'none' | 'slide' | 'fade'
      streakThresholdMinutes: 2,        // 2 | 5 | 10 | 15 | 20 | 30
      streakCelebrationEnabled: true,   // Toggle streak celebration modal on/off
      streakCelebrationStyle: 'subtle', // 'subtle' (default less distracting) | 'full' (distracting)

      // ── Setters ──

      /**
       * updateSetting — updates a single top-level setting key
       * Persists locally immediately, syncs to Supabase if online
       */
      updateSetting: (key, value) => {
        if (import.meta.env.DEV) console.log('[Apex Settings] Updating:', key, '→', value);
        set({ [key]: value });
        // Defer sync so Zustand persist middleware flushes the new value first
        queueMicrotask(() => get()._syncToSupabase());
      },

      /**
       * updateNotification — updates a single notification preference
       */
      updateNotification: (key, value) => {
        if (import.meta.env.DEV) console.log('[Apex Settings] Notification update:', key, '→', value);
        const current = get().notifications;
        const updated = { ...current, [key]: value };
        set({ notifications: updated });
        queueMicrotask(() => get()._syncToSupabase());
      },

      /**
       * _syncToSupabase — patches current settings to backend
       * Called after every setting change if online
       * Fails silently — local data is source of truth
       */
      _syncToSupabase: async () => {
        if (!navigator.onLine) {
          if (import.meta.env.DEV) console.log('[Apex Gear] Offline — settings saved locally, will sync when online');
          return;
        }
        try {
          const {
            theme, autoSaveProgress, pageAnimations,
            saveChatHistory, autoExplain, notifications,
            scrollOrientation, scrollAnimation, reminderTime,
            streakThresholdMinutes, streakCelebrationEnabled,
            streakCelebrationStyle,
          } = get();

          const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const notificationsWithTz = { ...notifications, timezone: localTimezone };

          const response = await apiClient.patch('/api/settings', {
            theme,
            auto_save_progress: autoSaveProgress,
            page_animations: pageAnimations,
            save_chat_history: saveChatHistory,
            auto_explain: autoExplain,
            notifications: notificationsWithTz,
            scroll_orientation: scrollOrientation,
            scroll_animation: scrollAnimation,
            reminder_time: reminderTime,
            streak_threshold_minutes: streakThresholdMinutes,
            streak_celebration_enabled: streakCelebrationEnabled,
            streak_celebration_style: streakCelebrationStyle,
          });
          if (response.data?.updated_at) {
            set({ settingsLastSyncedAt: response.data.updated_at });
            if (import.meta.env.DEV) console.log('[Apex Settings] Sync anchor updated:', response.data.updated_at);
          }
          if (import.meta.env.DEV) console.log('[Apex Settings] Synced to Supabase successfully');
        } catch (err) {
          if (import.meta.env.DEV) console.error('[Apex Gear] Failed to sync to Supabase:', err);
        }
      },

      /**
       * seedFromSupabase — called on login/app load
       * Seeds store from Supabase data — Supabase wins on login
       */
      seedFromSupabase: (data) => {
        if (!data) return;

        const cloudUpdatedAt = data.updated_at || null;
        const lastSyncedAt = get().settingsLastSyncedAt || null;

        if (!cloudUpdatedAt) {
          if (import.meta.env.DEV) console.log('[Apex Gear] No cloud timestamp — keeping local settings');
          return;
        }

        if (lastSyncedAt && cloudUpdatedAt <= lastSyncedAt) {
          if (import.meta.env.DEV) console.log('[Apex Gear] Local settings are current — skipping cloud seed',
            '(cloud:', cloudUpdatedAt, 'lastSynced:', lastSyncedAt, ')');
          return;
        }

        if (import.meta.env.DEV) console.log('[Apex Settings] Cloud settings are newer — seeding',
          '(cloud:', cloudUpdatedAt, 'lastSynced:', lastSyncedAt || 'never', ')');

        set({
          theme: data.theme || 'system',
          autoSaveProgress: data.auto_save_progress ?? true,
          pageAnimations: data.page_animations ?? true,
          saveChatHistory: data.save_chat_history ?? true,
          autoExplain: data.auto_explain ?? false,
          notifications: data.notifications || {
            readingReminders: true,
            studyTips: false,
          },
          scrollOrientation: data.scroll_orientation || 'vertical',
          scrollAnimation: data.scroll_animation || 'none',
          reminderTime: data.reminder_time ? data.reminder_time.slice(0, 5) : '18:00',
          streakThresholdMinutes: data.streak_threshold_minutes ?? 2,
          streakCelebrationEnabled: data.streak_celebration_enabled ?? true,
          streakCelebrationStyle: data.streak_celebration_style || 'subtle',
          settingsLastSyncedAt: cloudUpdatedAt,
        });
      },

      /**
       * syncOnReconnect — called when device comes back online
       * Pushes any offline setting changes to Supabase
       */
      syncOnReconnect: () => {
        if (import.meta.env.DEV) console.log('[Apex Gear] Back online — syncing settings');
        get()._syncToSupabase();
      },
    }),
    {
      name: 'apex-settings-storage',
    }
  )
);

export default useSettingsStore;
