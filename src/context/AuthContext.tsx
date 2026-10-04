import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../firebase/config';
import { saveUserProfile } from '../firebase/services';
import { UserProfile } from '../types/chat';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  isFirebaseConnected: false,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
  updateUserPreferences: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  useEffect(() => {
    // Validate connection to Firestore as required by SKILL.md
    testFirestoreConnection().then((ok) => {
      setIsFirebaseConnected(ok);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile: UserProfile = {
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'Local AI Pioneer',
          photoURL: currentUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(profile);
        try {
          await saveUserProfile(profile);
        } catch (e) {
          console.error('Failed saving profile on login:', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in with Google error:', error);
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    try {
      await saveUserProfile(updated);
    } catch (e) {
      console.error('Error updating user preferences:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isFirebaseConnected,
        signInWithGoogle,
        signOutUser,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
