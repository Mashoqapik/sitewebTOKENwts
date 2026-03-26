import React, { createContext, useContext, useEffect, useState } from "react";

const VAULT_CODE = "DEDEJTEDOX123#";
const STORAGE_KEY = "vault_authenticated";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

interface VaultAuthContextType {
  isAuthenticated: boolean;
  authenticate: (code: string) => boolean;
  logout: () => void;
}

const VaultAuthContext = createContext<VaultAuthContextType>({
  isAuthenticated: false,
  authenticate: () => false,
  logout: () => {},
});

export function VaultAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const { timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < SESSION_DURATION) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const authenticate = (code: string): boolean => {
    if (code === VAULT_CODE) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ timestamp: Date.now() }));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return (
    <VaultAuthContext.Provider value={{ isAuthenticated, authenticate, logout }}>
      {children}
    </VaultAuthContext.Provider>
  );
}

export const useVaultAuth = () => useContext(VaultAuthContext);
