import { useState } from 'react';
import { motion } from 'framer-motion';
import BankCard3D from '@/components/BankCard3D';
import SpendingChart from '@/components/SpendingChart';
import TransactionRow from '@/components/TransactionRow';
import CryptoRow from '@/components/CryptoRow';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Bell, TrendingUp, ArrowLeftRight } from 'lucide-react';

type Tab = 'banking' | 'crypto';

const Dashboard = () => {
  const { profile } = useProfile();
  const { transactions, loading } = useTransactions();
  const { prices, loading: cryptoLoading } = useCryptoPrices();
  const [tab, setTab] = useState<Tab>('banking');

  const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const weekSpending = transactions
    .filter(t => Number(t.amount) < 0 && new Date(t.date) > new Date(Date.now() - 7 * 86400000))
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return (
    <motion.div
      className="min-h-screen pb-24 px-5 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted-foreground text-sm">Good evening,</p>
          <h1 className="text-xl font-semibold text-foreground">{profile?.display_name || 'User'}</h1>
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
        <BankCard3D last4="4291" />
      </motion.div>

      {/* Balance */}
      <motion.div
        className="text-center mt-6 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">Current Balance</p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
        </p>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div
        className="flex gap-2 mb-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <button
          onClick={() => setTab('banking')}
          className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-300 ${
            tab === 'banking' ? 'gradient-beige text-primary-foreground' : 'glass text-muted-foreground'
          }`}
        >
          <ArrowLeftRight size={15} />
          Banking
        </button>
        <button
          onClick={() => setTab('crypto')}
          className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-300 ${
            tab === 'crypto' ? 'gradient-beige text-primary-foreground' : 'glass text-muted-foreground'
          }`}
        >
          <TrendingUp size={15} />
          Crypto
        </button>
      </motion.div>

      {/* Banking Tab */}
      {tab === 'banking' && (
        <motion.div
          key="banking"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Spending Chart */}
          <div className="glass rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-foreground">This Week</p>
              <p className="text-xs text-muted-foreground">€{weekSpending.toFixed(0)} spent</p>
            </div>
            <SpendingChart />
          </div>

          {/* Transactions */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Recent Transactions</p>
            <button className="text-xs text-beige-muted">See all</button>
          </div>
          <div className="glass rounded-2xl px-3 divide-y divide-border">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet. Connect your MLP account to sync.</div>
            ) : (
              transactions.map((t, i) => (
                <TransactionRow key={t.id} transaction={{
                  id: t.id,
                  name: t.name,
                  category: t.category || 'Other',
                  amount: Number(t.amount),
                  date: t.date,
                  icon: t.icon || 'ArrowLeftRight',
                }} index={i} />
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Crypto Tab */}
      {tab === 'crypto' && (
        <motion.div
          key="crypto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Live Markets</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-xs text-muted-foreground">Real-time</p>
            </div>
          </div>
          <div className="glass rounded-2xl px-3 divide-y divide-border">
            {cryptoLoading ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Loading prices...</div>
            ) : prices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Unable to fetch prices</div>
            ) : (
              prices.map((coin, i) => (
                <CryptoRow key={coin.id} coin={coin} index={i} />
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
