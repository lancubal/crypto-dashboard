import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { ProcessedKline } from '../types/binance';

interface PriceChartProps {
  data: ProcessedKline[];
  isLoading: boolean;
}

const PriceChartComponent: React.FC<PriceChartProps> = ({ data, isLoading }) => {
  if (isLoading && data.length === 0) {
    return (
      <div className="h-[400px] w-full bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 flex items-center justify-center">
        <span className="text-slate-500 animate-pulse">Loading historical data...</span>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = data.map((k) => ({
    time: new Date(k.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDate: new Date(k.time).toLocaleString(),
    price: k.close, // Use closing price for the line
  }));

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const domain = [minPrice * 0.999, maxPrice * 1.001];

  return (
    <div className="h-[400px] w-full bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 relative">
      <h2 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">BTC/USDT Market Price</h2>
      
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            minTickGap={30}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={domain} 
            orientation="right" 
            tick={{ fill: '#64748b', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => val.toLocaleString()}
            width={60}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#3b82f6' }}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            labelFormatter={(_, payload) => payload[0]?.payload.fullDate || ''}
            formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PriceChart = React.memo(PriceChartComponent);