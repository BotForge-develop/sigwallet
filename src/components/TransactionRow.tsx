import { motion } from 'framer-motion';
import { ShoppingBag, Building2, Tv, Car, ShoppingCart, ArrowDownLeft, Dumbbell } from 'lucide-react';
import type { Transaction } from '@/lib/mockData';

const iconMap: Record<string, React.ElementType> = {
  ShoppingBag, Building2, Tv, Car, ShoppingCart, ArrowDownLeft, Dumbbell,
};

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
}

const TransactionRow = ({ transaction, index }: TransactionRowProps) => {
  const Icon = iconMap[transaction.icon] || ShoppingBag;
  const isPositive = transaction.amount > 0;

  return (
    <motion.div
      className="flex items-center gap-3 py-3 px-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{transaction.name}</p>
        <p className="text-xs text-muted-foreground">{transaction.category}</p>
      </div>
      <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-success' : 'text-foreground'}`}>
        {isPositive ? '+' : ''}{transaction.amount.toFixed(2)} €
      </p>
    </motion.div>
  );
};

export default TransactionRow;
