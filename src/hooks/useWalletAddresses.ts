import { useState, useEffect, useCallback } from 'react';
import { CoinType } from '@/lib/cryptoUtils';

const STORAGE_KEY = 'wallet_addresses';

export function saveWalletAddresses(addresses: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

export function useWalletAddresses() {
  const [addresses, setAddresses] = useState<Record<CoinType, string> | null>(null);

  const refresh = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAddresses(JSON.parse(stored));
      } catch {
        setAddresses(null);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    // Listen for storage changes from other tabs/components
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

  const hasWallet = addresses !== null && Object.values(addresses).some(a => !!a);

  return { addresses, hasWallet, refresh };
}
