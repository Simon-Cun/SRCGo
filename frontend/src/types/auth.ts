export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  username: string | null;
}

export interface StoredAuth {
  isAuthenticated: boolean;
  username: string | null;
  isDemoMode: boolean;
}

export interface StoredCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}
