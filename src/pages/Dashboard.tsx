import { motion } from 'framer-motion';
import BankCard from '@/components/BankCard';
import SpendingChart from '@/components/SpendingChart';
import TransactionRow from '@/components/TransactionRow';
import { currentUser, transactions } from '@/lib/mockData';
import { Bell } from 'lucide-react';

const Dashboard = () => {
  return (
    <motion.div
      className="min-h-screen pb-24 px-5 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted-foreground text-sm">Good evening,</p>
          <h1 className="text-xl font-semibold text-foreground">{currentUser.name}</h1>
        </div>
        <button className="w-10 h-10 rounded-xl glass flex items-center justify-center">
          <Bell size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
      >
        <BankCard last4={currentUser.cardLast4} />
      </motion.div>

      {/* Balance */}
      <motion.div
        className="text-center mt-6 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">Current Balance</p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {currentUser.balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
        </p>
      </motion.div>

      {/* Spending Chart */}
      <motion.div
        className="glass rounded-2xl p-4 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">This Week</p>
          <p className="text-xs text-muted-foreground">€1,050 spent</p>
        </div>
        <SpendingChart />
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-foreground">Recent Transactions</p>
          <button className="text-xs text-beige-muted">See all</button>
        </div>
        <div className="glass rounded-2xl px-3 divide-y divide-border">
          {transactions.map((t, i) => (
            <TransactionRow key={t.id} transaction={t} index={i} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
