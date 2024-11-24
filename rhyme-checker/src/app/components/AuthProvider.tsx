"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';

interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
}

interface AuthContextType {
  isLoggedIn: boolean | null;
  user: User | null;
  loading: boolean;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

// Firebase初期化
const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

// 認証コンテキストの作成
export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: null,
  user: null,
  loading: true
});

export const useAuth = (): AuthContextType => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setIsLoggedIn(!!user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isLoggedIn, user, loading };
};

// コンテキストを使用するためのカスタムフック
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};