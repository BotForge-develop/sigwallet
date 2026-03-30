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
import { ArrowLeftRight, Send, Zap, TrendingUp, Wallet } from 'lucide-react';

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

  const fiatBalance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const portfolioUsd = COINS.reduce((sum, coin) => {
    const bal = balances[coin.id];
    if (!bal || bal === '—') return sum;
    const price = prices.find(p => p.id === COIN_ID_MAP[coin.id]);
    if (!price) return sum;
    return sum + parseFloat(bal) * price.current_price;
  }, 0);

  const totalBalance = fiatBalance + portfolioUsd;

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
      className="min-h-screen pb-24 px-4 pt-12 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-2">
        <p className="text-muted-foreground text-[10px]">{greeting},</p>
        <h1 className="text-base font-semibold text-foreground">{profile?.display_name || 'User'}</h1>
      </div>

      {/* Card */}
      <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05, duration: 0.4, type: 'spring' }}>
        <BankCard3D
          last4="7678"
          holderName={profile?.display_name || 'User'}
          iban="DE80 6723 0000 0202 3376 78"
        />
        <p className="text-center text-[8px] text-muted-foreground mt-1">Halten für Details · Doppelklick zum Kopieren</p>
      </motion.div>

      {/* Total Balance */}
      <motion.div className="text-center mt-3 mb-2" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
        <p className="text-[10px] text-muted-foreground mb-0.5">Gesamtvermögen</p>
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {totalBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </p>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-[9px] text-muted-foreground">
            {fiatBalance.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € Konto
          </span>
          {portfolioUsd > 0 && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40" />
              <span className="text-[9px] text-beige-muted">
                {portfolioUsd.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € Crypto
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="flex gap-1.5 mb-3" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
        <motion.button className="flex-1 h-10 rounded-xl glass text-[10px] font-medium flex items-center justify-center gap-1.5 text-foreground" whileTap={{ scale: 0.97 }} onClick={() => navigate('/transfer')}>
          <ArrowLeftRight size={12} /> Transfer
        </motion.button>
        <motion.button className="flex-1 h-10 rounded-xl gradient-beige text-primary-foreground text-[10px] font-medium flex items-center justify-center gap-1.5" whileTap={{ scale: 0.97 }} onClick={() => setShowBuy(true)}>
          <Zap size={12} /> Kaufen
        </motion.button>
        {hasWallet && (
          <motion.button className="h-10 w-10 rounded-xl glass flex items-center justify-center" whileTap={{ scale: 0.97 }} onClick={() => navigate('/wallet')}>
            <Wallet size={14} className="text-beige" />
          </motion.button>
        )}
      </motion.div>

      {/* Spending */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="glass rounded-2xl p-2.5 mb-2.5">
          <p className="text-[10px] font-medium text-foreground mb-1">Diese Woche</p>
          <div className="h-[60px]">
            <SpendingChart />
          </div>
        </div>
      </motion.div>

      {/* Crypto */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingUp size={10} className="text-beige" />
          <p className="text-[10px] font-medium text-foreground">Märkte</p>
          <div className="flex items-center gap-1 ml-auto">
            <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
            <p className="text-[8px] text-muted-foreground">Live</p>
          </div>
        </div>

        <div className="glass rounded-2xl px-2 divide-y divide-border mb-2.5">
          {cryptoLoading ? (
            <div className="py-4 text-center text-muted-foreground text-[10px]">Laden...</div>
          ) : prices.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-[10px]">Keine Preise</div>
          ) : (
            prices.map((coin, i) => {
              const walletCoinId = Object.entries(COIN_ID_MAP).find(([_, v]) => v === coin.id)?.[0] as CoinType | undefined;
              const coinBalance = walletCoinId ? balances[walletCoinId] : undefined;
              return (
                <div key={coin.id} className="flex items-center gap-1">
                  <div className="flex-1">
                    <CryptoRow coin={coin} index={i} balance={coinBalance} />
                  </div>
                  {hasWallet && walletCoinId && (
                    <motion.button
                      className="shrink-0 w-7 h-7 rounded-lg glass flex items-center justify-center mr-1"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSend(walletCoinId)}
                    >
                      <Send size={10} className="text-beige" />
                    </motion.button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Transactions */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-medium text-foreground">Letzte Transaktionen</p>
          <button className="text-[8px] text-beige-muted" onClick={() => navigate('/transactions')}>Alle →</button>
        </div>
        <div className="glass rounded-2xl px-2 divide-y divide-border">
          {loading ? (
            <div className="py-4 text-center text-muted-foreground text-[10px]">Laden...</div>
          ) : transactions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-[10px]">Noch keine Transaktionen</div>
          ) : (
            transactions.slice(0, 4).map((t, i) => (
              <TransactionRow key={t.id} transaction={{
                id: t.id, name: t.name, category: t.category || 'Sonstiges',
                amount: Number(t.amount), date: t.date, icon: t.icon || 'ArrowLeftRight',
              }} index={i} />
            ))
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <SendModal open={showSend} onClose={() => setShowSend(false)} mnemonic="" coin={sendCoin} rpcUrl="https://eth.llamarpc.com" usdPrice={getUsdPrice(sendCoin)} />
      <BuyCryptoModal open={showBuy} onClose={() => setShowBuy(false)} defaultCoin="btc" walletAddress={addresses?.btc || ''} />
    </motion.div>
  );
};

export default Dashboard;
