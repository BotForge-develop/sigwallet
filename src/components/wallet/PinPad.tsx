import { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete, Lock } from 'lucide-react';

interface PinPadProps {
  title: string;
  subtitle: string;
  onComplete: (pin: string) => void;
}

const PinPad = ({ title, subtitle, onComplete }: PinPadProps) => {
  const [pin, setPin] = useState('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  const handlePress = (key: string) => {
    if (key === 'del') {
      setPin(prev => prev.slice(0, -1));
    } else if (key === '' ) {
      return;
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => onComplete(newPin), 200);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <Lock size={32} className="text-beige mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>

      {/* PIN dots */}
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i < pin.length
                ? 'bg-beige border-beige'
                : 'border-muted-foreground/30'
            }`}
            animate={i < pin.length ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.15 }}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
        {keys.map((key, idx) => (
          <motion.button
            key={idx}
            className={`h-16 rounded-2xl flex items-center justify-center text-xl font-medium ${
              key === '' ? 'invisible' : 'glass text-foreground active:bg-secondary'
            }`}
            whileTap={key ? { scale: 0.9 } : {}}
            onClick={() => handlePress(key)}
            disabled={key === ''}
          >
            {key === 'del' ? <Delete size={22} className="text-muted-foreground" /> : key}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default PinPad;
