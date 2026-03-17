import { motion } from 'framer-motion';
import Sparkline from './Sparkline';
import type { CryptoPrice } from '@/hooks/useCryptoPrices';

interface CryptoRowProps {
  coin: CryptoPrice;
  index: number;
  onClick?: () => void;
}

const CryptoRow = ({ coin, index, onClick }: CryptoRowProps) => {
  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <motion.button
      className="flex items-center gap-3 py-3 px-1 w-full text-left"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0 text-lg">
        {coin.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{coin.name}</p>
        <p className="text-xs text-muted-foreground">{coin.symbol}</p>
      </div>
      <Sparkline
        data={coin.sparkline_in_7d}
        width={64}
        height={28}
        positive={isPositive}
      />
      <div className="text-right ml-2 min-w-[72px]">
        <p className="text-sm font-semibold text-foreground tabular-nums">
          €{coin.current_price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={`text-[11px] font-medium tabular-nums ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
        </p>
      </div>
    </motion.button>
  );
};

export default CryptoRow;
