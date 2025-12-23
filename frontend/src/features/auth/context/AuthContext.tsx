import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../../api/types';
import { clearAuthStorage, loadStoredUser, persistUser } from './auth.storage';

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬스토리지에서 사용자 정보 복원
    const storedUser = loadStoredUser();
    if (storedUser) setUserState(storedUser);
    setIsLoading(false);
  }, []);

  const setUser = (user: User | null) => {
    setUserState(user);
    persistUser(user);
  };

  const logout = () => {
    clearAuthStorage();
    setUserState(null);
  };

  const value = {
    user,
    setUser,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


