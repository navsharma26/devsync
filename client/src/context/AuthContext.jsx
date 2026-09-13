import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('devsync_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('devsync_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  // Open modal with specific mode
  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  // Fetch current user details on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('devsync_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await authService.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('devsync_user', JSON.stringify(data.user));
        } else {
          // Token invalid
          logout();
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err?.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Register action
  const register = async (name, email, password) => {
    try {
      const data = await authService.register({ name, email, password });
      if (data.success && data.token) {
        localStorage.setItem('devsync_token', data.token);
        localStorage.setItem('devsync_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        closeAuthModal();
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message };
    }
  };

  // Login action
  const login = async (email, password) => {
    try {
      const data = await authService.login({ email, password });
      if (data.success && data.token) {
        localStorage.setItem('devsync_token', data.token);
        localStorage.setItem('devsync_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        closeAuthModal();
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Invalid credentials';
      return { success: false, message };
    }
  };

  // Logout action
  const logout = useCallback(() => {
    localStorage.removeItem('devsync_token');
    localStorage.removeItem('devsync_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    authModalOpen,
    authModalMode,
    setAuthModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
