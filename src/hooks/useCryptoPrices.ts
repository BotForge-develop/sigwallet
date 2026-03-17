import { useState, useEffect, useCallback } from 'react';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  current_price: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: number[];
}

const COINS_MAP: Record<string, { symbol: string; icon: string }> = {
  bitcoin: { symbol: 'BTC', icon: '₿' },
  ethereum: { symbol: 'ETH', icon: 'Ξ' },
  litecoin: { symbol: 'LTC', icon: 'Ł' },
  solana: { symbol: 'SOL', icon: '◎' },
  toncoin: { symbol: 'TON', icon: '💎' },
  ripple: { symbol: 'XRP', icon: '✕' },
  dogecoin: { symbol: 'DOGE', icon: '🐕' },
  cardano: { symbol: 'ADA', icon: '₳' },
};

const COIN_IDS = Object.keys(COINS_MAP).join(',');

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
      );
      if (!res.ok) return;
      const data = await res.json();
      const mapped: CryptoPrice[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: COINS_MAP[coin.id]?.symbol || coin.symbol.toUpperCase(),
        name: coin.name,
        icon: COINS_MAP[coin.id]?.icon || '●',
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h || 0,
        sparkline_in_7d: coin.sparkline_in_7d?.price?.slice(-24) || [],
      }));
      setPrices(mapped);
    } catch (e) {
      console.error('CoinGecko fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, refetch: fetchPrices };
}
