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

  // Calculate change for color logic (Green if close > open of the visible period)
  const firstPrice = data[0]?.open || 0;
  const lastPrice = data[data.length - 1]?.close || 0;
  const isProfit = lastPrice >= firstPrice;
  const color = isProfit ? '#10b981' : '#ef4444'; // Emerald-500 or Red-500

  // Format data for Recharts
  const chartData = data.map((k, i) => {
    const prevClose = i > 0 ? data[i - 1].close : k.open;
    const changePercent = ((k.close - prevClose) / prevClose) * 100;

    return {
      time: new Date(k.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullDate: new Date(k.time).toLocaleString(),
      price: k.close,
      change: changePercent,
      isUp: changePercent >= 0
    };
  });

  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.05; // 5% padding
  const domain = [minPrice - padding, maxPrice + padding];

  return (
    <div className="h-[400px] w-full bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 relative transition-colors duration-500" style={{ borderColor: `${color}30` }}>
      <h2 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider flex justify-between">
        <span>BTC/USDT Market Price</span>
        <span style={{ color: color }} className="font-mono">
          {isProfit ? '+' : ''}{((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}% (Period)
        </span>
      </h2>
      
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
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
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-400 text-xs mb-1">{data.fullDate}</p>
                    <p className="text-lg font-bold font-mono text-white">
                      ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs font-bold ${data.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {data.isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(3)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
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
