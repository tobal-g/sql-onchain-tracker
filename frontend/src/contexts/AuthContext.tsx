import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { login as loginApi, refresh as refreshApi, logout as logoutApi } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!accessToken;

  const clearTokens = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }, []);

  const saveToken = useCallback((token: string, expiresIn: number) => {
    setAccessToken(token);
    localStorage.setItem(TOKEN_KEY, token);
    // Store expiry time (current time + expires in seconds - 30 second buffer)
    const expiryTime = Date.now() + (expiresIn - 30) * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await refreshApi();
      saveToken(response.accessToken, response.expiresIn);
      return true;
    } catch {
      clearTokens();
      return false;
    }
  }, [saveToken, clearTokens]);

  // Check if token needs refresh
  const shouldRefreshToken = useCallback((): boolean => {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    return Date.now() >= parseInt(expiryTime, 10);
  }, []);

  // Initial auth check and token refresh
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (storedToken) {
        if (shouldRefreshToken()) {
          // Token expired or about to expire, try to refresh
          await refreshToken();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [shouldRefreshToken, refreshToken]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!accessToken) return;

    const checkAndRefresh = async () => {
      if (shouldRefreshToken()) {
        await refreshToken();
      }
    };

    // Check every minute
    const intervalId = setInterval(checkAndRefresh, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [accessToken, shouldRefreshToken, refreshToken]);

  const login = useCallback(async (password: string) => {
    const response = await loginApi(password);
    saveToken(response.accessToken, response.expiresIn);
  }, [saveToken]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore errors during logout
    } finally {
      clearTokens();
    }
  }, [clearTokens]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        accessToken,
        login,
        logout,
      }}
    >
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
