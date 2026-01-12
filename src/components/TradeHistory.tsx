import React from 'react';
import { List } from 'react-window';
import type { ProcessedTrade } from '../types/binance';
import { clsx } from 'clsx';

interface TradeHistoryProps {
  trades: ProcessedTrade[];
}

interface RowProps {
  data: ProcessedTrade[];
}

const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: ProcessedTrade[] }) => {
  const trade = data[index];
  if (!trade) return null;

  return (
    <div 
      style={style} 
      className={clsx(
        "flex items-center justify-between px-4 text-xs font-mono border-b border-slate-800/50",
        index % 2 === 0 ? "bg-slate-900/30" : "bg-transparent"
      )}
    >
      <span className="text-slate-500 w-20">
        {new Date(trade.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className={clsx(
        "w-24 font-semibold text-right",
        trade.isBuyerMaker ? "text-red-400" : "text-emerald-400"
      )}>
        {trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </span>
      <span className="text-slate-300 w-24 text-right">
        {trade.quantity.toFixed(5)}
      </span>
    </div>
  );
};

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800">
        <span className="w-20">Time</span>
        <span className="w-24 text-right">Price (USDT)</span>
        <span className="w-24 text-right">Amount</span>
      </div>
      <div className="flex-1">
        <List
          rowCount={trades.length}
          rowHeight={35}
          rowComponent={Row}
          rowProps={{ data: trades }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};