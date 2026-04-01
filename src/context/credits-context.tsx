'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface CreditsContextValue {
  balance: number;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
}

const CreditsContext = createContext<CreditsContextValue | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
    } catch {
      // silently fail - balance stays at current value
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <CreditsContext.Provider value={{ balance, refreshBalance, isLoading }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits(): CreditsContextValue {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}
