'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile } from '@/lib/firebase/auth';
import type { UserProfile, UserRole } from '@/lib/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setState({
            user,
            profile,
            role: profile?.role ?? null,
            loading: false,
            error: null,
          });
        } catch {
          setState({
            user,
            profile: null,
            role: null,
            loading: false,
            error: 'Failed to load profile',
          });
        }
      } else {
        setState({ user: null, profile: null, role: null, loading: false, error: null });
      }
    });

    return () => unsubscribe();
  }, []);

  return state;
}
