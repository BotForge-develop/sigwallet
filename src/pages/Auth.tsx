import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-16 h-16 rounded-2xl gradient-beige mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary-foreground">S</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">SimonDev</h1>
        <p className="text-sm text-muted-foreground mt-1">Private Banking</p>
      </motion.div>

      {/* Form */}
      <motion.form
        className="w-full max-w-sm"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <div className="flex items-center gap-3 glass rounded-2xl px-4 h-14">
                <User size={18} className="text-muted-foreground flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        <button
          type="button"
          className="w-full text-center mt-4 text-sm text-muted-foreground"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span className="text-beige font-medium">{isLogin ? 'Sign Up' : 'Sign In'}</span>
        </button>
      </motion.form>
    </div>
  );
};

export default Auth;
