import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowRight, Loader2, ScanFace } from 'lucide-react';
import { toast } from 'sonner';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  saveCredentials,
  getCredentials,
} from '@/lib/biometrics';
import liquidGlassAfter from '@/assets/apple-liquid-glass-after.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [biometricReady, setBiometricReady] = useState(false);
  const [showEnableBiometric, setShowEnableBiometric] = useState(false);
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string } | null>(null);

  // Check biometric availability on mount
  useEffect(() => {
    const check = async () => {
      const available = await isBiometricAvailable();
      setBiometricReady(available);

      // Auto-trigger Face ID if already enabled
      if (available && isBiometricEnabled()) {
        handleBiometricLogin();
      }
    };
    check();
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    try {
      const creds = await getCredentials();
      if (creds) {
        const { error } = await supabase.auth.signInWithPassword({
          email: creds.username,
          password: creds.password,
        });
        if (error) throw error;
        toast.success('Willkommen zurück!');
      }
    } catch (error: any) {
      // Face ID cancelled or credentials invalid – show normal login
      toast.error('Face ID fehlgeschlagen. Bitte manuell anmelden.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Prevent iOS WebView from auto-scrolling to focused inputs
  useEffect(() => {
    const preventScroll = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    };
    window.addEventListener('scroll', preventScroll, { passive: false });
    document.addEventListener('scroll', preventScroll, { passive: false });
    return () => {
      window.removeEventListener('scroll', preventScroll);
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => undefined);
    Keyboard.setScroll({ isDisabled: true }).catch(() => undefined);

    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      const offset = Math.min(Math.max(info.keyboardHeight - 220, 0), 120);
      setKeyboardOffset(offset);
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      });
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardOffset(0);
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
      });
    });

    return () => {
      Keyboard.setScroll({ isDisabled: false }).catch(() => undefined);
      showListener.then((listener) => listener.remove());
      hideListener.then((listener) => listener.remove());
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // After successful login, check if we should offer biometric setup
        const available = await isBiometricAvailable();
        if (available && !isBiometricEnabled()) {
          setPendingCreds({ email, password });
          setShowEnableBiometric(true);
          setLoading(false);
          return; // Don't navigate yet – show biometric prompt
        }

        toast.success('Welcome back!');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to verify.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    if (pendingCreds) {
      await saveCredentials(pendingCreds.email, pendingCreds.password);
      toast.success('Face ID aktiviert!');
    }
    setShowEnableBiometric(false);
    setPendingCreds(null);
  };

  const handleSkipBiometric = () => {
    setShowEnableBiometric(false);
    setPendingCreds(null);
  };

  return (
    <div className="relative h-full overflow-hidden px-6" style={{ touchAction: 'manipulation', overscrollBehavior: 'none' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-4 top-[max(env(safe-area-inset-top),1rem)] z-0 opacity-90">
          <div className="glass-liquid rounded-[2rem] p-2">
            <img
              src={liquidGlassAfter}
              alt="Apple Liquid Glass reference"
              className="h-24 w-full rounded-[1.5rem] object-cover opacity-70"
              loading="eager"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-accent/10 via-transparent to-transparent" />

        <div
          className="relative z-10 mx-auto flex h-full w-full max-w-sm flex-col"
          style={{
            transform: `translate3d(0, -${keyboardOffset}px, 0)`,
            transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
          }}
        >
          <motion.div
            className="shrink-0 pt-[max(env(safe-area-inset-top),3rem)]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mt-36 text-center">
              <div className="w-16 h-16 rounded-2xl gradient-beige mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">S</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">SimonDev</h1>
              <p className="text-sm text-muted-foreground mt-1">Private Banking</p>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {showEnableBiometric ? (
              <motion.div
                key="biometric-prompt"
                className="flex flex-1 flex-col items-center justify-center gap-6 pb-[max(env(safe-area-inset-bottom),2rem)]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
                  <ScanFace size={40} className="text-beige" />
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-foreground">Face ID aktivieren?</h2>
                  <p className="text-sm text-muted-foreground mt-2 px-4">
                    Melde dich beim nächsten Mal einfach mit Face ID an — schnell und sicher.
                  </p>
                </div>
                <div className="w-full space-y-3">
                  <motion.button
                    type="button"
                    className="w-full h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                    onClick={handleEnableBiometric}
                  >
                    <ScanFace size={20} />
                    Face ID aktivieren
                  </motion.button>
                  <button
                    type="button"
                    className="w-full text-center text-sm text-muted-foreground"
                    onClick={handleSkipBiometric}
                  >
                    Später
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="login-form"
                className="flex flex-1 flex-col justify-center pb-[max(env(safe-area-inset-bottom),2rem)]"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="w-full">
                  {!isLogin && (
                    <div className="mb-3 overflow-hidden">
                      <div className="flex items-center gap-3 glass rounded-2xl px-4 h-14">
                        <User size={18} className="text-muted-foreground flex-shrink-0" />
                        <input
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                          placeholder="Display Name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 glass rounded-2xl px-4 h-14 mb-3">
                    <Mail size={18} className="text-muted-foreground flex-shrink-0" />
                    <input
                      type="email"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center gap-3 glass rounded-2xl px-4 h-14 mb-6">
                    <Lock size={18} className="text-muted-foreground flex-shrink-0" />
                    <input
                      type="password"
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold text-base flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>

                  {/* Face ID quick-login button */}
                  {biometricReady && isBiometricEnabled() && isLogin && (
                    <motion.button
                      type="button"
                      className="w-full h-14 rounded-2xl border border-border/50 text-foreground font-medium text-sm flex items-center justify-center gap-2 mt-3"
                      whileTap={{ scale: 0.97 }}
                      onClick={handleBiometricLogin}
                      disabled={loading}
                    >
                      <ScanFace size={20} className="text-beige" />
                      Mit Face ID anmelden
                    </motion.button>
                  )}

                  <button
                    type="button"
                    className="w-full text-center mt-4 text-sm text-muted-foreground"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <span className="text-beige font-medium">{isLogin ? 'Sign Up' : 'Sign In'}</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
