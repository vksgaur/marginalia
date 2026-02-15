'use client';

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { onAuthChange, isFirebaseConfigured } from '@/lib/firebase';
import { pullFromFirestore, startRealtimeSync } from '@/lib/sync';
import type { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isConfigured: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();
  const syncCleanupRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  // Start Firestore sync when user signs in
  useEffect(() => {
    if (!user) {
      // Clean up sync listeners when user signs out
      syncCleanupRef.current.forEach((unsub) => unsub());
      syncCleanupRef.current = [];
      return;
    }

    // Pull existing data from Firestore, then start real-time listener
    pullFromFirestore(user.uid)
      .catch((err) => {
        console.error('[Auth] Initial pull from Firestore failed:', err);
      })
      .finally(() => {
        // Always start real-time sync, even if initial pull failed
        const unsubscribers = startRealtimeSync(user.uid);
        syncCleanupRef.current = unsubscribers;
      });

    return () => {
      syncCleanupRef.current.forEach((unsub) => unsub());
      syncCleanupRef.current = [];
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}
