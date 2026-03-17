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
import { Bell, TrendingUp, ArrowLeftRight, Send, Zap, Wallet, Plus } from 'lucide-react';

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

  // Calculate total crypto portfolio value in USD
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

  const getMnemonic = () => {
    // Mnemonic is only available after PIN unlock on WalletPage
    // Return empty - SendModal will need wallet to be unlocked
    return '';
  };

  const handleSend = (coin: CoinType) => {
    if (!hasWallet) {
      navigate('/wallet');
      return;
    }
    setSendCoin(coin);
    setShowSend(true);
  };

  const handleBuy = () => {
    setShowBuy(true);
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

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
          <p className="text-muted-foreground text-sm">{greeting},</p>
          <h1 className="text-xl font-semibold text-foreground">{profile?.display_name || 'User'}</h1>
        </div>
        <button className="w-10 h-10 rounded-xl glass flex items-center justify-center">
          <Bell size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* 3D Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
      >
        <BankCard3D last4="4291" />
      </motion.div>

      {/* Total Balance (Fiat + Crypto) */}
      <motion.div
        className="text-center mt-6 mb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-muted-foreground text-xs tracking-widest uppercase mb-1">Bank Balance</p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
        </p>
        {portfolioUsd > 0 && (
          <p className="text-sm text-beige-muted mt-1">
            + ${portfolioUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} crypto
          </p>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="flex gap-2 mb-6 mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <motion.button
          className="flex-1 h-12 rounded-xl glass text-sm font-medium flex items-center justify-center gap-2 text-foreground"
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/transfer')}
        >
          <ArrowLeftRight size={16} />
          Transfer
        </motion.button>
        <motion.button
          className="flex-1 h-12 rounded-xl gradient-beige text-primary-foreground text-sm font-medium flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
          onClick={handleBuy}
        >
          <Zap size={16} />
          Buy Crypto
        </motion.button>
        {!hasWallet && (
          <motion.button
            className="h-12 w-12 rounded-xl glass flex items-center justify-center"
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/wallet')}
          >
            <Plus size={18} className="text-beige" />
          </motion.button>
        )}
      </motion.div>

      {/* Crypto Portfolio */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-beige" />
            <p className="text-sm font-medium text-foreground">Crypto Markets</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <p className="text-xs text-muted-foreground">Live</p>
          </div>
        </div>

        <div className="glass rounded-2xl px-3 divide-y divide-border mb-6">
          {cryptoLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading prices...</div>
          ) : prices.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Unable to fetch prices</div>
          ) : (
            prices.map((coin, i) => {
              const walletCoinId = Object.entries(COIN_ID_MAP).find(([_, v]) => v === coin.id)?.[0] as CoinType | undefined;
              const coinBalance = walletCoinId ? balances[walletCoinId] : undefined;
              return (
                <CryptoRow
                  key={coin.id}
                  coin={coin}
                  index={i}
                  balance={coinBalance}
                />
              );
            })
          )}
        </div>

        {/* Wallet send buttons for coins user holds */}
        {hasWallet && (
          <div className="flex gap-2 mb-6">
            {COINS.map(coin => (
              <motion.button
                key={coin.id}
                className="flex-1 h-10 rounded-xl glass text-xs font-medium flex items-center justify-center gap-1.5 text-foreground"
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSend(coin.id)}
              >
                <Send size={12} />
                {coin.symbol}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Banking Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35 }}
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
            <div className="py-8 text-center text-muted-foreground text-sm">No transactions yet</div>
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
