import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
} from './config';
import { CloudUser, syncUserProfile } from './db';
import { sounds } from '../utils/soundEffects';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  cloudUser: CloudUser | null;
  isLoadingAuth: boolean;
  isOwner: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const OWNER_EMAIL = 'chunnakumar3675@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const isOwner = Boolean(
    currentUser && (currentUser.email === OWNER_EMAIL || cloudUser?.role === 'owner')
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await syncUserProfile(user, user.displayName || 'Boss');
          setCloudUser(profile);
        } catch (err) {
          console.warn('[Auth] Failed to sync user profile to Cloud Firestore:', err);
        }
      } else {
        setCloudUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    sounds.playClickSound();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(result.user, result.user.displayName || 'Boss');
      setCloudUser(profile);
      sounds.playSuccessChime();
    } catch (err) {
      console.error('[Auth] Google sign-in failed:', err);
      sounds.playAlertTone();
      throw err;
    }
  };

  const logout = async () => {
    sounds.playClickSound();
    try {
      await signOut(auth);
      setCloudUser(null);
      sounds.playSuccessChime();
    } catch (err) {
      console.error('[Auth] Logout failed:', err);
      throw err;
    }
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      const profile = await syncUserProfile(currentUser, currentUser.displayName || 'Boss');
      setCloudUser(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        cloudUser,
        isLoadingAuth,
        isOwner,
        signInWithGoogle,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
