import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionRow from '@/components/TransactionRow';

const CATEGORIES = ['Alle', 'Bank', 'Other', 'Transfer', 'Gehalt', 'Einkauf'];

const AllTransactions = () => {
  const navigate = useNavigate();
  const { transactions, loading } = useTransactions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Alle');

  const filtered = transactions.filter(t => {
    const matchSearch = !search || 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.counterpart_name?.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'Alle' || t.category === category;
    return matchSearch && matchCat;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, t) => {
    const day = new Date(t.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(t);
    return acc;
  }, {});

  return (
    <motion.div
      className="min-h-screen pb-24 px-4 pt-12 overflow-y-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} className="text-foreground" />
        </motion.button>
        <h1 className="text-base font-semibold text-foreground">Alle Transaktionen</h1>
        <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} Einträge</span>
      </div>

      {/* Search */}
      <div className="glass rounded-xl flex items-center gap-2 px-3 py-2 mb-3">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Suche nach Name, IBAN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map(cat => (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              category === cat 
                ? 'gradient-beige text-primary-foreground' 
                : 'glass text-muted-foreground'
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center text-muted-foreground text-xs py-8">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground text-xs py-8">Keine Transaktionen gefunden</div>
      ) : (
        Object.entries(grouped).map(([date, txs]) => (
          <div key={date} className="mb-3">
            <p className="text-[9px] text-muted-foreground font-medium mb-1 px-1">{date}</p>
            <div className="glass rounded-2xl px-2 divide-y divide-border">
              {txs.map((t, i) => (
                <TransactionRow
                  key={t.id}
                  transaction={{
                    id: t.id,
                    name: t.name,
                    category: t.category || 'Sonstiges',
                    amount: Number(t.amount),
                    date: t.date,
                    icon: t.icon || 'ArrowLeftRight',
                  }}
                  index={i}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
};

export default AllTransactions;