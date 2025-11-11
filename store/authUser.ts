import axios from 'axios';
import toast from 'react-hot-toast';
import { create } from 'zustand';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isSigningUp: boolean;
  isCheckingAuth: boolean;
  isLoggingOut: boolean;
  isLoggingIn: boolean;
  signup: (credentials: {
    email: string;
    username: string;
    password: string;
  }) => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  authCheck: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSigningUp: false,
  isCheckingAuth: true,
  isLoggingOut: false,
  isLoggingIn: false,
  signup: async (credentials) => {
    set({ isSigningUp: true });
    try {
      const response = await axios.post('/api/v1/auth/signup', credentials, {
        withCredentials: true,
      });
      set({ user: response.data.user, isSigningUp: false });
      toast.success('Account created successfully');
      window.location.href = '/';
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Signup failed');
      set({ isSigningUp: false, user: null });
    }
  },
  login: async (credentials) => {
    set({ isLoggingIn: true });
    try {
      const response = await axios.post('/api/v1/auth/login', credentials, {
        withCredentials: true,
      });
      set({ user: response.data.user, isLoggingIn: false });
      toast.success('Logged in successfully');
      window.location.href = '/';
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ isLoggingIn: false, user: null });
      toast.error(err.response?.data?.message || 'Login failed');
    }
  },
  logout: async () => {
    set({ isLoggingOut: true });
    try {
      await axios.post('/api/v1/auth/logout', {}, { withCredentials: true });
      set({ user: null, isLoggingOut: false });
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ isLoggingOut: false });
      toast.error(err.response?.data?.message || 'Logout failed');
    }
  },
  authCheck: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axios.get('/api/v1/auth/authCheck', {
        withCredentials: true,
      });
      set({ user: response.data.user, isCheckingAuth: false });
    } catch (_error: unknown) {
      set({ isCheckingAuth: false, user: null });
    }
  },
}));
