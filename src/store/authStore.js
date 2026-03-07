import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null, // { id, full_name, email, avatar_url }
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
}));

export default useAuthStore;
