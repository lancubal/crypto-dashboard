import { useState } from 'react';
import { useBinanceData } from './hooks/useBinanceData';
import type { Interval } from './types/binance';
import { PriceChart } from './components/PriceChart';
import { TradeHistory } from './components/TradeHistory';
import { Activity, Zap, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { clsx } from 'clsx';

function App() {
  const [interval, setInterval] = useState<Interval>('1m');
  const { klines, trades, isConnected, isLoadingHistory } = useBinanceData('btcusdt', interval);

  const latestPrice = trades[0]?.price || klines[klines.length - 1]?.close || 0;
  // Calculate 24h change approximation or just change from previous candle for now
  const prevPrice = trades[1]?.price || klines[klines.length - 2]?.close || 0;
  const isUp = latestPrice >= prevPrice;

  const intervals: Interval[] = ['1m', '15m', '1h', '4h', '1d'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-yellow-400 fill-yellow-400" />
            CryptoStream <span className="text-blue-500 text-sm bg-blue-500/10 px-2 py-1 rounded">PRO</span>
          </h1>
          <p className="text-slate-500 mt-1">Real-time market analytics via Binance WebSockets</p>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
          
          <div className="w-px h-8 bg-slate-800" />
          
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Latest BTC Price</span>
            <div className="flex items-center gap-2">
              <span className={clsx("text-xl font-mono font-bold", isUp ? 'text-emerald-400' : 'text-red-400')}>
                ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-end gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800 w-fit ml-auto">
            <Clock className="w-4 h-4 text-slate-500 ml-2 mr-1" />
            {intervals.map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  interval === int 
                    ? "bg-slate-700 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                {int}
              </button>
            ))}
          </div>

          <PriceChart data={klines} isLoading={isLoadingHistory} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard 
              icon={<Activity className="text-blue-400" />} 
              label="Volume (24h)" 
              value={klines.length > 0 ? `${(klines.reduce((acc, k) => acc + k.volume, 0) / 1000).toFixed(1)}K` : "---"} 
            />
            <StatsCard 
              icon={<TrendingUp className="text-purple-400" />} 
              label="Interval High" 
              value={klines.length > 0 ? `$${Math.max(...klines.map(k => k.high)).toLocaleString()}` : "---"} 
            />
            <StatsCard 
              icon={<ShieldCheck className="text-emerald-400" />} 
              label="Interval Low" 
              value={klines.length > 0 ? `$${Math.min(...klines.map(k => k.low)).toLocaleString()}` : "---"} 
            />
          </div>
        </div>

        {/* Side History Section */}
        <div className="lg:col-span-1">
          <TradeHistory trades={trades} />
        </div>
      </main>
    </div>
  );
}

function StatsCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
      <div className="p-3 bg-slate-950 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase font-bold">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

export default App;
