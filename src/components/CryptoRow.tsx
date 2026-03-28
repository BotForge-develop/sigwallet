import { motion } from 'framer-motion';
import Sparkline from './Sparkline';
import type { CryptoPrice } from '@/hooks/useCryptoPrices';

interface CryptoRowProps {
  coin: CryptoPrice;
  index: number;
  balance?: string | null;
  onClick?: () => void;
}

const CryptoRow = ({ coin, index, balance, onClick }: CryptoRowProps) => {
  const isPositive = coin.price_change_percentage_24h >= 0;
  const balanceNum = balance && balance !== '—' ? parseFloat(balance) : null;
  const holdingValue = balanceNum !== null ? balanceNum * coin.current_price : null;

  return (
    <motion.div
      className="flex items-center gap-2.5 py-2.5 px-1"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
    >
      <div className="w-8 h-8 rounded-lg glass-strong flex items-center justify-center text-sm shrink-0">
        {coin.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-semibold text-foreground">{coin.symbol}</p>
          <span className={`text-[9px] font-medium px-1 py-px rounded ${
            isPositive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
          }`}>
            {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(1)}%
          </span>
        </div>
        {balanceNum !== null ? (
          <p className="text-[10px] text-beige-muted">
            {balanceNum.toFixed(balanceNum < 1 ? 6 : 4)} {coin.symbol}
            {holdingValue !== null && ` · $${holdingValue.toFixed(2)}`}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground">{coin.name}</p>
        )}
      </div>
      <div className="w-12 h-6 shrink-0">
        <Sparkline data={coin.sparkline_in_7d} positive={isPositive} />
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-foreground tabular-nums">
          ${coin.current_price.toLocaleString('en-US', {
            minimumFractionDigits: coin.current_price < 1 ? 4 : 2,
            maximumFractionDigits: coin.current_price < 1 ? 6 : 2,
          })}
        </p>
      </div>
    </motion.div>
  );
};

export default CryptoRow;
