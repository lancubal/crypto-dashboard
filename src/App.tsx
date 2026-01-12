import { useState } from 'react';
import { useBinanceData } from './hooks/useBinanceData';
import type { Interval } from './types/binance';
import { PriceChart } from './components/PriceChart';
import { TradeHistory } from './components/TradeHistory';
import { Activity, Zap, TrendingUp, ShieldCheck, Clock, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { ASSETS } from './constants/assets';

function App() {
  const [activeAssetId, setActiveAssetId] = useState('btcusdt');
  const [interval, setInterval] = useState<Interval>('1m');
  
  const activeAsset = ASSETS.find(a => a.id === activeAssetId) || ASSETS[0];
  const { klines, trades, isConnected, isLoadingHistory } = useBinanceData(activeAssetId, interval);

  const latestPrice = trades[0]?.price || klines[klines.length - 1]?.close || 0;
  const intervals: Interval[] = ['1m', '15m', '1h', '4h', '1d'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="text-yellow-400 fill-yellow-400" />
            CryptoStream <span className="text-blue-500 text-sm bg-blue-500/10 px-2 py-1 rounded">PRO</span>
          </h1>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="relative group z-10">
              <button className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-blue-500 px-4 py-2 rounded-lg transition-all min-w-[140px] justify-between">
                <span className="font-semibold">{activeAsset.name}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {/* Dropdown with invisible bridge (padding-top) to prevent closing on hover */}
              <div className="absolute top-full left-0 pt-2 w-48 hidden group-hover:block">
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  {ASSETS.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => setActiveAssetId(asset.id)}
                    className={clsx(
                      "w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors flex justify-between items-center",
                      asset.id === activeAssetId ? "text-blue-400 bg-slate-800/50" : "text-slate-300"
                    )}
                  >
                    <span>{asset.name}</span>
                    <span className="text-xs font-mono text-slate-500">{asset.symbol}</span>
                  </button>
                ))}
                </div>
              </div>
            </div>
            
            <span className="text-slate-500 text-sm border-l border-slate-800 pl-4">
              {activeAsset.symbol}/USDT
            </span>
          </div>
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
            <span className="text-[10px] text-slate-500 uppercase font-bold">Latest Price</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-bold text-slate-200">
                ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{activeAsset.name} Price Chart</h2>
            
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
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
          </div>

          <PriceChart 
            data={klines} 
            isLoading={isLoadingHistory} 
            title={`${activeAsset.symbol}/USDT`}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard 
              icon={<Activity className="text-blue-400" />} 
              label="Volume (Period)" 
              value={klines.length > 0 ? `${(klines.reduce((acc, k) => acc + k.volume, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "---"} 
            />
            <StatsCard 
              icon={<TrendingUp className="text-purple-400" />} 
              label="Period High" 
              value={klines.length > 0 ? `$${Math.max(...klines.map(k => k.high)).toLocaleString()}` : "---"} 
            />
            <StatsCard 
              icon={<ShieldCheck className="text-emerald-400" />} 
              label="Period Low" 
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