/**
 * useXpStore.js — Zustand store for XP state with offline queue.
 * Step 2 of the Apex gamification build order.
 *
 * Persist key: 'apex-xp-storage'
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';
import { showToastGlobal } from '../hooks/useToast';

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

      // ─── Timed multiplier from overflow rewards ─────────────────────────────
      multiplierExpiresAt: null, // ISO string or null

      // ─── Game profile extras (synced from server) ───────────────────────────
      streakFreezeHeld: false,
      refreshTokens: 0,
      lifetimeQuestsCompleted: 0,
      unclaimedRewards: [],

      // ─── Last sync timestamp (server-provided, never client clock) ──────────
      lastSyncedAt: null,

      // ═══════════════════════════════════════════════════════════════════════
      // ACTIONS
      // ═══════════════════════════════════════════════════════════════════════

      /**
       * awardXpOptimistic — optimistically award XP locally.
       * If online: immediately flushes to server.
       * If offline: queues the action and sets a localStorage flag.
       */
      awardXpOptimistic: (action, metadata, estimatedAmount) => {
        console.log(`[XP Gained] +${estimatedAmount} XP for ${action}`);
        showToastGlobal(`+${estimatedAmount} XP (${action.replace('_', ' ')})`, 'success');

        const newAction = {
          action,
          metadata: metadata || {},
          estimatedXp: estimatedAmount,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          pendingXpActions: [...state.pendingXpActions, newAction],
          estimatedXp: state.estimatedXp + estimatedAmount,
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
        const { pendingXpActions } = get();

        if (pendingXpActions.length === 0) return;
        if (!navigator.onLine) return;

        try {
          const response = await apiClient.post('/api/xp/sync', {
            actions: pendingXpActions,
          });

          const { xp_awarded, multiplier_applied, total_xp, multiplier_expires_at, streak_freeze_held, refresh_tokens, lifetime_quests_completed, unclaimed_rewards } = response.data;
          
          console.log(`[XP Sync] Flushed to server. Awarded: ${xp_awarded}, Multiplier: ${multiplier_applied}x, Total: ${total_xp}`);

          if (xp_awarded > 0 && multiplier_applied > 1.0) {
            showToastGlobal(`Bonus! ${multiplier_applied}x day multiplier applied.`, 'success');
          }

          set({
            confirmedXp: total_xp,
            estimatedXp: total_xp,
            pendingXpActions: [],
            multiplierExpiresAt: multiplier_expires_at ?? get().multiplierExpiresAt,
            streakFreezeHeld: streak_freeze_held ?? get().streakFreezeHeld,
            refreshTokens: refresh_tokens ?? get().refreshTokens,
            lifetimeQuestsCompleted: lifetime_quests_completed ?? get().lifetimeQuestsCompleted,
            unclaimedRewards: unclaimed_rewards ?? get().unclaimedRewards,
          });

          localStorage.removeItem('apex_xp_sync_pending');
        } catch (err) {
          // Leave pendingXpActions intact for retry
          console.error('[XP Store] Flush failed, will retry:', err?.message);
        }
      },

      /**
       * seedFromServer — called on login and app load.
       * Sets both confirmedXp and estimatedXp to the server's total_xp.
       */
      seedFromServer: (profileData) => {
        console.log('[XP Store] Seeded from server, total_xp:', profileData.total_xp);

        set({
          confirmedXp: profileData.total_xp ?? 0,
          estimatedXp: profileData.total_xp ?? 0,
          multiplierExpiresAt: profileData.multiplier_expires_at ?? null,
          streakFreezeHeld: profileData.streak_freeze_held ?? false,
          refreshTokens: profileData.refresh_tokens ?? 0,
          lifetimeQuestsCompleted: profileData.lifetime_quests_completed ?? 0,
          unclaimedRewards: profileData.unclaimed_rewards ?? [],
          lastSyncedAt: profileData.synced_at ?? null,
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
          multiplierExpiresAt: null,
          streakFreezeHeld: false,
          refreshTokens: 0,
          lifetimeQuestsCompleted: 0,
          unclaimedRewards: [],
          lastSyncedAt: null,
        });
      },
    }),
    {
      name: 'apex-xp-storage',
    }
  )
);

export default useXpStore;
