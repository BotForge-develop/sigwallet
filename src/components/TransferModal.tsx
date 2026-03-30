import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Shield, Smartphone, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type ModalState = 'idle' | 'authenticating' | 'awaiting-2fa' | 'success' | 'error';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  recipientName: string;
  recipientIban?: string;
  onSuccess: () => void;
}

const TransferModal = ({ isOpen, onClose, amount, recipientName, recipientIban, onSuccess }: TransferModalProps) => {
  const [state, setState] = useState<ModalState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) { setState('idle'); return; }

    const initiateTransfer = async () => {
      setState('authenticating');

      try {
        const { data, error } = await supabase.functions.invoke('initiate-transfer', {
          body: {
            amount,
            recipient_iban: recipientIban || '',
            recipient_name: recipientName,
          },
        });

        if (error) {
          setErrorMsg(error.message || 'Verbindung zur Bank fehlgeschlagen');
          setState('error');
          return;
        }

        if (data?.error) {
          setErrorMsg(data.error);
          setState('error');
          return;
        }

        // If the bridge requires 2FA
        if (data?.requires_2fa || data?.status === 'awaiting_tan') {
          setState('awaiting-2fa');
          // Poll or wait for completion — the bridge will complete the TAN flow
          // For now, show awaiting state for a reasonable time
          return;
        }

        setState('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unbekannter Fehler');
        setState('error');
      }
    };

    initiateTransfer();
  }, [isOpen]);

  const handleClose = () => {
    setState('idle');
    setErrorMsg('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-background/60 backdrop-blur-2xl" onClick={state === 'success' || state === 'error' ? handleClose : undefined} />

          <motion.div
            className="relative glass-liquid rounded-3xl p-8 w-full max-w-sm text-center border-0"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <AnimatePresence mode="wait">
              {state === 'authenticating' && (
                <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center">
                    <Shield size={28} className="text-beige" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">Authentifizierung</p>
                    <p className="text-muted-foreground text-sm mt-1">Verbinde mit MLP Bank...</p>
                  </div>
                  <Loader2 size={24} className="text-beige animate-spin" />
                </motion.div>
              )}

              {state === 'awaiting-2fa' && (
                <motion.div key="2fa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-4">
                  <motion.div className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Smartphone size={28} className="text-beige" />
                  </motion.div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">SecureGo+ TAN</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {amount.toFixed(2)} € an {recipientName}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2 animate-pulse">
                      Bitte bestätige in der SecureGo+ App...
                    </p>
                  </div>
                </motion.div>
              )}

              {state === 'success' && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
                  <motion.div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                    <Check size={36} className="text-success" strokeWidth={3} />
                  </motion.div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">Gesendet!</p>
                    <p className="text-muted-foreground text-sm mt-1">{amount.toFixed(2)} € an {recipientName}</p>
                  </div>
                </motion.div>
              )}

              {state === 'error' && (
                <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-destructive" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold text-lg">Fehlgeschlagen</p>
                    <p className="text-muted-foreground text-sm mt-1">{errorMsg}</p>
                  </div>
                  <button onClick={handleClose} className="glass rounded-xl px-6 py-2 text-sm text-foreground/60">
                    Schließen
                  </button>
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
