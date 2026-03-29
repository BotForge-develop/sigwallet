import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Monitor, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppleParticleCloud from '@/components/AppleParticleCloud';

const PairDevice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'input' | 'confirm' | 'approving' | 'done' | 'error'>('input');
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      const nextIdx = Math.min(digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
    } else {
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = value.length > 1 
      ? value.replace(/\D/g, '').slice(0, 6) 
      : newCode.join('');
    if (fullCode.length === 6) {
      lookupSession(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const lookupSession = async (pairingCode: string) => {
    const { data, error: fetchError } = await supabase
      .from('pairing_sessions')
      .select('session_token, status, expires_at')
      .eq('pairing_code', pairingCode)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !data) {
      setError('Ungültiger Code');
      setStatus('error');
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setError('Code abgelaufen');
      setStatus('error');
      return;
    }

    setSessionToken(data.session_token);
    setStatus('confirm');
  };

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
      setTimeout(() => navigate('/profile'), 2000);
    } catch {
      setError('Verbindungsfehler');
      setStatus('error');
    }
  };

  const resetFlow = () => {
    setCode(['', '', '', '', '', '']);
    setSessionToken(null);
    setError(null);
    setStatus('input');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="glass-liquid rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {status === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <AppleParticleCloud active={true} size={160} />

              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">Gerät verbinden</h2>
                <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
                  Gib den Code ein, der auf deinem Mac angezeigt wird
                </p>
              </div>

              {/* Code input */}
              <div className="flex items-center gap-2">
                {code.map((digit, i) => (
                  <div key={i} className="flex items-center">
                    <input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-10 h-12 glass rounded-xl text-center text-lg font-semibold text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                      autoFocus={i === 0}
                    />
                    {i === 2 && <div className="w-3" />}
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="text-foreground/40 text-sm hover:text-foreground/60 transition-colors mt-2"
              >
                Abbrechen
              </button>
            </motion.div>
          )}

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
                  onClick={resetFlow}
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
                onClick={resetFlow}
                className="glass rounded-xl px-6 py-2 text-sm text-foreground/50"
              >
                Erneut versuchen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PairDevice;
