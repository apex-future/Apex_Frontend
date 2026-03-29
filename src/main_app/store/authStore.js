import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null, // { id, full_name, email, avatar_url, user_type }
      isAuthenticated: false,
      isLoading: true, // true on app load while verifying token

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),

      clearUser: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'apex-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export default useAuthStore;
