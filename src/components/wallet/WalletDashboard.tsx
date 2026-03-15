import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Send, RefreshCw, Wallet, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SendModal from './SendModal';
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

const WalletDashboard = ({ wallet, rpcUrl, mnemonic }: WalletDashboardProps) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinType>('eth');
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);

  // Addresses for each coin
  const [addresses, setAddresses] = useState<Record<CoinType, string>>({ eth: '', btc: '', ltc: '' });
  const [balances, setBalances] = useState<Record<CoinType, string | null>>({ eth: null, btc: null, ltc: null });
  const [loading, setLoading] = useState<Record<CoinType, boolean>>({ eth: false, btc: false, ltc: false });

  // Derive all addresses on mount
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
  }, [mnemonic]);

  const refreshBalance = async (coin: CoinType) => {
    const addr = addresses[coin];
    if (!addr) return;
    setLoading(prev => ({ ...prev, [coin]: true }));
    const bal = await fetchBalance(addr, coin, coin === 'eth' ? rpcUrl : undefined);
    setBalances(prev => ({ ...prev, [coin]: bal }));
    setLoading(prev => ({ ...prev, [coin]: false }));
  };

  // Fetch balance when address is ready or coin changes
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
        </div>

        {/* QR Code */}
        <div className="glass rounded-2xl p-5 mb-5 flex flex-col items-center">
          <div className="bg-foreground rounded-xl p-3 mb-4">
            <QRCodeSVG
              value={currentAddress || ''}
              size={140}
              bgColor="hsl(0, 0%, 100%)"
              fgColor="hsl(0, 0%, 0%)"
              level="M"
            />
          </div>
          <button onClick={handleCopy} className="flex items-center gap-2 glass rounded-xl px-4 py-2.5">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
            <span className="text-xs font-mono text-foreground">{shortAddress}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            className="flex-1 h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSend(true)}
          >
            <Send size={18} />
            Send {coinInfo.symbol}
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
      />
    </>
  );
};

export default WalletDashboard;
