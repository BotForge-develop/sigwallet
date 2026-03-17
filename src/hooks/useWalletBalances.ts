import { useState, useEffect, useCallback } from 'react';
import { CoinType, fetchBalance } from '@/lib/cryptoUtils';

const RPC_URL = 'https://eth.llamarpc.com';

export function useWalletBalances(addresses: Record<string, string> | null) {
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!addresses) return;
    setLoading(true);
    const results: Record<string, string> = {};
    const coins = Object.keys(addresses) as CoinType[];
    
    await Promise.all(
      coins.map(async (coin) => {
        if (!addresses[coin]) return;
        try {
          results[coin] = await fetchBalance(addresses[coin], coin, coin === 'eth' ? RPC_URL : undefined);
        } catch {
          results[coin] = '—';
        }
      })
    );
    
    setBalances(results);
    setLoading(false);
  }, [addresses]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { balances, loading, refetch: fetchAll };
}
