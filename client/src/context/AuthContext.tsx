import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api, setPin as setApiPin } from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  authenticate: (pin: string) => Promise<boolean>;
  logout: () => void;
  requireAuth: (callback: () => void) => void;
  showPinDialog: boolean;
  setShowPinDialog: (show: boolean) => void;
  pendingCallback: (() => void) | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const authenticate = useCallback(async (pin: string): Promise<boolean> => {
    try {
      await api('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      setApiPin(pin);
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setApiPin(null);
    setIsAuthenticated(false);
  }, []);

  const requireAuth = useCallback((callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      setPendingCallback(() => callback);
      setShowPinDialog(true);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authenticate,
        logout,
        requireAuth,
        showPinDialog,
        setShowPinDialog,
        pendingCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
