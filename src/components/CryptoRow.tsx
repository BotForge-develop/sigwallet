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
      className="flex items-center gap-3 py-3.5 px-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center text-lg shrink-0">
        {coin.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{coin.symbol}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
            isPositive ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
          }`}>
            {isPositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{coin.name}</p>
        {balanceNum !== null && (
          <p className="text-[10px] text-beige-muted mt-0.5">
            {balanceNum.toFixed(balanceNum < 1 ? 6 : 4)} {coin.symbol}
            {holdingValue !== null && ` ≈ $${holdingValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        )}
      </div>
      <div className="w-16 h-8 shrink-0">
        <Sparkline data={coin.sparkline_in_7d} positive={isPositive} />
      </div>
      <div className="text-right shrink-0 min-w-[70px]">
        <p className="text-sm font-semibold text-foreground tabular-nums">
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
