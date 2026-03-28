import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BankCard3D from '@/components/BankCard3D';
import SpendingChart from '@/components/SpendingChart';
import TransactionRow from '@/components/TransactionRow';
import CryptoRow from '@/components/CryptoRow';
import { useProfile } from '@/hooks/useProfile';
import { useTransactions } from '@/hooks/useTransactions';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useWalletAddresses } from '@/hooks/useWalletAddresses';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { COINS, CoinType } from '@/lib/cryptoUtils';
import SendModal from '@/components/wallet/SendModal';
import BuyCryptoModal from '@/components/wallet/BuyCryptoModal';
import { TrendingUp, ArrowLeftRight, Send, Zap, Plus } from 'lucide-react';

const COIN_ID_MAP: Record<string, string> = {
  btc: 'bitcoin', eth: 'ethereum', ltc: 'litecoin',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { transactions, loading } = useTransactions();
  const { prices, loading: cryptoLoading } = useCryptoPrices();
  const { addresses, hasWallet } = useWalletAddresses();
  const { balances } = useWalletBalances(addresses);

  const [showSend, setShowSend] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [sendCoin, setSendCoin] = useState<CoinType>('btc');

  const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const weekSpending = transactions
    .filter(t => Number(t.amount) < 0 && new Date(t.date) > new Date(Date.now() - 7 * 86400000))
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const portfolioUsd = COINS.reduce((sum, coin) => {
    const bal = balances[coin.id];
    if (!bal || bal === '—') return sum;
    const price = prices.find(p => p.id === COIN_ID_MAP[coin.id]);
    if (!price) return sum;
    return sum + parseFloat(bal) * price.current_price;
  }, 0);

  const getUsdPrice = (coin: CoinType) => {
    const coingeckoId = COIN_ID_MAP[coin];
    return prices.find(p => p.id === coingeckoId)?.current_price;
  };

  const handleSend = (coin: CoinType) => {
    if (!hasWallet) { navigate('/wallet'); return; }
    setSendCoin(coin);
    setShowSend(true);
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Guten Morgen' : greetingHour < 18 ? 'Guten Tag' : 'Guten Abend';

  return (
    <motion.div
      className="min-h-screen pb-24 px-4 pt-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-muted-foreground text-xs">{greeting},</p>
          <h1 className="text-lg font-semibold text-foreground">{profile?.display_name || 'User'}</h1>
        </div>
      </div>

      {/* 3D Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.4, type: 'spring' }}
      >
        <BankCard3D last4="4291" />
      </motion.div>

      {/* Balance - Inline */}
      <motion.div
        className="text-center mt-4 mb-3"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-3xl font-bold text-foreground tracking-tight">
          {balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
        </p>
        {portfolioUsd > 0 && (
          <p className="text-xs text-beige-muted mt-0.5">
            + ${portfolioUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Crypto
          </p>
        )}
      </motion.div>

      {/* Quick Actions - Tighter */}
      <motion.div
        className="flex gap-2 mb-4"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <motion.button
          className="flex-1 h-11 rounded-xl glass text-xs font-medium flex items-center justify-center gap-1.5 text-foreground"
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/transfer')}
        >
          <ArrowLeftRight size={14} />
          Transfer
        </motion.button>
        <motion.button
          className="flex-1 h-11 rounded-xl gradient-beige text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5"
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowBuy(true)}
        >
          <Zap size={14} />
          Kaufen
        </motion.button>
        {!hasWallet && (
          <motion.button
            className="h-11 w-11 rounded-xl glass flex items-center justify-center"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/wallet')}
          >
            <Plus size={16} className="text-beige" />
          </motion.button>
        )}
      </motion.div>

      {/* Spending + Crypto side by side header */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Spending Mini */}
        <div className="glass rounded-2xl p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-foreground">Diese Woche</p>
            <p className="text-[10px] text-muted-foreground">€{weekSpending.toFixed(0)} ausgegeben</p>
          </div>
          <div className="h-[80px]">
            <SpendingChart />
          </div>
        </div>

        {/* Crypto Markets */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-beige" />
            <p className="text-xs font-medium text-foreground">Märkte</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
            <p className="text-[10px] text-muted-foreground">Live</p>
          </div>
        </div>

        <div className="glass rounded-2xl px-2 divide-y divide-border mb-3">
          {cryptoLoading ? (
            <div className="py-6 text-center text-muted-foreground text-xs">Laden...</div>
          ) : prices.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-xs">Keine Preise verfügbar</div>
          ) : (
            prices.map((coin, i) => {
              const walletCoinId = Object.entries(COIN_ID_MAP).find(([_, v]) => v === coin.id)?.[0] as CoinType | undefined;
              const coinBalance = walletCoinId ? balances[walletCoinId] : undefined;
              return (
                <CryptoRow key={coin.id} coin={coin} index={i} balance={coinBalance} />
              );
            })
          )}
        </div>

        {/* Quick send for held coins */}
        {hasWallet && (
          <div className="flex gap-1.5 mb-4">
            {COINS.map(coin => (
              <motion.button
                key={coin.id}
                className="flex-1 h-9 rounded-xl glass text-[10px] font-medium flex items-center justify-center gap-1 text-foreground"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSend(coin.id)}
              >
                <Send size={10} />
                {coin.symbol}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Transactions */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground">Letzte Transaktionen</p>
          <button className="text-[10px] text-beige-muted">Alle</button>
        </div>
        <div className="glass rounded-2xl px-2 divide-y divide-border">
          {loading ? (
            <div className="py-6 text-center text-muted-foreground text-xs">Laden...</div>
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-xs">Noch keine Transaktionen</div>
          ) : (
            transactions.slice(0, 5).map((t, i) => (
              <TransactionRow key={t.id} transaction={{
                id: t.id,
                name: t.name,
                category: t.category || 'Sonstiges',
                amount: Number(t.amount),
                date: t.date,
                icon: t.icon || 'ArrowLeftRight',
              }} index={i} />
            ))
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <SendModal
        open={showSend}
        onClose={() => setShowSend(false)}
        mnemonic=""
        coin={sendCoin}
        rpcUrl="https://eth.llamarpc.com"
        usdPrice={getUsdPrice(sendCoin)}
      />
      <BuyCryptoModal
        open={showBuy}
        onClose={() => setShowBuy(false)}
        defaultCoin="btc"
        walletAddress={addresses?.btc || ''}
      />
    </motion.div>
  );
};

export default Dashboard;
