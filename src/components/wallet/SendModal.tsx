import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, AlertCircle, CheckCircle, ExternalLink, DollarSign, Coins } from 'lucide-react';
import { sendTransaction, COINS, CoinType, getTxExplorerUrl } from '@/lib/cryptoUtils';

interface SendModalProps {
  open: boolean;
  onClose: () => void;
  mnemonic: string;
  coin: CoinType;
  rpcUrl: string;
  usdPrice?: number;
}

const SendModal = ({ open, onClose, mnemonic, coin, rpcUrl, usdPrice }: SendModalProps) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [inputMode, setInputMode] = useState<'usd' | 'crypto'>('usd');
  const [status, setStatus] = useState<'idle' | 'signing' | 'sent' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [error, setError] = useState('');

  const coinInfo = COINS.find(c => c.id === coin)!;

  const converted = useMemo(() => {
    const val = parseFloat(amount) || 0;
    if (!usdPrice || usdPrice === 0) return { crypto: val.toString(), usd: '0' };
    if (inputMode === 'usd') {
      return { crypto: (val / usdPrice).toFixed(8), usd: val.toFixed(2) };
    }
    return { crypto: val.toFixed(8), usd: (val * usdPrice).toFixed(2) };
  }, [amount, inputMode, usdPrice]);

  const cryptoAmount = inputMode === 'usd' ? converted.crypto : amount;

  const handleSend = async () => {
    if (!mnemonic || !to || !cryptoAmount || parseFloat(cryptoAmount) <= 0) return;
    try {
      setStatus('signing');
      setError('');
      const result = await sendTransaction(mnemonic, coin, to, cryptoAmount, rpcUrl);
      setTxHash(result.txHash);
      setExplorerUrl(result.explorerUrl);
      setStatus('sent');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setTo(''); setAmount(''); setStatus('idle'); setTxHash(''); setExplorerUrl(''); setError('');
    onClose();
  };

  const placeholder = coin === 'eth' ? '0x...' : coin === 'btc' ? '1... or bc1...' : 'L... or ltc1...';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/60 backdrop-blur-2xl z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="glass-liquid rounded-t-3xl p-6 safe-bottom border-0">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="text-xl">{coinInfo.icon}</span>
                  Send {coinInfo.symbol}
                </h3>
                <button onClick={handleClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {status === 'idle' && (
                <>
                  <div className="mb-3">
                    <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Recipient</label>
                    <input
                      className="w-full h-11 rounded-xl glass px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none font-mono backdrop-blur-xl"
                      placeholder={placeholder}
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</label>
                      {usdPrice && (
                        <button
                          className="flex items-center gap-1 text-[10px] text-beige font-medium px-2 py-0.5 rounded-lg glass"
                          onClick={() => { setInputMode(prev => prev === 'usd' ? 'crypto' : 'usd'); setAmount(''); }}
                        >
                          {inputMode === 'usd' ? <DollarSign size={10} /> : <Coins size={10} />}
                          {inputMode === 'usd' ? 'USD' : coinInfo.symbol}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full h-11 rounded-xl glass px-4 pr-16 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none backdrop-blur-xl"
                        placeholder={inputMode === 'usd' ? '0.00' : '0.0'}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        step={inputMode === 'usd' ? '0.01' : coin === 'eth' ? '0.001' : '0.00000001'}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">
                        {inputMode === 'usd' ? 'USD' : coinInfo.symbol}
                      </span>
                    </div>

                    {usdPrice && amount && parseFloat(amount) > 0 && (
                      <motion.p className="text-[10px] text-muted-foreground mt-1.5 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {inputMode === 'usd' ? <>≈ {parseFloat(converted.crypto).toFixed(6)} {coinInfo.symbol}</> : <>≈ ${converted.usd}</>}
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    className="w-full h-12 rounded-2xl gradient-beige text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={!to || !amount || parseFloat(amount) <= 0}
                  >
                    <Send size={16} />
                    Send {cryptoAmount && parseFloat(cryptoAmount) > 0 ? `${parseFloat(cryptoAmount).toFixed(6)} ${coinInfo.symbol}` : coinInfo.symbol}
                  </motion.button>
                </>
              )}

              {status === 'signing' && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 size={36} className="text-beige animate-spin mb-4" />
                  <p className="text-foreground font-medium text-sm">Signing transaction...</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{coin === 'eth' ? 'Broadcasting to network' : 'Creating UTXO transaction'}</p>
                </div>
              )}

              {status === 'sent' && (
                <div className="flex flex-col items-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <CheckCircle size={44} className="text-success mb-4" />
                  </motion.div>
                  <p className="text-foreground font-medium text-sm mb-2">Transaction Sent!</p>
                  <p className="text-[10px] text-muted-foreground font-mono break-all text-center px-4 mb-4">{txHash}</p>
                  {explorerUrl && (
                    <motion.button className="h-9 px-4 rounded-xl glass text-xs text-foreground flex items-center gap-2" whileTap={{ scale: 0.97 }} onClick={() => window.open(explorerUrl, '_blank')}>
                      <ExternalLink size={12} /> Explorer
                    </motion.button>
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center py-8">
                  <AlertCircle size={44} className="text-destructive mb-4" />
                  <p className="text-foreground font-medium text-sm mb-2">Failed</p>
                  <p className="text-[10px] text-destructive/80 text-center px-4">{error}</p>
                  <motion.button className="mt-4 h-9 px-5 rounded-xl glass text-xs text-foreground" whileTap={{ scale: 0.97 }} onClick={() => setStatus('idle')}>
                    Try Again
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SendModal;
