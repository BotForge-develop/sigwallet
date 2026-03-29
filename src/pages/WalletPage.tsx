import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Wallet, Plus, ArrowLeft } from 'lucide-react';
import PinPad from '@/components/wallet/PinPad';
import MnemonicDisplay from '@/components/wallet/MnemonicDisplay';
import WalletDashboard from '@/components/wallet/WalletDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'landing' | 'create-pin' | 'confirm-pin' | 'show-mnemonic' | 'unlock' | 'dashboard';

const RPC_URL = 'https://eth.llamarpc.com'; // free public RPC

const WalletPage = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(() => {
    return 'loading' as Step;
  });
  const [pin, setPin] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [wallet, setWallet] = useState<ethers.HDNodeWallet | null>(null);
  const [dbHasWallet, setDbHasWallet] = useState(false);

  // Check if wallet exists in DB on mount
  useEffect(() => {
    if (!user?.id) { setStep('landing'); return; }
    const check = async () => {
      const { data } = await supabase
        .from('encrypted_wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setDbHasWallet(true);
        setStep('unlock');
      } else if (localStorage.getItem('wallet_enc')) {
        // Legacy: has local wallet but not in DB yet
        setStep('unlock');
      } else {
        setStep('landing');
      }
    };
    check();
  }, [user?.id]);

  // Encrypt and store
  const encryptAndStore = useCallback(async (mnemonic: string, pin: string, saveToDb = true) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    const pinBytes = encoder.encode(pin.repeat(Math.ceil(data.length / pin.length)));
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ pinBytes[i];
    }
    const hex = Array.from(encrypted).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('wallet_enc', hex);

    // Also store in DB for persistence across devices/sessions
    if (saveToDb && user?.id) {
      const { error } = await supabase
        .from('encrypted_wallets')
        .upsert(
          { user_id: user.id, encrypted_mnemonic: hex, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) {
        console.error('Failed to store wallet in DB:', error);
      } else {
        setDbHasWallet(true);
      }
    }
  }, [user?.id]);

  // Decrypt
  const decryptFromHex = useCallback((hex: string, pin: string): string | null => {
    const encrypted = new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const encoder = new TextEncoder();
    const pinBytes = encoder.encode(pin.repeat(Math.ceil(encrypted.length / pin.length)));
    const decrypted = new Uint8Array(encrypted.length);
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ pinBytes[i];
    }
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }, []);

  const handleCreatePin = (newPin: string) => {
    setPin(newPin);
    setStep('confirm-pin');
  };

  const handleConfirmPin = (confirmPin: string) => {
    if (confirmPin !== pin) {
      // Reset — wrong confirmation
      setStep('create-pin');
      return;
    }
    // Generate wallet
    const randomWallet = ethers.Wallet.createRandom();
    const m = randomWallet.mnemonic!.phrase;
    setMnemonic(m);
    encryptAndStore(m, confirmPin);
    setStep('show-mnemonic');
  };

  const handleMnemonicConfirmed = () => {
    const hdWallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
    setWallet(hdWallet);
    setStep('dashboard');
  };

  const handleUnlock = async (enteredPin: string) => {
    // Try local first, then DB
    let hex = localStorage.getItem('wallet_enc');

    if (!hex && user?.id) {
      // Fetch from DB
      const { data } = await supabase
        .from('encrypted_wallets')
        .select('encrypted_mnemonic')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.encrypted_mnemonic) {
        hex = data.encrypted_mnemonic;
        // Cache locally
        localStorage.setItem('wallet_enc', hex);
      }
    }

    if (!hex) {
      setStep('landing');
      return;
    }

    try {
      const decrypted = decryptFromHex(hex, enteredPin);
      if (!decrypted) throw new Error('Empty');
      const hdWallet = ethers.HDNodeWallet.fromPhrase(decrypted);
      setWallet(hdWallet);
      setMnemonic(decrypted);

      // If not in DB yet, migrate it
      if (!dbHasWallet && user?.id) {
        await encryptAndStore(decrypted, enteredPin, true);
      }

      setStep('dashboard');
    } catch {
      toast.error('Falscher PIN');
      setStep('unlock');
    }
  };

  return (
    <motion.div
      className="min-h-screen pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-beige flex items-center justify-center">
            <Wallet size={18} className="text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Crypto Wallet</h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
      {(step as string) === 'loading' && (
        <div className="flex items-center justify-center pt-32">
          <div className="w-8 h-8 rounded-full border-2 border-beige border-t-transparent animate-spin" />
        </div>
      )}

        {step === 'landing' && (
          <motion.div
            key="landing"
            className="flex flex-col items-center justify-center px-6 pt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-6">
              <Wallet size={36} className="text-beige" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Non-Custodial Wallet</h2>
            <p className="text-sm text-muted-foreground text-center mb-8 max-w-[280px]">
              Your keys, your crypto. Generate a wallet that only you control.
            </p>
            <motion.button
              className="h-14 px-8 rounded-2xl gradient-beige text-primary-foreground font-semibold flex items-center gap-2"
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep('create-pin')}
            >
              <Plus size={18} />
              Create New Wallet
            </motion.button>
          </motion.div>
        )}

        {step === 'create-pin' && (
          <motion.div key="create-pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PinPad
              title="Set Your PIN"
              subtitle="Choose a 4-digit PIN to secure your wallet"
              onComplete={handleCreatePin}
            />
          </motion.div>
        )}

        {step === 'confirm-pin' && (
          <motion.div key="confirm-pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PinPad
              title="Confirm PIN"
              subtitle="Re-enter your 4-digit PIN"
              onComplete={handleConfirmPin}
            />
          </motion.div>
        )}

        {step === 'show-mnemonic' && (
          <motion.div key="mnemonic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MnemonicDisplay mnemonic={mnemonic} onConfirm={handleMnemonicConfirmed} />
          </motion.div>
        )}

        {step === 'unlock' && (
          <motion.div key="unlock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PinPad
              title="Unlock Wallet"
              subtitle="Enter your 4-digit PIN"
              onComplete={handleUnlock}
            />
          </motion.div>
        )}

        {step === 'dashboard' && wallet && (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WalletDashboard wallet={wallet} rpcUrl={RPC_URL} mnemonic={mnemonic} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WalletPage;
