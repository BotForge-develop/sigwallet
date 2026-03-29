import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Monitor, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PairDevice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'confirm' | 'approving' | 'done' | 'error'>('confirm');
  const [error, setError] = useState<string | null>(null);

  const sessionToken = searchParams.get('token');

  const handleApprove = async () => {
    if (!sessionToken || !user) return;
    setStatus('approving');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Nicht angemeldet');
        setStatus('error');
        return;
      }

      const response = await supabase.functions.invoke('approve-pairing', {
        body: {
          session_token: sessionToken,
          device_name: 'macOS Desktop',
        },
      });

      if (response.error) {
        setError('Pairing fehlgeschlagen');
        setStatus('error');
        return;
      }

      setStatus('done');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('Verbindungsfehler');
      setStatus('error');
    }
  };

  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-liquid rounded-2xl p-8 text-center">
          <p className="text-foreground/50 text-sm">Ungültiger Pairing-Link</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-foreground/40 text-sm hover:text-foreground/60 transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="glass-liquid rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {status === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                <Monitor className="text-foreground/60" size={28} />
              </div>

              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">Gerät verbinden?</h2>
                <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
                  Ein macOS-Gerät möchte sich mit deinem SigWallet-Konto verbinden.
                </p>
              </div>

              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 w-full">
                <Shield className="text-beige/60 shrink-0" size={16} />
                <p className="text-foreground/40 text-[11px] leading-relaxed">
                  Das Gerät erhält Zugriff auf dein Konto. Du kannst den Zugriff jederzeit widerrufen.
                </p>
              </div>

              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 glass rounded-xl py-3 flex items-center justify-center gap-2 text-foreground/50 text-sm hover:text-foreground/70 transition-colors"
                >
                  <X size={16} />
                  Ablehnen
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 gradient-beige rounded-xl py-3 flex items-center justify-center gap-2 text-background text-sm font-medium"
                >
                  <Check size={16} />
                  Verbinden
                </button>
              </div>
            </motion.div>
          )}

          {status === 'approving' && (
            <motion.div
              key="approving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 border-2 border-beige/30 border-t-beige rounded-full animate-spin" />
              <p className="text-foreground/50 text-sm">Verbinde...</p>
            </motion.div>
          )}

          {status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Check className="text-green-400" size={28} />
              </div>
              <p className="text-foreground/70 text-sm font-medium">Gerät verbunden!</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <X className="text-destructive" size={28} />
              </div>
              <p className="text-foreground/50 text-sm">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="glass rounded-xl px-6 py-2 text-sm text-foreground/50"
              >
                Zurück
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PairDevice;
