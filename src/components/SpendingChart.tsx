import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { format, subDays, parseISO, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

const SpendingChart = () => {
  const { transactions } = useTransactions();

  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        day: format(date, 'EEE', { locale: de }),
        dateStr: format(date, 'yyyy-MM-dd'),
        amount: 0,
      };
    });

    // Sum outgoing (negative) transactions per day
    transactions.forEach((t) => {
      if (t.amount >= 0) return; // only outgoing
      const tDate = format(parseISO(t.date), 'yyyy-MM-dd');
      const dayEntry = days.find((d) => d.dateStr === tDate);
      if (dayEntry) {
        dayEntry.amount += Math.abs(t.amount);
      }
    });

    return days.map((d) => ({
      day: d.day,
      amount: Math.round(d.amount * 100) / 100,
    }));
  }, [transactions]);

  const total = chartData.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="w-full h-full">
      <div className="flex items-baseline justify-between mb-1 px-0.5">
        <span className="text-[9px] text-muted-foreground">Ausgaben letzte 7 Tage</span>
        <span className="text-[11px] font-semibold text-foreground">
          {total.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(60, 56%, 91%)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(60, 56%, 91%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 10, fontWeight: 400 }}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'hsl(0 0% 10%)',
              border: '1px solid hsl(0 0% 20%)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'hsl(60, 56%, 91%)',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} €`, 'Ausgaben']}
            labelStyle={{ color: 'hsl(0,0%,60%)' }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(60, 56%, 91%)"
            strokeWidth={1.5}
            fill="url(#spendingGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpendingChart;
