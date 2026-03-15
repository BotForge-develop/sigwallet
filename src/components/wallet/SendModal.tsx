import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { ethers } from 'ethers';

interface SendModalProps {
  open: boolean;
  onClose: () => void;
  wallet: ethers.HDNodeWallet | null;
  rpcUrl: string;
}

const SendModal = ({ open, onClose, wallet, rpcUrl }: SendModalProps) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'signing' | 'sent' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!wallet || !to || !amount) return;

    try {
      setStatus('signing');
      setError('');
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = wallet.connect(provider);

      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      setTxHash(tx.hash);
      setStatus('sent');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setTo('');
    setAmount('');
    setStatus('idle');
    setTxHash('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="glass-strong rounded-t-3xl p-6 safe-bottom">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Send ETH</h3>
                <button onClick={handleClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {status === 'idle' && (
                <>
                  {/* To address */}
                  <div className="mb-4">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Recipient Address</label>
                    <input
                      className="w-full h-12 rounded-xl glass px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none font-mono"
                      placeholder="0x..."
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                    />
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <label className="text-xs text-muted-foreground mb-1.5 block">Amount (ETH)</label>
                    <input
                      type="number"
                      className="w-full h-12 rounded-xl glass px-4 text-sm text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      step="0.001"
                    />
                  </div>

                  <motion.button
                    className="w-full h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSend}
                    disabled={!to || !amount}
                  >
                    <Send size={18} />
                    Sign & Send
                  </motion.button>
                </>
              )}

              {status === 'signing' && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 size={40} className="text-beige animate-spin mb-4" />
                  <p className="text-foreground font-medium">Signing transaction...</p>
                  <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                </div>
              )}

              {status === 'sent' && (
                <div className="flex flex-col items-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle size={48} className="text-success mb-4" />
                  </motion.div>
                  <p className="text-foreground font-medium mb-2">Transaction Sent!</p>
                  <p className="text-xs text-muted-foreground font-mono break-all text-center px-4">
                    {txHash}
                  </p>
                </div>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-center py-8">
                  <AlertCircle size={48} className="text-destructive mb-4" />
                  <p className="text-foreground font-medium mb-2">Failed</p>
                  <p className="text-xs text-destructive/80 text-center px-4">{error}</p>
                  <motion.button
                    className="mt-4 h-10 px-6 rounded-xl glass text-sm text-foreground"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStatus('idle')}
                  >
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
