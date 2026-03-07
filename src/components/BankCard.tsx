import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface BankCardProps {
  last4: string;
}

const BankCard = ({ last4 }: BankCardProps) => {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[340px] aspect-[1.586/1] rounded-2xl overflow-hidden metallic-sheen p-6 flex flex-col justify-between"
      initial={{ rotateY: -8, rotateX: 5, scale: 0.95 }}
      animate={{ rotateY: 0, rotateX: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={{ rotateY: 5, rotateX: -3, scale: 1.02 }}
      style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
    >
      {/* Metallic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-foreground/[0.03] to-transparent pointer-events-none" />
      
      {/* Top row */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-foreground/60 text-[10px] font-medium tracking-[0.2em] uppercase">SimonDev</p>
          <p className="text-beige text-sm font-semibold tracking-wider mt-0.5">BLACK</p>
        </div>
        <Wifi className="text-foreground/30 rotate-90" size={20} />
      </div>

      {/* Chip */}
      <div className="relative z-10">
        <div className="w-10 h-7 rounded-md gradient-beige opacity-80" />
      </div>

      {/* Bottom row */}
      <div className="flex justify-between items-end relative z-10">
        <p className="text-foreground/50 text-sm font-light tracking-[0.25em]">•••• {last4}</p>
        <div className="flex flex-col items-end">
          <p className="text-foreground/30 text-[9px] tracking-wider">VALID THRU</p>
          <p className="text-foreground/50 text-xs">12/29</p>
        </div>
      </div>

      {/* Edge highlight */}
      <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
    </motion.div>
  );
};

export default BankCard;
