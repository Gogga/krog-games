import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  getStoredToken,
  setStoredToken,
  removeStoredToken
} from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        const result = await getCurrentUser();
        if (result.success && result.user) {
          setUser(result.user);
          setToken(storedToken);
        } else {
          // Token invalid, clear it
          removeStoredToken();
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const result = await apiLogin(usernameOrEmail, password);
    if (result.success && result.user && result.token) {
      setUser(result.user);
      setToken(result.token);
      setStoredToken(result.token);
    }
    return { success: result.success, message: result.message };
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const result = await apiRegister(username, email, password);
    if (result.success && result.user && result.token) {
      setUser(result.user);
      setToken(result.token);
      setStoredToken(result.token);
    }
    return { success: result.success, message: result.message };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    removeStoredToken();
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
