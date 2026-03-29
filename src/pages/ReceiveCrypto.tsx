import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COINS, CoinType } from '@/lib/cryptoUtils';

const ReceiveCrypto = () => {
  const [params] = useSearchParams();
  const userId = params.get('uid');
  const coin = (params.get('coin') as CoinType) || 'eth';

  const [address, setAddress] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinType>(coin);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      const [{ data: addr }, { data: profile }] = await Promise.all([
        supabase.from('wallet_addresses').select('address').eq('user_id', userId).eq('coin', selectedCoin).maybeSingle(),
        supabase.from('profiles').select('display_name').eq('user_id', userId).maybeSingle(),
      ]);
      setAddress(addr?.address || null);
      setDisplayName(profile?.display_name || 'User');
      setLoading(false);
    };
    load();
  }, [userId, selectedCoin]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const coinInfo = COINS.find(c => c.id === selectedCoin)!;

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted-foreground text-sm">Ungültiger Link — keine User-ID angegeben.</p>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen px-6 pt-16 pb-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl gradient-beige flex items-center justify-center mb-4">
          <Wallet size={28} className="text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1">Sende Crypto an {displayName}</h1>
        <p className="text-xs text-muted-foreground mb-6">Wähle eine Coin und scanne den QR-Code</p>

        {/* Coin selector */}
        <div className="flex gap-2 mb-6 w-full max-w-xs">
          {COINS.map(c => (
            <motion.button
              key={c.id}
              className={`flex-1 h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                selectedCoin === c.id ? 'gradient-beige text-primary-foreground' : 'glass text-muted-foreground'
              }`}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCoin(c.id)}
            >
              <span>{c.icon}</span>
              {c.symbol}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="w-8 h-8 rounded-full border-2 border-beige border-t-transparent animate-spin" />
        ) : address ? (
          <>
            <div className="glass rounded-2xl p-5 mb-4">
              <div className="bg-foreground rounded-xl p-3">
                <QRCodeSVG value={address} size={180} bgColor="#fff" fgColor="#000" level="M" />
              </div>
            </div>
            <button onClick={handleCopy} className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 mb-2">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-muted-foreground" />}
              <span className="text-xs font-mono text-foreground">
                {address.slice(0, 8)}...{address.slice(-6)}
              </span>
            </button>
            <p className="text-[10px] text-muted-foreground">
              Nur {coinInfo.label} ({coinInfo.symbol}) an diese Adresse senden!
            </p>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Keine {coinInfo.symbol}-Adresse für diesen User gefunden.</p>
        )}
      </div>
    </motion.div>
  );
};

export default ReceiveCrypto;
