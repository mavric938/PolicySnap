'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { User, AuthSession, AuthResult } from '@/domain/entities/auth';
import { authRepository } from '@/data/repositories/AuthRepositoryImpl';
import { SignInWithGoogleUseCase } from '@/domain/usecases/SignInWithGoogleUseCase';
import { SignInWithDevAccountUseCase } from '@/domain/usecases/SignInWithDevAccountUseCase';
import { RegisterWithEmailUseCase } from '@/domain/usecases/RegisterWithEmailUseCase';
import { SignInWithEmailUseCase } from '@/domain/usecases/SignInWithEmailUseCase';
import { SignInAsGuestUseCase } from '@/domain/usecases/SignInAsGuestUseCase';
import { SignOutUseCase } from '@/domain/usecases/SignOutUseCase';
import { GetCurrentUserUseCase } from '@/domain/usecases/GetCurrentUserUseCase';
import { WatchAuthStateUseCase } from '@/domain/usecases/WatchAuthStateUseCase';

/**
 * Authentication Context Contract
 * Layer: PRESENTATION
 */
interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isGoogleOAuthAvailable: boolean;
  registerWithEmail: (data: { name: string; email: string; password?: string }) => Promise<AuthResult>;
  signInWithEmail: (email: string, password?: string) => Promise<AuthResult>;
  signInAsGuest: (name?: string) => Promise<AuthResult>;
  signInWithGoogle: (options?: { redirectTo?: string }) => Promise<{
    success: boolean;
    error?: string;
    providerNotEnabled?: boolean;
    redirectUrl?: string;
  }>;
  signInWithDevAccount: (persona?: { email?: string; name?: string; avatarUrl?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleOAuthAvailable, setIsGoogleOAuthAvailable] = useState(false);

  // Domain Use Cases instantiation (Dependency Injection)
  const signInWithGoogleUseCase = useMemo(() => new SignInWithGoogleUseCase(authRepository), []);
  const signInWithDevAccountUseCase = useMemo(() => new SignInWithDevAccountUseCase(authRepository), []);
  const registerWithEmailUseCase = useMemo(() => new RegisterWithEmailUseCase(authRepository), []);
  const signInWithEmailUseCase = useMemo(() => new SignInWithEmailUseCase(authRepository), []);
  const signInAsGuestUseCase = useMemo(() => new SignInAsGuestUseCase(authRepository), []);
  const signOutUseCase = useMemo(() => new SignOutUseCase(authRepository), []);
  const getCurrentUserUseCase = useMemo(() => new GetCurrentUserUseCase(authRepository), []);
  const watchAuthStateUseCase = useMemo(() => new WatchAuthStateUseCase(authRepository), []);

  useEffect(() => {
    let isMounted = true;

    // Check if Google OAuth is configured on Supabase
    authRepository.isGoogleOAuthAvailable().then((available) => {
      if (isMounted) setIsGoogleOAuthAvailable(available);
    });

    // Initial session retrieval
    getCurrentUserUseCase.execute().then(({ user: initialUser, session: initialSession }) => {
      if (isMounted) {
        setUser(initialUser);
        setSession(initialSession);
        setIsLoading(false);
      }
    });

    // Subscribe to Auth State Changes
    const unsubscribe = watchAuthStateUseCase.execute((newUser, newSession) => {
      if (isMounted) {
        setUser(newUser);
        setSession(newSession);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [getCurrentUserUseCase, watchAuthStateUseCase]);

  const registerWithEmail = useCallback(async (data: { name: string; email: string; password?: string }): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await registerWithEmailUseCase.execute(data);
      if (res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, [registerWithEmailUseCase]);

  const signInWithEmail = useCallback(async (email: string, password?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await signInWithEmailUseCase.execute(email, password);
      if (res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, [signInWithEmailUseCase]);

  const signInAsGuest = useCallback(async (name?: string): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      const res = await signInAsGuestUseCase.execute(name);
      if (res.user && res.session) {
        setUser(res.user);
        setSession(res.session);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  }, [signInAsGuestUseCase]);

  const signInWithGoogle = useCallback(async (options?: { redirectTo?: string }) => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogleUseCase.execute(options);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
      }
      return {
        success: result.success,
        error: result.error,
        providerNotEnabled: result.providerNotEnabled,
        redirectUrl: result.redirectUrl,
      };
    } finally {
      setIsLoading(false);
    }
  }, [signInWithGoogleUseCase]);

  const signInWithDevAccount = useCallback(async (persona?: { email?: string; name?: string; avatarUrl?: string }) => {
    setIsLoading(true);
    try {
      const defaultPersona = {
        email: persona?.email || 'warga@policysnap.id',
        name: persona?.name || 'Warga Kebijakan',
        avatarUrl: persona?.avatarUrl || '',
      };
      const result = await signInWithDevAccountUseCase.execute(defaultPersona);
      if (result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
      }
    } finally {
      setIsLoading(false);
    }
  }, [signInWithDevAccountUseCase]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOutUseCase.execute();
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [signOutUseCase]);

  // Role & provider berasal dari sesi server (bukan flag localStorage yang bisa diubah pengguna)
  const isGuest = user?.provider === 'guest';
  const isAdmin = user?.role === 'admin';

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user),
      isGuest,
      isAdmin,
      isLoading,
      isGoogleOAuthAvailable,
      registerWithEmail,
      signInWithEmail,
      signInAsGuest,
      signInWithGoogle,
      signInWithDevAccount,
      signOut,
    }),
    [
      user,
      session,
      isGuest,
      isAdmin,
      isLoading,
      isGoogleOAuthAvailable,
      registerWithEmail,
      signInWithEmail,
      signInAsGuest,
      signInWithGoogle,
      signInWithDevAccount,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
