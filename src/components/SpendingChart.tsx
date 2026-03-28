import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { spendingData } from '@/lib/mockData';

const SpendingChart = () => {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={spendingData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
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
