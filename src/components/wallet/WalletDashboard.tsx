import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Send, RefreshCw, Wallet, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import SendModal from './SendModal';

interface WalletDashboardProps {
  wallet: ethers.HDNodeWallet;
  rpcUrl: string;
}

const WalletDashboard = ({ wallet, rpcUrl }: WalletDashboardProps) => {
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [showSend, setShowSend] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const address = wallet.address;
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const fetchBalance = async () => {
    try {
      setLoadingBalance(true);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
    } catch {
      setBalance('—');
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.div
        className="px-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-beige flex items-center justify-center">
            <Wallet size={20} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ethereum Wallet</p>
            <p className="text-xs text-muted-foreground">Non-Custodial</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="glass rounded-2xl p-5 mb-5 text-center">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Balance</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold text-foreground tabular-nums">
              {balance !== null ? `${parseFloat(balance || '0').toFixed(4)}` : '—'}
            </p>
            <span className="text-muted-foreground text-lg">ETH</span>
            <button onClick={fetchBalance} className="ml-2">
              <RefreshCw size={14} className={`text-muted-foreground ${loadingBalance ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="glass rounded-2xl p-5 mb-5 flex flex-col items-center">
          <div className="bg-foreground rounded-xl p-3 mb-4">
            <QRCodeSVG
              value={address}
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
            Send
          </motion.button>
          <motion.button
            className="h-14 w-14 rounded-2xl glass flex items-center justify-center"
            whileTap={{ scale: 0.97 }}
            onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
          >
            <ExternalLink size={18} className="text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      <SendModal
        open={showSend}
        onClose={() => setShowSend(false)}
        wallet={wallet}
        rpcUrl={rpcUrl}
      />
    </>
  );
};

export default WalletDashboard;
