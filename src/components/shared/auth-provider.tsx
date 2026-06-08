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

  // Pause Firestore listeners when app goes to background to save battery/memory,
  // and restart them when the user comes back. This is critical for iOS PWA where
  // the OS will kill the app if it uses too much background resources.
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Going to background — tear down real-time listeners to save battery
        console.log('[Auth] App backgrounded — pausing sync listeners');
        syncCleanupRef.current.forEach((unsub) => unsub());
        syncCleanupRef.current = [];
        return;
      }

      // Resumed from background — re-pull missed changes and restart listeners
      console.log('[Auth] App resumed — restarting sync');
      pullFromFirestore(user.uid).catch((err) => {
        console.warn('[Auth] Re-pull after resume failed:', err);
      });
      const unsubscribers = startRealtimeSync(user.uid);
      syncCleanupRef.current = unsubscribers;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}
