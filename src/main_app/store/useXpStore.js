/**
 * useXpStore.js — Zustand store for XP state with offline queue.
 * Step 2 of the Apex gamification build order.
 *
 * Persist key: 'apex-xp-storage'
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';


const useXpStore = create(
  persist(
    (set, get) => ({
      // ─── Server-confirmed state ─────────────────────────────────────────────
      confirmedXp: 0,

      // ─── Local running total (UI always reads this) ─────────────────────────
      // Includes unconfirmed offline actions layered on top of confirmedXp
      estimatedXp: 0,

      // ─── Offline queue ──────────────────────────────────────────────────────
      // Actions earned while offline, not yet confirmed by server
      pendingXpActions: [], // array of { action, metadata, estimatedXp, timestamp }

      // Actions earned in the current reader/active session
      sessionXpActions: [],

      // ─── Timed multiplier from overflow rewards ─────────────────────────────
      multiplierExpiresAt: null, // ISO string or null
      lastMultiplierApplied: 1.0,

      // ─── Game profile extras (synced from server) ───────────────────────────
      streakFreezeHeld: false,
      refreshTokens: 0,
      lifetimeQuestsCompleted: 0,
      unclaimedRewards: [],

      // ─── Last sync timestamp (server-provided, never client clock) ──────────
      lastSyncedAt: null,

      // ─── CASA sync anchors ───────────────────────────────────────────────────
      // lastUpdatedAt: the updated_at timestamp of the last profile we wrote locally.
      // xpLog: local union-merged copy of the XP action log (max 500 entries).
      lastUpdatedAt: null,
      xpLog: [],

      // ─── Flush Lock ─────────────────────────────────────────────────────────
      isFlushingXp: false,

      // ═══════════════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════════════

      /**
       * startSessionTracker — starts/resets the tracking of XP actions for the session.
       */
      startSessionTracker: () => {
        set({ sessionXpActions: [] });
      },

      /**
       * awardXpOptimistic — optimistically award XP locally.
       * If online: immediately flushes to server.
       * If offline: queues the action and sets a localStorage flag.
       */
      awardXpOptimistic: (action, metadata, estimatedAmount) => {
        if (import.meta.env.DEV) console.log(`[XP Gained] +${estimatedAmount} XP for ${action}`);

        const newAction = {
          action,
          metadata: metadata || {},
          estimatedXp: estimatedAmount,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          pendingXpActions: [...state.pendingXpActions, newAction],
          estimatedXp: state.estimatedXp + estimatedAmount,
          sessionXpActions: [...(state.sessionXpActions || []), newAction],
        }));

        if (navigator.onLine) {
          get().flushPendingXp();
        } else {
          console.log('[XP Store] Offline -- action queued:', action);
          localStorage.setItem('apex_xp_sync_pending', 'true');
        }
      },

      /**
       * flushPendingXp — sends the offline queue to the server.
       * Called on reconnect and after every optimistic award when online.
       */
      flushPendingXp: async () => {
        const { pendingXpActions, isFlushingXp } = get();

        if (pendingXpActions.length === 0) return;
        if (!navigator.onLine) return;
        if (isFlushingXp) return;

        set({ isFlushingXp: true });
        const actionsToFlush = pendingXpActions;

        try {
          const response = await apiClient.post('/api/xp/sync', {
            actions: actionsToFlush,
          });

          const { xp_awarded, multiplier_applied, total_xp, multiplier_expires_at, streak_freeze_held, refresh_tokens, lifetime_quests_completed, unclaimed_rewards } = response.data;
          
          if (import.meta.env.DEV) console.log(`[XP Sync] Flushed to server. Awarded: ${xp_awarded}, Multiplier: ${multiplier_applied}x, Total: ${total_xp}`);

          set((state) => ({
            confirmedXp: total_xp,
            estimatedXp: total_xp,
            pendingXpActions: state.pendingXpActions.filter(a => !actionsToFlush.includes(a)),
            isFlushingXp: false,
            multiplierExpiresAt: multiplier_expires_at ?? state.multiplierExpiresAt,
            lastMultiplierApplied: multiplier_applied ?? state.lastMultiplierApplied,
            streakFreezeHeld: streak_freeze_held ?? state.streakFreezeHeld,
            refreshTokens: refresh_tokens ?? state.refreshTokens,
            lifetimeQuestsCompleted: lifetime_quests_completed ?? state.lifetimeQuestsCompleted,
            unclaimedRewards: unclaimed_rewards ?? state.unclaimedRewards,
          }));

          localStorage.removeItem('apex_xp_sync_pending');
        } catch (err) {
          // Leave pendingXpActions intact for retry
          console.error('[XP Store] Flush failed, will retry:', err?.message);
          set({ isFlushingXp: false });
        }
      },

      /**
       * seedFromServer — called on login and app load.
       *
       * Implements the Clock-Agnostic Sync Algorithm (CASA):
       *   - total_xp:            Math.max(local, cloud) — XP never decreases.
       *   - xp_log:              Union-merge local + cloud arrays; deduplicate by
       *                          ts+action+xp; sort ascending; cap at 500.
       *   - streak_freeze_held,
       *     refresh_tokens:       Cloud wins only when cloud updated_at is
       *                          strictly newer than local lastUpdatedAt.
       *   - multiplier_expires_at: Take whichever is further in the future.
       */
      seedFromServer: (profileData) => {
        if (!profileData) return;
        const state = get();

        const cloudXp          = profileData.total_xp      ?? 0;
        const cloudUpdatedAt   = profileData.updated_at    ?? null;
        const localUpdatedAt   = state.lastUpdatedAt       ?? null;

        // ── total_xp: always take the higher value ────────────────────────────
        const resolvedXp = Math.max(state.confirmedXp ?? 0, cloudXp);

        // ── xp_log: union-merge, deduplicate, sort, cap ───────────────────────
        const localLog  = state.xpLog ?? [];
        const cloudLog  = profileData.xp_log ?? [];
        const combined  = [...localLog, ...cloudLog];
        const seen      = new Set();
        const dedupedLog = combined
          .filter(entry => {
            const key = `${entry.ts}|${entry.action}|${entry.xp}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0))
          .slice(-500);

        // ── cloud-wins-if-newer helper ────────────────────────────────────────
        const cloudIsNewer =
          cloudUpdatedAt && localUpdatedAt
            ? new Date(cloudUpdatedAt) > new Date(localUpdatedAt)
            : cloudUpdatedAt !== null; // first sync ever → cloud wins

        // ── streak_freeze_held, refresh_tokens: cloud wins when newer ─────────
        const resolvedStreakFreezeHeld = cloudIsNewer
          ? (profileData.streak_freeze_held ?? state.streakFreezeHeld)
          : state.streakFreezeHeld;

        const resolvedRefreshTokens = cloudIsNewer
          ? (profileData.refresh_tokens ?? state.refreshTokens)
          : state.refreshTokens;

        // ── multiplier_expires_at: take whichever is further in the future ────
        const localExpiry  = state.multiplierExpiresAt;
        const cloudExpiry  = profileData.multiplier_expires_at ?? null;
        let resolvedExpiry;
        if (!localExpiry && !cloudExpiry)   resolvedExpiry = null;
        else if (!localExpiry)              resolvedExpiry = cloudExpiry;
        else if (!cloudExpiry)              resolvedExpiry = localExpiry;
        else resolvedExpiry = new Date(cloudExpiry) > new Date(localExpiry)
          ? cloudExpiry
          : localExpiry;

        // ── new lastUpdatedAt: take the more recent of the two ────────────────
        const resolvedUpdatedAt =
          cloudUpdatedAt && localUpdatedAt
            ? (new Date(cloudUpdatedAt) >= new Date(localUpdatedAt) ? cloudUpdatedAt : localUpdatedAt)
            : (cloudUpdatedAt ?? localUpdatedAt);

        if (import.meta.env.DEV) {
          console.log(
            `[XP Store CASA] localXp=${state.confirmedXp} cloudXp=${cloudXp} → ${resolvedXp}`,
            `| cloudIsNewer=${cloudIsNewer}`,
            `| logEntries local=${localLog.length} cloud=${cloudLog.length} merged=${dedupedLog.length}`,
          );
        }

        // Calculate total pending XP to preserve optimistic UI on reload
        const pendingXp = state.pendingXpActions.reduce((sum, a) => sum + (a.estimatedXp || 0), 0);

        set({
          confirmedXp:              resolvedXp,
          estimatedXp:              resolvedXp + pendingXp,
          xpLog:                    dedupedLog,
          lastUpdatedAt:            resolvedUpdatedAt,
          multiplierExpiresAt:      resolvedExpiry,
          lastMultiplierApplied:    profileData.last_multiplier_applied ?? state.lastMultiplierApplied,
          streakFreezeHeld:         resolvedStreakFreezeHeld,
          refreshTokens:            resolvedRefreshTokens,
          lifetimeQuestsCompleted:  profileData.lifetime_quests_completed ?? state.lifetimeQuestsCompleted,
          unclaimedRewards:         cloudIsNewer
                                      ? (profileData.unclaimed_rewards ?? state.unclaimedRewards)
                                      : state.unclaimedRewards,
          lastSyncedAt:             profileData.synced_at ?? state.lastSyncedAt,
        });
      },

      /**
       * isMultiplierActive — returns true if a timed multiplier is currently active.
       * Used by UI to show multiplier badge. Not used by backend.
       */
      isMultiplierActive: () => {
        const { multiplierExpiresAt } = get();
        if (!multiplierExpiresAt) return false;
        return new Date(multiplierExpiresAt) > new Date();
      },

      /**
       * resetXpStore — resets all state to initial values.
       * Called on logout.
       */
      resetXpStore: () => {
        set({
          confirmedXp: 0,
          estimatedXp: 0,
          pendingXpActions: [],
          sessionXpActions: [],
          isFlushingXp: false,
          multiplierExpiresAt: null,
          lastMultiplierApplied: 1.0,
          streakFreezeHeld: false,
          refreshTokens: 0,
          lifetimeQuestsCompleted: 0,
          unclaimedRewards: [],
          lastSyncedAt: null,
          lastUpdatedAt: null,
          xpLog: [],
        });
      },
    }),
    {
      name: 'apex-xp-storage',
      partialize: (state) => {
        if (!state) return state;
        // Omit transient state from persistence to prevent infinite locks
        const { isFlushingXp, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Force it to false on load just in case older storage has it stuck as true
          state.isFlushingXp = false;
        }
      }
    }
  )
);

export default useXpStore;
