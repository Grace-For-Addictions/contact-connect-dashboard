import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, auth } from '@/api/client';

const AuthContext = createContext();

/**
 * AuthProvider — Supabase-backed session state.
 *
 * The VRCC building is open to everyone: browsing the shell and the public
 * rooms never requires a login. Auth is optional and only gates the Staff &
 * Volunteer area. This provider tracks the current Supabase session and
 * exposes it without ever blocking the app from rendering.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const loadUser = async () => {
    try {
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    loadUser();
    const { data } = supabase.auth.onAuthStateChange(() => loadUser());
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const login = async (email, password) => {
    const { error } = await auth.login(email, password);
    if (error) throw error;
    await loadUser();
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
