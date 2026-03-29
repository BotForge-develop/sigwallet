import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Send, RefreshCw, Wallet, ExternalLink, Zap, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SendModal from './SendModal';
import BuyCryptoModal from './BuyCryptoModal';
import { saveWalletAddresses } from '@/hooks/useWalletAddresses';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  COINS,
  CoinType,
  deriveAddress,
  fetchBalance,
  getExplorerUrl,
} from '@/lib/cryptoUtils';
import { ethers } from 'ethers';

interface WalletDashboardProps {
  wallet: ethers.HDNodeWallet;
  rpcUrl: string;
  mnemonic: string;
}

const COIN_ID_MAP: Record<string, string> = {
  btc: 'bitcoin', eth: 'ethereum', ltc: 'litecoin',
};

const WalletDashboard = ({ wallet, rpcUrl, mnemonic }: WalletDashboardProps) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinType>('eth');
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const { prices } = useCryptoPrices();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<Record<CoinType, string>>({ eth: '', btc: '', ltc: '' });
  const [balances, setBalances] = useState<Record<CoinType, string | null>>({ eth: null, btc: null, ltc: null });
  const [loading, setLoading] = useState<Record<CoinType, boolean>>({ eth: false, btc: false, ltc: false });

  // Derive all addresses on mount & save to localStorage + DB
  useEffect(() => {
    if (!mnemonic) return;
    const derived: Record<CoinType, string> = { eth: '', btc: '', ltc: '' };
    for (const coin of COINS) {
      try {
        derived[coin.id] = deriveAddress(mnemonic, coin.id);
      } catch (e) {
        console.error(`Failed to derive ${coin.id}:`, e);
      }
    }
    setAddresses(derived);
    saveWalletAddresses(derived);

    // Sync to DB for receive-by-ID
    if (user?.id) {
      for (const coin of COINS) {
        if (!derived[coin.id]) continue;
        supabase.from('wallet_addresses').upsert(
          { user_id: user.id, coin: coin.id, address: derived[coin.id], updated_at: new Date().toISOString() },
          { onConflict: 'user_id,coin' }
        ).then(({ error }) => {
          if (error) console.error(`Failed to sync ${coin.id} address:`, error);
        });
      }
    }
  }, [mnemonic, user?.id]);

  const refreshBalance = async (coin: CoinType) => {
    const addr = addresses[coin];
    if (!addr) return;
    setLoading(prev => ({ ...prev, [coin]: true }));
    const bal = await fetchBalance(addr, coin, coin === 'eth' ? rpcUrl : undefined);
    setBalances(prev => ({ ...prev, [coin]: bal }));
    setLoading(prev => ({ ...prev, [coin]: false }));
  };

  useEffect(() => {
    if (addresses[selectedCoin]) {
      refreshBalance(selectedCoin);
    }
  }, [addresses, selectedCoin]);

  const currentAddress = addresses[selectedCoin];
  const currentBalance = balances[selectedCoin];
  const isLoading = loading[selectedCoin];
  const coinInfo = COINS.find(c => c.id === selectedCoin)!;
  const shortAddress = currentAddress
    ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`
    : '...';

  const balNum = currentBalance && currentBalance !== '—' ? parseFloat(currentBalance) : 0;
  const usdPrice = prices.find(p => p.id === COIN_ID_MAP[selectedCoin])?.current_price || 0;
  const usdValue = balNum * usdPrice;

  const handleCopy = () => {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.div className="px-6 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-beige flex items-center justify-center">
            <Wallet size={20} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Multi-Chain Wallet</p>
            <p className="text-xs text-muted-foreground">Non-Custodial · 3 Chains</p>
          </div>
        </div>

        {/* Coin Tabs */}
        <div className="flex gap-2 mb-5">
          {COINS.map(coin => (
            <motion.button
              key={coin.id}
              className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                selectedCoin === coin.id
                  ? 'gradient-beige text-primary-foreground'
                  : 'glass text-muted-foreground'
              }`}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCoin(coin.id)}
            >
              <span className="text-base">{coin.icon}</span>
              {coin.symbol}
            </motion.button>
          ))}
        </div>

        {/* Balance Card */}
        <div className="glass rounded-2xl p-5 mb-5 text-center">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
            {coinInfo.label} Balance
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {currentBalance !== null
                ? parseFloat(currentBalance || '0').toFixed(selectedCoin === 'eth' ? 4 : 8)
                : '—'}
            </p>
            <span className="text-muted-foreground text-lg">{coinInfo.symbol}</span>
            <button onClick={() => refreshBalance(selectedCoin)} className="ml-2">
              <RefreshCw size={14} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {usdValue > 0 && (
            <p className="text-sm text-beige-muted mt-1">
              ≈ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* QR Code */}
        <motion.div
          className="glass rounded-2xl p-5 mb-5 flex flex-col items-center"
          style={{ perspective: 1000 }}
        >
          <motion.div
            className="bg-foreground rounded-xl p-3 mb-4"
            whileHover={{ rotateY: 10, rotateX: -5, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <QRCodeSVG
              value={currentAddress || ''}
              size={140}
              bgColor="hsl(0, 0%, 100%)"
              fgColor="hsl(0, 0%, 0%)"
              level="M"
            />
          </motion.div>
          <button onClick={handleCopy} className="flex items-center gap-2 glass rounded-xl px-4 py-2.5">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
            <span className="text-xs font-mono text-foreground">{shortAddress}</span>
          </button>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            className="flex-1 h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSend(true)}
          >
            <Send size={18} />
            Send
          </motion.button>
          <motion.button
            className="flex-1 h-14 rounded-2xl glass text-foreground font-semibold flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowBuy(true)}
          >
            <Zap size={18} className="text-beige" />
            Buy
          </motion.button>
          <motion.button
            className="h-14 w-14 rounded-2xl glass flex items-center justify-center"
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open(getExplorerUrl(currentAddress, selectedCoin), '_blank')}
          >
            <ExternalLink size={18} className="text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      <SendModal
        open={showSend}
        onClose={() => setShowSend(false)}
        mnemonic={mnemonic}
        coin={selectedCoin}
        rpcUrl={rpcUrl}
        usdPrice={usdPrice}
      />
      <BuyCryptoModal
        open={showBuy}
        onClose={() => setShowBuy(false)}
        defaultCoin={selectedCoin}
        walletAddress={currentAddress}
      />
    </>
  );
};

export default WalletDashboard;
