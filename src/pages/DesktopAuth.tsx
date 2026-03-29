import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Check, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PairingStatus = 'generating' | 'waiting' | 'approved' | 'error' | 'expired';

const FiberCircle = ({ active }: { active: boolean }) => {
  const particles = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2;
    const radius = 90;
    return {
      id: i,
      cx: Math.cos(angle) * radius,
      cy: Math.sin(angle) * radius,
      length: 12 + Math.random() * 20,
      angle: angle * (180 / Math.PI) + (Math.random() - 0.5) * 30,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
    };
  });

  return (
    <div className="relative w-[240px] h-[240px] flex items-center justify-center">
      <svg
        viewBox="-130 -130 260 260"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="fiber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(210, 100%, 60%)" />
            <stop offset="50%" stopColor="hsl(200, 100%, 70%)" />
            <stop offset="100%" stopColor="hsl(220, 100%, 55%)" />
          </linearGradient>
          <filter id="fiber-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {particles.map((p) => (
          <motion.line
            key={p.id}
            x1={p.cx}
            y1={p.cy}
            x2={p.cx + Math.cos((p.angle * Math.PI) / 180) * p.length}
            y2={p.cy + Math.sin((p.angle * Math.PI) / 180) * p.length}
            stroke="url(#fiber-gradient)"
            strokeWidth={1.5}
            strokeLinecap="round"
            filter="url(#fiber-glow)"
            initial={{ opacity: 0.2, pathLength: 0.3 }}
            animate={
              active
                ? {
                    opacity: [0.2, 0.9, 0.2],
                    pathLength: [0.3, 1, 0.3],
                    strokeWidth: [1, 2.5, 1],
                  }
                : { opacity: 0.15, pathLength: 0.3 }
            }
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* Inner glow circle */}
        <motion.circle
          cx={0}
          cy={0}
          r={75}
          fill="none"
          stroke="hsl(210, 100%, 60%)"
          strokeWidth={0.5}
          opacity={0.3}
          animate={active ? { opacity: [0.1, 0.4, 0.1], r: [73, 77, 73] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      {/* Center content */}
      <div className="relative z-10 w-[150px] h-[150px] flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-background/80 backdrop-blur-xl border border-foreground/[0.08]" />
        <div className="relative z-10">{/* QR goes here via children */}</div>
      </div>
    </div>
  );
};

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

  // Subscribe to realtime changes
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

            // If we got tokens, set the session
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

    // Auto-expire after 5 minutes
    const timeout = setTimeout(() => {
      if (status === 'waiting') setStatus('expired');
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeout);
    };
  }, [sessionToken, status, navigate]);

  const qrData = sessionToken
    ? JSON.stringify({
        type: 'sigwallet_pair',
        token: sessionToken,
        url: window.location.origin,
      })
    : '';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Liquid Glass container */}
      <motion.div
        className="glass-liquid rounded-3xl p-10 max-w-md w-full flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="text-foreground/60" size={20} />
          <span className="text-foreground/30 text-xs">•••</span>
          <Smartphone className="text-foreground/60" size={20} />
        </div>

        <h1 className="text-xl font-semibold text-foreground tracking-tight text-center">
          Mit iPhone anmelden
        </h1>
        <p className="text-foreground/50 text-sm text-center leading-relaxed max-w-[280px]">
          Scanne den QR-Code mit deiner SigWallet App auf dem iPhone
        </p>

        {/* QR Code with Fiber Circle */}
        <AnimatePresence mode="wait">
          {status === 'waiting' && sessionToken && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="my-4"
            >
              <FiberCircle active={true}>
              </FiberCircle>
              <div className="flex justify-center -mt-[195px] mb-[105px] relative z-20">
                <QRCodeSVG
                  value={qrData}
                  size={110}
                  bgColor="transparent"
                  fgColor="hsl(45, 40%, 75%)"
                  level="M"
                  style={{ borderRadius: 8 }}
                />
              </div>
            </motion.div>
          )}

          {status === 'generating' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="my-4"
            >
              <FiberCircle active={false}>
              </FiberCircle>
              <div className="flex justify-center -mt-[195px] mb-[105px] relative z-20">
                <RefreshCw className="text-foreground/30 animate-spin" size={24} />
              </div>
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
                {status === 'expired' ? 'QR-Code abgelaufen' : error}
              </p>
              <button
                onClick={createPairingSession}
                className="glass rounded-xl px-6 py-2.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                Neuen Code generieren
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-foreground/[0.06]" />
          <span className="text-foreground/20 text-[10px] tracking-widest uppercase">oder</span>
          <div className="flex-1 h-px bg-foreground/[0.06]" />
        </div>

        {/* Fallback to regular login */}
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
