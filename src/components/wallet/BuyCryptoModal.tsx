import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ArrowRightLeft, Globe, ChevronRight, Zap } from 'lucide-react';
import { COINS, CoinType } from '@/lib/cryptoUtils';

interface BuyCryptoModalProps {
  open: boolean;
  onClose: () => void;
  defaultCoin?: CoinType;
  walletAddress?: string;
}

const PROVIDERS = [
  {
    id: 'transak',
    name: 'Transak',
    desc: 'Buy with card or bank transfer',
    icon: CreditCard,
    tag: 'No KYC < $150',
    url: (coin: string, address: string) =>
      `https://global.transak.com/?apiKey=dummyKey&cryptoCurrencyCode=${coin.toUpperCase()}&walletAddress=${address}&disableWalletAddressForm=true`,
  },
  {
    id: 'moonpay',
    name: 'MoonPay',
    desc: 'PayPal, Apple Pay, Card',
    icon: Globe,
    tag: 'Popular',
    url: (coin: string, address: string) =>
      `https://www.moonpay.com/buy/${coin.toLowerCase()}?walletAddress=${address}`,
  },
  {
    id: 'changenow',
    name: 'ChangeNow',
    desc: 'Swap crypto without limits',
    icon: ArrowRightLeft,
    tag: 'No KYC',
    url: (coin: string, _address: string) =>
      `https://changenow.io/exchange?to=${coin.toLowerCase()}`,
  },
];

const BuyCryptoModal = ({ open, onClose, defaultCoin = 'btc', walletAddress = '' }: BuyCryptoModalProps) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinType>(defaultCoin);
  const coinInfo = COINS.find(c => c.id === selectedCoin);

  const handleProviderClick = (provider: typeof PROVIDERS[0]) => {
    const url = provider.url(selectedCoin, walletAddress);
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="glass-strong rounded-t-3xl p-6 safe-bottom">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Zap size={20} className="text-beige" />
                  Buy Crypto
                </h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full glass flex items-center justify-center">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Coin Selector */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {COINS.map(coin => (
                  <motion.button
                    key={coin.id}
                    className={`shrink-0 h-9 px-4 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      selectedCoin === coin.id
                        ? 'gradient-beige text-primary-foreground'
                        : 'glass text-muted-foreground'
                    }`}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedCoin(coin.id)}
                  >
                    <span>{coin.icon}</span>
                    {coin.symbol}
                  </motion.button>
                ))}
              </div>

              {/* Provider List */}
              <div className="space-y-3">
                {PROVIDERS.map(provider => (
                  <motion.button
                    key={provider.id}
                    className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProviderClick(provider)}
                  >
                    <div className="w-11 h-11 rounded-xl glass-strong flex items-center justify-center shrink-0">
                      <provider.icon size={20} className="text-beige" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full glass text-beige font-medium">
                          {provider.tag}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{provider.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </motion.button>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-4">
                Purchases are processed by third-party providers. SigWallet never holds your funds.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuyCryptoModal;
