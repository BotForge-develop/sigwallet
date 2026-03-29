import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Check, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AppleParticleCloud from '@/components/AppleParticleCloud';

type PairingStatus = 'generating' | 'waiting' | 'approved' | 'error' | 'expired';

const DesktopAuth = () => {
  const [status, setStatus] = useState<PairingStatus>('generating');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createPairingSession = useCallback(async () => {
    setStatus('generating');
    setError(null);

    const { data, error: insertError } = await supabase
      .from('pairing_sessions')
      .insert({ status: 'pending' })
      .select('session_token')
      .single();

    if (insertError || !data) {
      setError('Pairing-Session konnte nicht erstellt werden');
      setStatus('error');
      return;
    }

    setSessionToken(data.session_token);
    setStatus('waiting');
  }, []);

  useEffect(() => {
    createPairingSession();
  }, [createPairingSession]);

  useEffect(() => {
    if (!sessionToken || status !== 'waiting') return;

    const channel = supabase
      .channel(`pairing-${sessionToken}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pairing_sessions',
          filter: `session_token=eq.${sessionToken}`,
        },
        async (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'approved') {
            setStatus('approved');
            if (updated.access_token && updated.refresh_token) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: updated.access_token,
                refresh_token: updated.refresh_token,
              });
              if (!sessionError) {
                setTimeout(() => navigate('/'), 1500);
              }
            }
          } else if (updated.status === 'expired') {
            setStatus('expired');
          }
        }
      )
      .subscribe();

    const timeout = setTimeout(() => {
      if (status === 'waiting') setStatus('expired');
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [sessionToken, status, navigate]);

  // QR data encoded behind the particle animation
  const qrData = sessionToken
    ? JSON.stringify({ type: 'sigwallet_pair', token: sessionToken })
    : '';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <motion.div
        className="glass-liquid rounded-3xl p-10 max-w-md w-full flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="text-foreground/60" size={20} />
          <span className="text-foreground/30 text-xs">•••</span>
          <Smartphone className="text-foreground/60" size={20} />
        </div>

        <h1 className="text-xl font-semibold text-foreground tracking-tight text-center">
          Mit iPhone anmelden
        </h1>
        <p className="text-foreground/50 text-sm text-center leading-relaxed max-w-[280px]">
          Öffne SigWallet auf deinem iPhone und halte es an den Bildschirm
        </p>

        <AnimatePresence mode="wait">
          {status === 'waiting' && sessionToken && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 my-2 relative"
            >
              {/* Hidden QR code behind particles — camera can still read it */}
              <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.03]">
                <QRCodeSVG
                  value={qrData}
                  size={180}
                  bgColor="transparent"
                  fgColor="white"
                  level="M"
                />
              </div>
              <div className="relative z-10">
                <AppleParticleCloud active={true} size={220} />
              </div>
              <p className="text-foreground/25 text-[11px]">
                Warte auf Verbindung…
              </p>
            </motion.div>
          )}

          {status === 'generating' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="my-8 flex flex-col items-center gap-4"
            >
              <AppleParticleCloud active={false} size={220} />
              <RefreshCw className="text-foreground/30 animate-spin" size={20} />
            </motion.div>
          )}

          {status === 'approved' && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-8 flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Check className="text-green-400" size={36} />
              </div>
              <p className="text-foreground/70 text-sm font-medium">Verbunden!</p>
            </motion.div>
          )}

          {(status === 'expired' || status === 'error') && (
            <motion.div
              key="expired"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="my-8 flex flex-col items-center gap-4"
            >
              <p className="text-foreground/50 text-sm">
                {status === 'expired' ? 'Verbindung abgelaufen' : error}
              </p>
              <button
                onClick={createPairingSession}
                className="glass rounded-xl px-6 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Erneut versuchen
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-foreground/[0.06]" />
          <span className="text-foreground/20 text-[10px] tracking-widest uppercase">oder</span>
          <div className="flex-1 h-px bg-foreground/[0.06]" />
        </div>

        <button
          onClick={() => navigate('/auth')}
          className="text-foreground/40 text-sm hover:text-foreground/60 transition-colors"
        >
          Mit E-Mail & Passwort anmelden
        </button>
      </motion.div>

      <p className="text-foreground/15 text-[10px] mt-8 tracking-wider">
        SigWallet · macOS
      </p>
    </div>
  );
};

export default DesktopAuth;
