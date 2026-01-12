import React, { useMemo } from 'react';
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
  // Memoize processed data to avoid recalculations on every render
  const { chartData, minPrice, maxPrice, isProfitGlobal, lastPrice, firstPrice } = useMemo(() => {
    if (data.length === 0) return { chartData: [], minPrice: 0, maxPrice: 0, isProfitGlobal: false, lastPrice: 0, firstPrice: 0 };

    const first = data[0].open;
    const last = data[data.length - 1].close;
    
    const processed = data.map((k, i) => {
      const prevClose = i > 0 ? data[i - 1].close : k.open;
      const changePercent = ((k.close - prevClose) / prevClose) * 100;
      return {
        time: new Date(k.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullDate: new Date(k.time).toLocaleString(),
        price: k.close,
        change: changePercent,
        isUp: k.close >= prevClose // Green if current close is higher than previous close
      };
    });

    const prices = processed.map(d => d.price);
    return {
      chartData: processed,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      isProfitGlobal: last >= first,
      lastPrice: last,
      firstPrice: first
    };
  }, [data]);

  if (isLoading && data.length === 0) {
    return (
      <div className="h-[400px] w-full bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 flex items-center justify-center">
        <span className="text-slate-500 animate-pulse">Loading historical data...</span>
      </div>
    );
  }

  const padding = (maxPrice - minPrice) * 0.05;
  const domain = [minPrice - padding, maxPrice + padding];

  // Colors
  const green = '#10b981';
  const red = '#ef4444';

  // Generate dynamic gradient stops for the multicolored line
  const gradientStops = chartData.map((d, index) => {
    if (index === 0) return null; // Skip first point for logic, handle start manually
    
    const prev = chartData[index - 1];
    // A segment connects index-1 to index. Color should represent the trend of that segment.
    // If point[i] > point[i-1], the segment is UP (green).
    const isSegmentUp = d.price >= prev.price;
    const segmentColor = isSegmentUp ? green : red;

    const offsetStart = (index - 1) / (chartData.length - 1);
    const offsetEnd = index / (chartData.length - 1);

    return (
      <React.Fragment key={index}>
        <stop offset={offsetStart} stopColor={segmentColor} />
        <stop offset={offsetEnd} stopColor={segmentColor} />
      </React.Fragment>
    );
  });

  return (
    <div className="h-[400px] w-full bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 relative">
      <h2 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider flex justify-between">
        <span>BTC/USDT Market Price</span>
        <span className={isProfitGlobal ? 'text-emerald-500' : 'text-red-500 font-mono'}>
          {isProfitGlobal ? '+' : ''}{((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)}% (Period)
        </span>
      </h2>
      
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData}>
          <defs>
            {/* Dynamic Gradient for the Line (Stroke) */}
            <linearGradient id="segmentColors" x1="0" y1="0" x2="1" y2="0">
              {gradientStops}
            </linearGradient>
            
            {/* Subtle Gradient for the Fill Area (using global trend color) */}
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isProfitGlobal ? green : red} stopOpacity={0.1} />
              <stop offset="95%" stopColor={isProfitGlobal ? green : red} stopOpacity={0} />
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
            content={({ active, payload }) => {
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
            stroke="url(#segmentColors)" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#areaFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PriceChart = React.memo(PriceChartComponent);