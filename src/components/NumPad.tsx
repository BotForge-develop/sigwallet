import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface NumPadProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
}

const NumPad = ({ value, onChange, onSend }: NumPadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  const handlePress = (key: string) => {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) onChange(value + '.');
    } else {
      // Limit decimal places to 2
      const parts = value.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      onChange(value + key);
    }
  };

  return (
    <div className="w-full">
      {/* Amount display */}
      <div className="text-center mb-6">
        <p className="text-4xl font-bold text-foreground tabular-nums">
          {value || '0'}<span className="text-muted-foreground ml-1">€</span>
        </p>
      </div>

      {/* Keys */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.map((key) => (
          <motion.button
            key={key}
            className="h-14 rounded-xl glass flex items-center justify-center text-lg font-medium text-foreground active:bg-secondary"
            whileTap={{ scale: 0.92 }}
            onClick={() => handlePress(key)}
          >
            {key === 'del' ? <Delete size={20} className="text-muted-foreground" /> : key}
          </motion.button>
        ))}
      </div>

      {/* Send button */}
      <motion.button
        className="w-full h-14 rounded-2xl gradient-beige text-primary-foreground font-semibold text-base"
        whileTap={{ scale: 0.97 }}
        onClick={onSend}
        disabled={!value || parseFloat(value) <= 0}
      >
        Senden
      </motion.button>
    </div>
  );
};

export default NumPad;
