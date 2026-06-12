import { create } from 'zustand';

const STORAGE_KEY = 'shopmanager_auth';

const loadPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore parse errors */ }
  return { user: null, role: null, store: null, token: null };
};

const persist = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: state.user,
      role: state.role,
      store: state.store,
      token: state.token
    }));
  } catch { /* ignore storage errors */ }
};

const persisted = loadPersisted();

const useAuthStore = create((set) => ({
  user: persisted.user,
  role: persisted.role,
  store: persisted.store,
  token: persisted.token,

  login: (userData, token) => {
    const state = {
      user: userData,
      role: userData.role,
      store: userData.store ?? null,
      token
    };
    set(state);
    persist(state);
  },

  logout: () => {
    const state = { user: null, role: null, store: null, token: null };
    set(state);
    localStorage.removeItem(STORAGE_KEY);
  },
}));

export default useAuthStore;
