import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Send, RefreshCw, Wallet, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import SendModal from './SendModal';
import { deriveLtcAddress, fetchLtcBalance } from '@/lib/ltcUtils';

interface WalletDashboardProps {
  wallet: ethers.HDNodeWallet;
  rpcUrl: string;
  mnemonic: string;
}

type Coin = 'eth' | 'ltc';

const COINS: { id: Coin; label: string; symbol: string; icon: string }[] = [
  { id: 'eth', label: 'Ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'ltc', label: 'Litecoin', symbol: 'LTC', icon: 'Ł' },
];

const WalletDashboard = ({ wallet, rpcUrl, mnemonic }: WalletDashboardProps) => {
  const [selectedCoin, setSelectedCoin] = useState<Coin>('eth');
  const [copied, setCopied] = useState(false);
  const [showSend, setShowSend] = useState(false);

  // ETH state
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [ethLoading, setEthLoading] = useState(false);

  // LTC state
  const [ltcAddress, setLtcAddress] = useState('');
  const [ltcBalance, setLtcBalance] = useState<string | null>(null);
  const [ltcLoading, setLtcLoading] = useState(false);

  const ethAddress = wallet.address;

  // Derive LTC address on mount
  useEffect(() => {
    if (mnemonic) {
      try {
        const addr = deriveLtcAddress(mnemonic);
        setLtcAddress(addr);
      } catch (e) {
        console.error('LTC derivation error:', e);
      }
    }
  }, [mnemonic]);

  const fetchEthBalance = async () => {
    try {
      setEthLoading(true);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const bal = await provider.getBalance(ethAddress);
      setEthBalance(ethers.formatEther(bal));
    } catch {
      setEthBalance('—');
    } finally {
      setEthLoading(false);
    }
  };

  const fetchLtcBal = async () => {
    if (!ltcAddress) return;
    try {
      setLtcLoading(true);
      const bal = await fetchLtcBalance(ltcAddress);
      setLtcBalance(bal);
    } catch {
      setLtcBalance('—');
    } finally {
      setLtcLoading(false);
    }
  };

  useEffect(() => {
    fetchEthBalance();
  }, [ethAddress]);

  useEffect(() => {
    if (ltcAddress) fetchLtcBal();
  }, [ltcAddress]);

  const currentAddress = selectedCoin === 'eth' ? ethAddress : ltcAddress;
  const currentBalance = selectedCoin === 'eth' ? ethBalance : ltcBalance;
  const isLoading = selectedCoin === 'eth' ? ethLoading : ltcLoading;
  const coinInfo = COINS.find((c) => c.id === selectedCoin)!;
  const shortAddress = currentAddress
    ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}`
    : '...';

  const handleCopy = () => {
    if (!currentAddress) return;
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    if (selectedCoin === 'eth') fetchEthBalance();
    else fetchLtcBal();
  };

  const explorerUrl =
    selectedCoin === 'eth'
      ? `https://etherscan.io/address/${ethAddress}`
      : `https://blockchair.com/litecoin/address/${ltcAddress}`;

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
            <p className="text-xs text-muted-foreground">Non-Custodial</p>
          </div>
        </div>

        {/* Coin Tabs */}
        <div className="flex gap-2 mb-5">
          {COINS.map((coin) => (
            <motion.button
              key={coin.id}
              className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                selectedCoin === coin.id
                  ? 'gradient-beige text-primary-foreground'
                  : 'glass text-muted-foreground'
              }`}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCoin(coin.id)}
            >
              <span className="text-lg">{coin.icon}</span>
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
                ? `${parseFloat(currentBalance || '0').toFixed(selectedCoin === 'eth' ? 4 : 8)}`
                : '—'}
            </p>
            <span className="text-muted-foreground text-lg">{coinInfo.symbol}</span>
            <button onClick={handleRefresh} className="ml-2">
              <RefreshCw
                size={14}
                className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
              />
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
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 glass rounded-xl px-4 py-2.5"
          >
            {copied ? (
              <Check size={14} className="text-success" />
            ) : (
              <Copy size={14} className="text-muted-foreground" />
            )}
            <span className="text-xs font-mono text-foreground">{shortAddress}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            className="flex-1 h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (selectedCoin === 'eth') {
                setShowSend(true);
              }
            }}
            style={{ opacity: selectedCoin === 'ltc' ? 0.5 : 1 }}
          >
            <Send size={18} />
            {selectedCoin === 'ltc' ? 'Send (Coming Soon)' : 'Send'}
          </motion.button>
          <motion.button
            className="h-14 w-14 rounded-2xl glass flex items-center justify-center"
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open(explorerUrl, '_blank')}
          >
            <ExternalLink size={18} className="text-muted-foreground" />
          </motion.button>
        </div>

        {selectedCoin === 'ltc' && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            LTC empfangen funktioniert bereits — sende LTC an die Adresse oben.
          </p>
        )}
      </motion.div>

      <SendModal open={showSend} onClose={() => setShowSend(false)} wallet={wallet} rpcUrl={rpcUrl} />
    </>
  );
};

export default WalletDashboard;
