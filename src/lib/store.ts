import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_PLATFORMS } from './catalog';
import { demoGames } from './demo';
import { demoHistory, fetchPrice, recordPrice } from './prices';
import type { Game, Offer, Platform, StoreId } from './types';

interface WishlistState {
  games: Game[];
  platforms: Platform[];
  /** Offers currently being fetched, as `${gameId}:${store}`. */
  refreshing: string[];
  lastRefreshAll?: number;

  saveGame: (game: Game) => void;
  deleteGame: (id: string) => void;
  togglePlatform: (id: string) => void;
  setOfferUrl: (gameId: string, store: StoreId, url: string) => void;
  refreshOffer: (gameId: string, store: StoreId) => Promise<void>;
  refreshAll: () => Promise<void>;
  loadDemo: () => void;
  reset: () => void;
}

const patchOffer = (games: Game[], gameId: string, store: StoreId, fn: (o: Offer) => Offer): Game[] =>
  games.map((g) => {
    const offer = g.offers[store];
    return g.id === gameId && offer ? { ...g, offers: { ...g.offers, [store]: fn(offer) } } : g;
  });

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      games: [],
      platforms: DEFAULT_PLATFORMS,
      refreshing: [],

      saveGame: (game) =>
        set((s) => {
          const exists = s.games.some((g) => g.id === game.id);
          return { games: exists ? s.games.map((g) => (g.id === game.id ? game : g)) : [game, ...s.games] };
        }),

      deleteGame: (id) => set((s) => ({ games: s.games.filter((g) => g.id !== id) })),

      togglePlatform: (id) =>
        set((s) => ({ platforms: s.platforms.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)) })),

      setOfferUrl: (gameId, store, url) => {
        const clean = url.trim();
        set((s) => ({
          games: s.games.map((g) => {
            if (g.id !== gameId) return g;
            const offers = { ...g.offers };
            if (!clean) delete offers[store];
            else if (offers[store]?.url !== clean) offers[store] = { url: clean, history: demoHistory(clean) };
            return { ...g, offers, updatedAt: Date.now() };
          }),
        }));
        if (clean) void get().refreshOffer(gameId, store);
      },

      refreshOffer: async (gameId, store) => {
        const offer = get().games.find((g) => g.id === gameId)?.offers[store];
        if (!offer) return;
        const key = `${gameId}:${store}`;
        set((s) => ({ refreshing: [...s.refreshing, key] }));
        try {
          const price = await fetchPrice(store, offer.url);
          set((s) => ({ games: patchOffer(s.games, gameId, store, (o) => recordPrice(o, price)) }));
        } catch (e) {
          const error = e instanceof Error ? e.message : 'Nie udało się pobrać ceny';
          set((s) => ({ games: patchOffer(s.games, gameId, store, (o) => ({ ...o, error, checkedAt: Date.now() })) }));
        } finally {
          set((s) => ({ refreshing: s.refreshing.filter((k) => k !== key) }));
        }
      },

      refreshAll: async () => {
        const jobs = get().games.flatMap((g) =>
          (Object.keys(g.offers) as StoreId[]).map((store) => get().refreshOffer(g.id, store)),
        );
        await Promise.all(jobs);
        set({ lastRefreshAll: Date.now() });
      },

      loadDemo: () => {
        set((s) => ({ games: [...demoGames(), ...s.games.filter((g) => !g.id.startsWith('demo-'))] }));
        void get().refreshAll();
      },

      reset: () => set({ games: [], platforms: DEFAULT_PLATFORMS, refreshing: [], lastRefreshAll: undefined }),
    }),
    {
      name: 'game-wishlist-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ games, platforms, lastRefreshAll }) => ({ games, platforms, lastRefreshAll }),
    },
  ),
);

export const newId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
