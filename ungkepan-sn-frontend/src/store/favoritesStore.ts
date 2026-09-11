import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getFavorites, toggleFavoriteServer } from '../api/client'
import { useAuthStore } from './authStore'

interface FavoritesStore {
  ids: string[]
  toggle: (id: string) => void
  remove: (id: string) => void
  hydrateFromServer: () => Promise<void>
  reset: () => void
}

const authed = () => !!useAuthStore.getState().token

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set) => ({
      ids: [],

      toggle: (id) => {
        if (authed()) {
          toggleFavoriteServer(id)
            .then((res) => set({ ids: res.ids.map(String) }))
            .catch(() => {})
          return
        }
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((x) => x !== id)
            : [...state.ids, id],
        }))
      },

      remove: (id) => {
        if (authed()) {
          toggleFavoriteServer(id)
            .then((res) => set({ ids: res.ids.map(String) }))
            .catch(() => {})
          return
        }
        set((state) => ({ ids: state.ids.filter((x) => x !== id) }))
      },

      hydrateFromServer: async () => {
        if (!authed()) return
        try {
          const res = await getFavorites()
          set({ ids: res.ids.map(String) })
        } catch {
          // abaikan
        }
      },

      reset: () => set({ ids: [] }),
    }),
    { name: 'ungkepan-sn-favorites' }
  )
)
