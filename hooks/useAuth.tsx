import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppUser } from '@/models/types';
import { backend } from '@/services/backend';

interface AuthState {
  uid: string | null;
  user: AppUser | null;
  initializing: boolean;
  signUp: (username: string, email: string, password: string, referredBy?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const off = backend.onAuthChange((next) => {
      setUid(next);
      setInitializing(false);
    });
    return off;
  }, []);

  useEffect(() => {
    if (!uid) {
      setUser(null);
      return;
    }
    const off = backend.watchUser(uid, setUser);
    return off;
  }, [uid]);

  const value: AuthState = {
    uid,
    user,
    initializing,
    signUp: backend.signUp.bind(backend),
    signIn: backend.signIn.bind(backend),
    signOut: backend.signOut.bind(backend),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
