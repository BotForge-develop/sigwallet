import { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

const Sparkline = ({ data, width = 80, height = 32, positive = true }: SparklineProps) => {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);

    return data
      .map((val, i) => {
        const x = i * stepX;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  const color = positive ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default Sparkline;
