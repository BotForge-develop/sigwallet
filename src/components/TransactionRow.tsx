import { motion } from 'framer-motion';
import { ShoppingBag, Building2, Tv, Car, ShoppingCart, ArrowDownLeft, Dumbbell, ArrowLeftRight } from 'lucide-react';
import type { Transaction } from '@/lib/mockData';

const iconMap: Record<string, React.ElementType> = {
  ShoppingBag, Building2, Tv, Car, ShoppingCart, ArrowDownLeft, Dumbbell, ArrowLeftRight,
};

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
}

const TransactionRow = ({ transaction, index }: TransactionRowProps) => {
  const Icon = iconMap[transaction.icon] || ArrowLeftRight;
  const isPositive = transaction.amount > 0;

  return (
    <motion.div
      className="flex items-center gap-2.5 py-2.5 px-1"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <div className="w-8 h-8 rounded-lg glass flex items-center justify-center shrink-0">
        <Icon size={14} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{transaction.name}</p>
        <p className="text-[10px] text-muted-foreground">{transaction.category}</p>
      </div>
      <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-success' : 'text-foreground'}`}>
        {isPositive ? '+' : ''}{transaction.amount.toFixed(2)} €
      </p>
    </motion.div>
  );
};

export default TransactionRow;
