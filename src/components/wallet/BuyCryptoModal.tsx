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
    id: 'transak', name: 'Transak', desc: 'Card or bank transfer', icon: CreditCard, tag: 'No KYC < $150',
    url: (coin: string, address: string) => `https://global.transak.com/?apiKey=dummyKey&cryptoCurrencyCode=${coin.toUpperCase()}&walletAddress=${address}&disableWalletAddressForm=true`,
  },
  {
    id: 'moonpay', name: 'MoonPay', desc: 'PayPal, Apple Pay', icon: Globe, tag: 'Popular',
    url: (coin: string, address: string) => `https://www.moonpay.com/buy/${coin.toLowerCase()}?walletAddress=${address}`,
  },
  {
    id: 'changenow', name: 'ChangeNow', desc: 'Swap without limits', icon: ArrowRightLeft, tag: 'No KYC',
    url: (coin: string) => `https://changenow.io/exchange?to=${coin.toLowerCase()}`,
  },
];

const BuyCryptoModal = ({ open, onClose, defaultCoin = 'btc', walletAddress = '' }: BuyCryptoModalProps) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinType>(defaultCoin);

  const handleProviderClick = (provider: typeof PROVIDERS[0]) => {
    window.open(provider.url(selectedCoin, walletAddress), '_blank');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-background/60 backdrop-blur-2xl z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed bottom-0 left-0 right-0 z-[70] max-w-md mx-auto" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
            <div className="glass-liquid rounded-t-3xl p-5 safe-bottom border-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Zap size={16} className="text-beige" /> Kaufen
                </h3>
                <button onClick={onClose} className="w-7 h-7 rounded-full glass flex items-center justify-center">
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                {COINS.map(coin => (
                  <motion.button
                    key={coin.id}
                    className={`shrink-0 h-8 px-3 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors ${selectedCoin === coin.id ? 'gradient-beige text-primary-foreground' : 'glass text-muted-foreground'}`}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedCoin(coin.id)}
                  >
                    <span>{coin.icon}</span>{coin.symbol}
                  </motion.button>
                ))}
              </div>

              <div className="space-y-2">
                {PROVIDERS.map(provider => (
                  <motion.button key={provider.id} className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left" whileTap={{ scale: 0.98 }} onClick={() => handleProviderClick(provider)}>
                    <div className="w-9 h-9 rounded-lg glass-liquid flex items-center justify-center shrink-0">
                      <provider.icon size={16} className="text-beige" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground">{provider.name}</p>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full glass text-beige font-medium">{provider.tag}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{provider.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  </motion.button>
                ))}
              </div>

              <p className="text-[8px] text-muted-foreground text-center mt-3">Third-party providers process all purchases.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuyCryptoModal;
