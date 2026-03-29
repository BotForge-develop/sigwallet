import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Shield, Smartphone } from 'lucide-react';

type ModalState = 'idle' | 'authenticating' | 'awaiting-2fa' | 'success';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  recipientName: string;
  onSuccess: () => void;
}

const TransferModal = ({ isOpen, onClose, amount, recipientName, onSuccess }: TransferModalProps) => {
  const [state, setState] = useState<ModalState>('authenticating');

  useState(() => {
    if (!isOpen) return;
    setState('authenticating');
    const t1 = setTimeout(() => setState('awaiting-2fa'), 2000);
    const t2 = setTimeout(() => {
      setState('success');
      setTimeout(() => {
        onSuccess();
        onClose();
        setState('authenticating');
      }, 2000);
    }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Liquid Glass Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/60 backdrop-blur-2xl"
            onClick={state === 'success' ? onClose : undefined}
          />

          {/* Content */}
          <motion.div
            className="relative glass-liquid rounded-3xl p-8 w-full max-w-sm text-center border-0"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <AnimatePresence mode="wait">
              {state === 'authenticating' && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center">
                    <Shield size={28} className="text-beige" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">Authenticating</p>
                    <p className="text-muted-foreground text-sm mt-1">Connecting to MLP Bank...</p>
                  </div>
                  <Loader2 size={24} className="text-beige animate-spin" />
                </motion.div>
              )}

              {state === 'awaiting-2fa' && (
                <motion.div
                  key="2fa"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Smartphone size={28} className="text-beige" />
                  </motion.div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">SecureGo+ 2FA</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Confirm {amount.toFixed(2)} € to {recipientName}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2 animate-pulse">
                      Check your iPhone...
                    </p>
                  </div>
                </motion.div>
              )}

              {state === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Check size={36} className="text-success" strokeWidth={3} />
                  </motion.div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">Sent!</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {amount.toFixed(2)} € to {recipientName}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;
