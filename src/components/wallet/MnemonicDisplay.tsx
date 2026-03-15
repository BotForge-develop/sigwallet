import { motion } from 'framer-motion';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MnemonicDisplayProps {
  mnemonic: string;
  onConfirm: () => void;
}

const MnemonicDisplay = ({ mnemonic, onConfirm }: MnemonicDisplayProps) => {
  const words = mnemonic.split(' ');
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-6 py-8">
      {/* Warning */}
      <motion.div
        className="glass rounded-2xl p-4 mb-6 border border-destructive/20"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Write this down!</p>
            <p className="text-xs text-muted-foreground mt-1">
              If you lose this seed phrase, your funds are gone forever. Never share it with anyone.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Seed phrase grid */}
      <div 
        className="grid grid-cols-3 gap-2 mb-6 cursor-pointer" 
        onClick={() => setRevealed(true)}
      >
        {words.map((word, i) => (
          <motion.div
            key={i}
            className="glass rounded-xl px-3 py-3 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <span className="text-[10px] text-muted-foreground absolute top-1 left-2">{i + 1}</span>
            <p className={`text-sm font-medium text-foreground mt-1 transition-all duration-300 ${
              !revealed ? 'blur-md select-none' : ''
            }`}>
              {word}
            </p>
          </motion.div>
        ))}
      </div>

      {!revealed && (
        <p className="text-xs text-muted-foreground text-center mb-4">Tap to reveal words</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <motion.button
          className="flex-1 h-12 rounded-xl glass flex items-center justify-center gap-2 text-sm text-foreground"
          whileTap={{ scale: 0.97 }}
          onClick={handleCopy}
        >
          {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy'}
        </motion.button>
      </div>

      <motion.button
        className="w-full h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold text-base"
        whileTap={{ scale: 0.97 }}
        onClick={onConfirm}
      >
        I've Saved My Seed Phrase
      </motion.button>
    </div>
  );
};

export default MnemonicDisplay;
