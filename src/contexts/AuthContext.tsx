"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  kdfSalt?: string;
  encryptedMasterKey?: string;
  masterKeyIv?: string;
}

interface AuthContextType {
  user: User | null;
  masterKey: string | null;
  isLoading: boolean;
  login: (user: User, masterKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          const storedKey = sessionStorage.getItem('masterKey');
          if (storedKey) {
            setMasterKey(storedKey);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback((newUser: User, newMasterKey: string) => {
    setUser(newUser);
    setMasterKey(newMasterKey);
    sessionStorage.setItem('masterKey', newMasterKey);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMasterKey(null);
    sessionStorage.removeItem('masterKey');
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, masterKey, isLoading, login, logout }),
    [user, masterKey, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
