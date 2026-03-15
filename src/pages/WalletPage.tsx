import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Wallet, Plus, ArrowLeft } from 'lucide-react';
import PinPad from '@/components/wallet/PinPad';
import MnemonicDisplay from '@/components/wallet/MnemonicDisplay';
import WalletDashboard from '@/components/wallet/WalletDashboard';

type Step = 'landing' | 'create-pin' | 'confirm-pin' | 'show-mnemonic' | 'unlock' | 'dashboard';

const RPC_URL = 'https://eth.llamarpc.com'; // free public RPC

const WalletPage = () => {
  const [step, setStep] = useState<Step>(() => {
    return localStorage.getItem('wallet_enc') ? 'unlock' : 'landing';
  });
  const [pin, setPin] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [wallet, setWallet] = useState<ethers.HDNodeWallet | null>(null);

  // Encrypt and store
  const encryptAndStore = useCallback(async (mnemonic: string, pin: string) => {
    // Simple XOR-based encryption with PIN (for local use only)
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    const pinBytes = encoder.encode(pin.repeat(Math.ceil(data.length / pin.length)));
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ pinBytes[i];
    }
    const hex = Array.from(encrypted).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('wallet_enc', hex);
  }, []);

  // Decrypt
  const decryptWallet = useCallback((pin: string): string | null => {
    const hex = localStorage.getItem('wallet_enc');
    if (!hex) return null;
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

  const handleUnlock = (enteredPin: string) => {
    const decrypted = decryptWallet(enteredPin);
    if (!decrypted) {
      setStep('landing');
      return;
    }
    try {
      const hdWallet = ethers.HDNodeWallet.fromPhrase(decrypted);
      setWallet(hdWallet);
      setMnemonic(decrypted);
      setStep('dashboard');
    } catch {
      // Wrong PIN — decrypted gibberish
      // Could add error state, for now just retry
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
            <WalletDashboard wallet={wallet} rpcUrl={RPC_URL} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WalletPage;
