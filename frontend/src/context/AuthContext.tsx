import { ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';
import type { AuthState, LoginResult, StoredAuth, StoredCredentials } from '@/types/auth';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthContextValue extends AuthState {
  login: (username: string, password: string, rememberMe: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  silentReAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const loadStoredAuth = (): StoredAuth => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (raw) return JSON.parse(raw) as StoredAuth;
  } catch {
    // ignore
  }
  return { isAuthenticated: false, username: null, isDemoMode: false };
};

const saveStoredAuth = (auth: StoredAuth) => {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(auth));
};

const loadStoredCredentials = (): StoredCredentials | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (raw) return JSON.parse(raw) as StoredCredentials;
  } catch {
    // ignore
  }
  return null;
};

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const storedAuth = loadStoredAuth();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: storedAuth.isAuthenticated,
    isLoading: false,
    isDemoMode: storedAuth.isDemoMode,
    username: storedAuth.username,
  });
  const isReAuthing = useRef(false);

  const login = useCallback(
    async (username: string, password: string, rememberMe: boolean): Promise<LoginResult> => {
      setState((s) => ({ ...s, isLoading: true }));

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = (await res.json()) as {
          success: boolean;
          username?: string;
          isDemoMode?: boolean;
          error?: string;
        };

        if (!res.ok || !data.success) {
          setState((s) => ({ ...s, isLoading: false }));
          return { success: false, error: data.error ?? 'Login failed' };
        }

        const newAuth: StoredAuth = {
          isAuthenticated: true,
          username: data.username ?? username,
          isDemoMode: data.isDemoMode ?? false,
        };

        saveStoredAuth(newAuth);

        if (rememberMe) {
          localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify({ username, password }));
        } else {
          localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
        }

        setState({
          isAuthenticated: true,
          isLoading: false,
          isDemoMode: newAuth.isDemoMode,
          username: newAuth.username,
        });

        return { success: true };
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
        return { success: false, error: 'Network error. Please try again.' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
    } catch {
      // continue regardless
    }

    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);

    setState({ isAuthenticated: false, isLoading: false, isDemoMode: false, username: null });
  }, []);

  const silentReAuth = useCallback(async (): Promise<boolean> => {
    if (isReAuthing.current) return false;
    isReAuthing.current = true;

    const creds = loadStoredCredentials();
    if (!creds) {
      isReAuthing.current = false;
      await logout();
      return false;
    }

    const result = await login(creds.username, creds.password, true);
    isReAuthing.current = false;

    if (!result.success) {
      await logout();
      return false;
    }

    return true;
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, silentReAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export { AuthProvider, useAuth };
