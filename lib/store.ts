import { create } from 'zustand';

interface User {
  id: number;
  email: string;
  username: string;
  profile_picture_url?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  
  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, token });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, token: null });
  },
  
  isAuthenticated: () => {
    return !!get().token;
  },
}));
