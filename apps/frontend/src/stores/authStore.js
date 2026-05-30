import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  role: null,
  store: null,
  token: null,
  
  login: (userData, token) => set({ 
    user: userData, 
    role: userData.role, 
    store: userData.store ?? null,
    token
  }),
  
  logout: () => set({ 
    user: null, 
    role: null, 
    store: null,
    token: null 
  }),
}));

export default useAuthStore;
